import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const EXCLUDED_DIRECTORIES = new Set([
  ".firebase",
  ".git",
  "coverage",
  "node_modules",
  "reference-images",
]);
const SAMPLE_ENV_FILES = new Set([".env.example", ".env.sample"]);
const APPROVED_PUBLIC_ENV_NAMES = new Set([
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
  "VITE_RECAPTCHA_SITE_KEY",
]);
const APPROVED_BILLING_GUARD_ENV_NAMES = new Set(["BILLING_GUARD_DRY_RUN"]);
const APPROVED_BUILD_ENV_NAMES = new Set([
  "BASE_URL",
  "DEV",
  "MODE",
  "PROD",
  "SSR",
  ...APPROVED_PUBLIC_ENV_NAMES,
]);
const RECOVERY_FIXTURE_DIRECTORIES = new Set(["docs", "tests"]);
const PACKAGE_DIRECTORIES = [".", "functions", "billing-guard"];
const MAX_SCANNED_FILE_BYTES = 16 * 1024 * 1024;

const joinPattern = (...parts) => parts.join("");
const PRIVATE_KEY_MARKER = new RegExp(
  joinPattern("-----BEGIN ", "(?:RSA |EC |OPENSSH |DSA )?", "PRIVATE KEY-----")
);
const SERVICE_ACCOUNT_TYPE = new RegExp(
  joinPattern('"type"\\s*:\\s*"', "service", "_account", '"')
);
const PRIVATE_KEY_FIELD = new RegExp(joinPattern('"private', '_key"\\s*:'));
const GITHUB_TOKEN = new RegExp(
  joinPattern("(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{40,})")
);
const AWS_ACCESS_KEY = new RegExp(joinPattern("AK", "IA[0-9A-Z]{16}"));
const SLACK_TOKEN = new RegExp(joinPattern("xox", "[baprs]-[A-Za-z0-9-]{20,}"));
const STRIPE_SECRET = new RegExp(joinPattern("sk_", "live_[A-Za-z0-9]{16,}"));
const GOOGLE_OAUTH_ACCESS_TOKEN = new RegExp(
  joinPattern("ya", "29\\.[A-Za-z0-9._~-]{20,}")
);
const REFRESH_TOKEN_FIELD = new RegExp(
  joinPattern('"refresh', '_token"\\s*:\\s*"[^"\\r\\n]{10,}"')
);
const RECOVERY_CODE = new RegExp(joinPattern("\\bDH-", "[A-Z0-9]{4}-[A-Z0-9]{4}\\b"), "g");
const RECOVERY_CODE_PLACEHOLDERS = new Set([
  ["DH", "XXXX", "XXXX"].join("-"),
  ["DH", "XXXX", "YYYY"].join("-"),
  ["DH", "ABCD", "EFGH"].join("-"),
]);
const BUILD_ENV_REFERENCE = /(?:import\.meta\.env\.|\b)(VITE_[A-Z0-9_]+)/g;
const SENSITIVE_ENV_NAME = /(?:SECRET|TOKEN|PASSWORD|PRIVATE|SERVICE_ACCOUNT|CREDENTIAL)/;

const KNOWN_SECRET_PATTERNS = [
  ["private-key material", PRIVATE_KEY_MARKER],
  ["GitHub access token", GITHUB_TOKEN],
  ["AWS access key", AWS_ACCESS_KEY],
  ["Slack access token", SLACK_TOKEN],
  ["live Stripe secret key", STRIPE_SECRET],
  ["Google OAuth access token", GOOGLE_OAUTH_ACCESS_TOKEN],
  ["OAuth refresh token field", REFRESH_TOKEN_FIELD],
];

function normaliseRelativePath(rootDir, absolutePath) {
  return path.relative(rootDir, absolutePath).split(path.sep).join("/");
}

function addFinding(findings, finding) {
  const key = `${finding.level}:${finding.path}:${finding.message}`;
  if (!findings.some((candidate) => candidate.key === key)) {
    findings.push({ ...finding, key });
  }
}

async function collectFiles(rootDir) {
  const files = [];

  async function visit(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory() && EXCLUDED_DIRECTORIES.has(entry.name)) continue;

      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await visit(absolutePath);
      } else if (entry.isFile()) {
        files.push(absolutePath);
      }
    }
  }

  await visit(rootDir);
  return files;
}

async function readTextFile(absolutePath) {
  const metadata = await stat(absolutePath);
  if (metadata.size > MAX_SCANNED_FILE_BYTES) return null;

  const buffer = await readFile(absolutePath);
  if (buffer.includes(0)) return null;
  return buffer.toString("utf8");
}

function isEnvironmentFile(fileName) {
  return fileName === ".env" || fileName.startsWith(".env.");
}

function isEnvironmentFileIgnored(gitignore, fileName) {
  const rules = gitignore
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && !line.startsWith("!"));

  return rules.some(
    (rule) =>
      rule === fileName ||
      rule === `/${fileName}` ||
      rule === ".env*" ||
      (rule === "*.local" && fileName.endsWith(".local"))
  );
}

function parseEnvironmentNames(text) {
  const names = [];
  const invalidLines = [];

  for (const [index, rawLine] of text.split(/\r?\n/u).entries()) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/.exec(line);
    if (match) names.push(match[1]);
    else invalidLines.push(index + 1);
  }

  return { names, invalidLines };
}

function isRecoveryFixturePath(relativePath) {
  const [firstSegment] = relativePath.split("/");
  return (
    RECOVERY_FIXTURE_DIRECTORIES.has(firstSegment) ||
    relativePath.startsWith("functions/tests/") ||
    relativePath.endsWith(".log")
  );
}

function isPlaceholderRecoveryCode(code) {
  return RECOVERY_CODE_PLACEHOLDERS.has(code);
}

function isProductionBuildFile(relativePath) {
  return (
    relativePath.startsWith("src/") ||
    relativePath.startsWith("public/") ||
    relativePath.startsWith("dist/") ||
    relativePath.startsWith("functions/lib/") ||
    relativePath === "index.html" ||
    relativePath === "vite.config.ts"
  );
}

function approvedEnvironmentSettings(relativePath) {
  if (relativePath.startsWith("billing-guard/")) {
    return {
      names: APPROVED_BILLING_GUARD_ENV_NAMES,
      description: "billing guard runtime",
    };
  }
  return {
    names: APPROVED_PUBLIC_ENV_NAMES,
    description: "public browser",
  };
}

function inspectEnvironmentFile(relativePath, text, gitignore, findings) {
  const fileName = path.posix.basename(relativePath);
  const { names, invalidLines } = parseEnvironmentNames(text);
  const approvedSettings = approvedEnvironmentSettings(relativePath);

  if (SAMPLE_ENV_FILES.has(fileName)) {
    addFinding(findings, {
      level: "notice",
      path: relativePath,
      message: `environment template checked (${names.length} variable name(s), values not displayed)`,
    });
  } else if (!isEnvironmentFileIgnored(gitignore, fileName)) {
    addFinding(findings, {
      level: "error",
      path: relativePath,
      message: "environment file is not covered by a repository ignore rule",
    });
  }

  for (const name of names) {
    if (!approvedSettings.names.has(name)) {
      addFinding(findings, {
        level: "error",
        path: relativePath,
        message: `environment variable ${name} is not an approved ${approvedSettings.description} setting`,
      });
    }
  }

  if (invalidLines.length > 0) {
    addFinding(findings, {
      level: "error",
      path: relativePath,
      message: `environment file has unrecognised content on line(s) ${invalidLines.join(", ")}`,
    });
  }

  if (names.length > 0 && names.every((name) => approvedSettings.names.has(name))) {
    addFinding(findings, {
      level: "notice",
      path: relativePath,
      message: `approved ${approvedSettings.description} setting(s) found: ${names.join(", ")}; values were not printed`,
    });
  }
}

function inspectSensitiveFileName(relativePath, findings) {
  const fileName = path.posix.basename(relativePath).toLowerCase();
  const isCredentialName =
    /service[-_]?account/u.test(fileName) ||
    fileName === "serviceaccountkey.json" ||
    /\.(?:pem|p12|pfx|key)$/u.test(fileName);

  if (isCredentialName) {
    addFinding(findings, {
      level: "error",
      path: relativePath,
      message: "credential or private-key filename is stored inside the project folder",
    });
  }
}

function inspectText(relativePath, text, findings) {
  for (const [description, pattern] of KNOWN_SECRET_PATTERNS) {
    if (pattern.test(text)) {
      addFinding(findings, {
        level: "error",
        path: relativePath,
        message: `${description} detected; the matched value was not printed`,
      });
    }
  }

  if (SERVICE_ACCOUNT_TYPE.test(text) && PRIVATE_KEY_FIELD.test(text)) {
    addFinding(findings, {
      level: "error",
      path: relativePath,
      message: "Firebase service-account credential detected; field values were not printed",
    });
  }

  if (!isRecoveryFixturePath(relativePath)) {
    for (const match of text.matchAll(RECOVERY_CODE)) {
      if (!isPlaceholderRecoveryCode(match[0])) {
        addFinding(findings, {
          level: "error",
          path: relativePath,
          message:
            "Recovery Code-shaped value found outside approved test or documentation fixtures",
        });
        break;
      }
    }
  }

  if (isProductionBuildFile(relativePath)) {
    for (const match of text.matchAll(BUILD_ENV_REFERENCE)) {
      const name = match[1];
      if (!APPROVED_BUILD_ENV_NAMES.has(name) || SENSITIVE_ENV_NAME.test(name)) {
        addFinding(findings, {
          level: "error",
          path: relativePath,
          message: `unsafe build-time environment reference ${name} would be exposed to the browser`,
        });
      }
    }

    if (/JSON\.stringify\s*\(\s*import\.meta\.env\s*\)|\.\.\.\s*import\.meta\.env/u.test(text)) {
      addFinding(findings, {
        level: "error",
        path: relativePath,
        message: "the complete build-time environment object must not be exposed to browser code",
      });
    }

    if (relativePath === "vite.config.ts" && /define\s*:[\s\S]*process\.env/u.test(text)) {
      addFinding(findings, {
        level: "error",
        path: relativePath,
        message: "Vite configuration appears to expose process.env to the browser bundle",
      });
    }
  }
}

async function runSecretChecks(rootDir) {
  const findings = [];
  const gitignorePath = path.join(rootDir, ".gitignore");
  let gitignore = "";

  try {
    gitignore = await readFile(gitignorePath, "utf8");
  } catch {
    addFinding(findings, {
      level: "error",
      path: ".gitignore",
      message: "missing .gitignore prevents environment-file protection from being verified",
    });
  }

  for (const absolutePath of await collectFiles(rootDir)) {
    const relativePath = normaliseRelativePath(rootDir, absolutePath);
    inspectSensitiveFileName(relativePath, findings);

    const text = await readTextFile(absolutePath);
    if (text === null) continue;
    if (isEnvironmentFile(path.basename(absolutePath))) {
      inspectEnvironmentFile(relativePath, text, gitignore, findings);
    }
    inspectText(relativePath, text, findings);
  }

  return findings;
}

function sortedEntries(value = {}) {
  return Object.entries(value).sort(([left], [right]) => left.localeCompare(right));
}

function dependencyMapsMatch(left, right) {
  return JSON.stringify(sortedEntries(left)) === JSON.stringify(sortedEntries(right));
}

async function readJson(absolutePath, label, findings) {
  try {
    return JSON.parse(await readFile(absolutePath, "utf8"));
  } catch {
    addFinding(findings, {
      level: "error",
      path: label,
      message: "file is missing or is not valid JSON",
    });
    return null;
  }
}

async function inspectPackageLockfile(rootDir, packageDirectory, findings) {
  const packageRoot = path.join(rootDir, packageDirectory);
  const displayPath = (fileName) =>
    packageDirectory === "." ? fileName : `${packageDirectory}/${fileName}`;
  const initialFindingCount = findings.length;
  const lockfiles = ["package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lock", "bun.lockb"];
  const presentLockfiles = [];

  for (const lockfile of lockfiles) {
    try {
      await stat(path.join(packageRoot, lockfile));
      presentLockfiles.push(lockfile);
    } catch {
      // The absence of lockfile formats not used by this project is expected.
    }
  }

  if (presentLockfiles.length !== 1 || presentLockfiles[0] !== "package-lock.json") {
    addFinding(findings, {
      level: "error",
      path: packageDirectory,
      message: `expected only package-lock.json; found ${presentLockfiles.join(", ") || "no lockfile"}`,
    });
    return;
  }

  const packageJson = await readJson(
    path.join(packageRoot, "package.json"),
    displayPath("package.json"),
    findings
  );
  const lockfile = await readJson(
    path.join(packageRoot, "package-lock.json"),
    displayPath("package-lock.json"),
    findings
  );
  if (!packageJson || !lockfile) return;

  if (lockfile.lockfileVersion !== 3) {
    addFinding(findings, {
      level: "error",
      path: displayPath("package-lock.json"),
      message: `expected npm lockfileVersion 3, found ${String(lockfile.lockfileVersion)}`,
    });
  }

  const lockRoot = lockfile.packages?.[""];
  if (!lockRoot) {
    addFinding(findings, {
      level: "error",
      path: displayPath("package-lock.json"),
      message: "missing the root package entry",
    });
    return;
  }

  for (const dependencyType of ["dependencies", "devDependencies"]) {
    if (!dependencyMapsMatch(packageJson[dependencyType], lockRoot[dependencyType])) {
      addFinding(findings, {
        level: "error",
        path: displayPath("package-lock.json"),
        message: `${dependencyType} do not exactly match package.json`,
      });
    }

    for (const dependencyName of Object.keys(packageJson[dependencyType] ?? {})) {
      if (!lockfile.packages?.[`node_modules/${dependencyName}`]) {
        addFinding(findings, {
          level: "error",
          path: displayPath("package-lock.json"),
          message: `direct ${dependencyType} entry ${dependencyName} has no locked package`,
        });
      }
    }
  }

  if (lockfile.name !== packageJson.name || lockRoot.name !== packageJson.name) {
    addFinding(findings, {
      level: "error",
      path: displayPath("package-lock.json"),
      message: "root package name does not match package.json",
    });
  }
  if (lockfile.version !== packageJson.version || lockRoot.version !== packageJson.version) {
    addFinding(findings, {
      level: "error",
      path: displayPath("package-lock.json"),
      message: "root package version does not match package.json",
    });
  }

  if (findings.length === initialFindingCount) {
    addFinding(findings, {
      level: "notice",
      path: displayPath("package-lock.json"),
      message: "lockfile exactly matches package.json direct dependencies",
    });
  }
}

async function runLockfileChecks(rootDir) {
  const findings = [];

  for (const packageDirectory of PACKAGE_DIRECTORIES) {
    if (packageDirectory !== ".") {
      try {
        await stat(path.join(rootDir, packageDirectory, "package.json"));
      } catch {
        continue;
      }
    }
    await inspectPackageLockfile(rootDir, packageDirectory, findings);
  }

  return findings;
}

function printFindings(findings) {
  for (const finding of findings) {
    const label = finding.level === "error" ? "ERROR" : "OK";
    console.log(`[${label}] ${finding.path}: ${finding.message}`);
  }
}

export async function runLocalSafetyChecks({ rootDir, scope = "all" }) {
  const resolvedRoot = path.resolve(rootDir);
  const findings = [];

  if (scope === "all" || scope === "secrets") {
    findings.push(...(await runSecretChecks(resolvedRoot)));
  }
  if (scope === "all" || scope === "lockfile") {
    findings.push(...(await runLockfileChecks(resolvedRoot)));
  }

  return findings.map(({ key: _key, ...finding }) => finding);
}

function parseArguments(argumentsList) {
  let rootDir = process.cwd();
  let scope = "all";

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === "--root") {
      rootDir = argumentsList[index + 1];
      index += 1;
    } else if (argument === "--secrets") {
      scope = "secrets";
    } else if (argument === "--lockfile") {
      scope = "lockfile";
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (!rootDir) throw new Error("--root requires a directory path");
  return { rootDir, scope };
}

const isCommandLineEntry = process.argv[1]
  ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  : false;

if (isCommandLineEntry) {
  try {
    const options = parseArguments(process.argv.slice(2));
    console.log("Local-only safety check: no network requests or source uploads are performed.");
    const findings = await runLocalSafetyChecks(options);
    printFindings(findings);

    const errorCount = findings.filter((finding) => finding.level === "error").length;
    if (errorCount > 0) {
      console.error(`Local safety check failed with ${errorCount} blocking finding(s).`);
      process.exitCode = 1;
    } else {
      console.log("Local safety check passed.");
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
