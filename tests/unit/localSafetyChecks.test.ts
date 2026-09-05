import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const checkerPath = resolve(process.cwd(), "scripts/checkLocalSafety.mjs");
const temporaryDirectories: string[] = [];
const APPROVED_PUBLIC_ENV_NAMES = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
  "VITE_RECAPTCHA_SITE_KEY",
] as const;

function createFixture() {
  const root = mkdtempSync(resolve(tmpdir(), "dh-local-safety-"));
  temporaryDirectories.push(root);
  mkdirSync(resolve(root, "src"));
  mkdirSync(resolve(root, "tests"));
  mkdirSync(resolve(root, "functions", "src"), { recursive: true });
  mkdirSync(resolve(root, "functions", "tests"), { recursive: true });

  const dependencies = { react: "^19.2.0" };
  const packageJson = {
    name: "safety-fixture",
    version: "1.0.0",
    dependencies,
    devDependencies: {},
  };
  const packageLock = {
    name: "safety-fixture",
    version: "1.0.0",
    lockfileVersion: 3,
    requires: true,
    packages: {
      "": packageJson,
      "node_modules/react": { version: "19.2.0" },
    },
  };

  writeFileSync(resolve(root, ".gitignore"), ".env*\n!.env.example\n");
  writeFileSync(resolve(root, "package.json"), JSON.stringify(packageJson));
  writeFileSync(resolve(root, "package-lock.json"), JSON.stringify(packageLock));
  writeFileSync(
    resolve(root, "src/app.ts"),
    "export const key = import.meta.env.VITE_FIREBASE_API_KEY;\n"
  );
  return root;
}

function createPackageFixture(root: string, directory: string, name: string) {
  const packageRoot = resolve(root, directory);
  const dependencies = { typescript: "~5.9.3" };
  const packageJson = {
    name,
    version: "1.0.0",
    dependencies,
    devDependencies: {},
  };
  const packageLock = {
    name,
    version: "1.0.0",
    lockfileVersion: 3,
    requires: true,
    packages: {
      "": packageJson,
      "node_modules/typescript": { version: "5.9.3" },
    },
  };

  mkdirSync(packageRoot, { recursive: true });
  writeFileSync(resolve(packageRoot, "package.json"), JSON.stringify(packageJson));
  writeFileSync(resolve(packageRoot, "package-lock.json"), JSON.stringify(packageLock));
}

function runChecker(root: string, scope?: "--secrets" | "--lockfile") {
  return spawnSync(process.execPath, [checkerPath, "--root", root, ...(scope ? [scope] : [])], {
    encoding: "utf8",
  });
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("local safety checker", () => {
  it("passes a consistent lockfile and the exact approved public browser settings", () => {
    const root = createFixture();
    writeFileSync(
      resolve(root, ".env"),
      APPROVED_PUBLIC_ENV_NAMES.map((name) => `${name}=fixture-${name}`).join("\n") + "\n"
    );

    const result = runChecker(root);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("no network requests or source uploads");
    for (const name of APPROVED_PUBLIC_ENV_NAMES) {
      expect(result.stdout).not.toContain(`fixture-${name}`);
    }
  });

  it("rejects environment variables that would expose sensitive build values", () => {
    const root = createFixture();
    writeFileSync(resolve(root, ".env.production"), "VITE_ADMIN_SECRET=do-not-print-this-value\n");
    writeFileSync(
      resolve(root, "src/app.ts"),
      "export const unsafe = import.meta.env.VITE_ADMIN_SECRET;\n"
    );

    const result = runChecker(root, "--secrets");

    expect(result.status).toBe(1);
    expect(result.stdout).toContain("VITE_ADMIN_SECRET");
    expect(result.stdout).not.toContain("do-not-print-this-value");
  });

  it("permits the approved billing guard runtime setting only inside billing-guard", () => {
    const root = createFixture();
    mkdirSync(resolve(root, "billing-guard"));
    writeFileSync(resolve(root, "billing-guard", ".env.example"), "BILLING_GUARD_DRY_RUN=\n");

    const approved = runChecker(root, "--secrets");

    expect(approved.status).toBe(0);
    expect(approved.stdout).toContain("approved billing guard runtime setting(s)");

    writeFileSync(resolve(root, ".env.local"), "BILLING_GUARD_DRY_RUN=do-not-print\n");
    writeFileSync(
      resolve(root, "billing-guard", ".env.example"),
      "BILLING_GUARD_DRY_RUN=\nBILLING_GUARD_TOKEN=do-not-print\n"
    );
    const rejected = runChecker(root, "--secrets");

    expect(rejected.status).toBe(1);
    expect(rejected.stdout).toContain("BILLING_GUARD_DRY_RUN");
    expect(rejected.stdout).toContain("BILLING_GUARD_TOKEN");
    expect(rejected.stdout).not.toContain("do-not-print");
  });

  it("rejects service-account JSON and private-key material without printing values", () => {
    const root = createFixture();
    const credentialType = ["service", "account"].join("_");
    const privateKeyField = ["private", "key"].join("_");
    const privateKey = ["-----BEGIN", "PRIVATE KEY-----", "fixture-value"].join(" ");
    writeFileSync(
      resolve(root, "credential.json"),
      JSON.stringify({ type: credentialType, [privateKeyField]: privateKey })
    );

    const result = runChecker(root, "--secrets");

    expect(result.status).toBe(1);
    expect(result.stdout).toContain("credential.json");
    expect(result.stdout).not.toContain("fixture-value");
  });

  it("rejects supported provider-token shapes without printing the tokens", () => {
    const root = createFixture();
    const tokens = [
      ["ghp", "a".repeat(36)].join("_"),
      ["AK", `IA${"A".repeat(16)}`].join(""),
      ["xox", `b-${"a".repeat(24)}`].join(""),
      ["sk", `live_${"a".repeat(20)}`].join("_"),
    ];
    writeFileSync(resolve(root, "local-notes.txt"), tokens.join("\n"));

    const result = runChecker(root, "--secrets");

    expect(result.status).toBe(1);
    expect(result.stdout).toContain("GitHub access token");
    expect(result.stdout).toContain("AWS access key");
    expect(result.stdout).toContain("Slack access token");
    expect(result.stdout).toContain("live Stripe secret key");
    for (const token of tokens) expect(result.stdout).not.toContain(token);
  });

  it("rejects OAuth access and refresh tokens without printing their values", () => {
    const root = createFixture();
    const accessToken = ["ya", `29.${"a".repeat(30)}`].join("");
    const refreshToken = ["refresh", "token-value-that-must-not-print"].join("-");
    writeFileSync(
      resolve(root, "oauth-session.json"),
      JSON.stringify({ access_token: accessToken, refresh_token: refreshToken })
    );

    const result = runChecker(root, "--secrets");

    expect(result.status).toBe(1);
    expect(result.stdout).toContain("Google OAuth access token");
    expect(result.stdout).toContain("OAuth refresh token field");
    expect(result.stdout).not.toContain(accessToken);
    expect(result.stdout).not.toContain(refreshToken);
  });

  it("scans generated browser and compiled Functions output", () => {
    const root = createFixture();
    const browserToken = ["ghp", "b".repeat(36)].join("_");
    const functionToken = ["sk", `live_${"c".repeat(20)}`].join("_");
    mkdirSync(resolve(root, "dist", "assets"), { recursive: true });
    mkdirSync(resolve(root, "functions", "lib"), { recursive: true });
    writeFileSync(resolve(root, "dist", "assets", "app.js"), browserToken);
    writeFileSync(resolve(root, "functions", "lib", "index.js"), functionToken);

    const result = runChecker(root, "--secrets");

    expect(result.status).toBe(1);
    expect(result.stdout).toContain("dist/assets/app.js");
    expect(result.stdout).toContain("functions/lib/index.js");
    expect(result.stdout).not.toContain(browserToken);
    expect(result.stdout).not.toContain(functionToken);
  });

  it("permits Recovery Code fixtures only in tests and documentation", () => {
    const root = createFixture();
    const fixtureCode = ["DH", "TEST", "0001"].join("-");
    writeFileSync(
      resolve(root, "tests/recovery-fixture.ts"),
      `export const code = "${fixtureCode}";`
    );
    writeFileSync(
      resolve(root, "functions/tests/recovery-fixture.ts"),
      `export const code = "${fixtureCode}";`
    );
    expect(runChecker(root, "--secrets").status).toBe(0);

    writeFileSync(
      resolve(root, "functions/src/recovery-leak.ts"),
      `export const code = "${fixtureCode}";`
    );
    const result = runChecker(root, "--secrets");

    expect(result.status).toBe(1);
    expect(result.stdout).toContain("Recovery Code-shaped value");
    expect(result.stdout).not.toContain(fixtureCode);
  });

  it("rejects direct dependency drift between package.json and package-lock.json", () => {
    const root = createFixture();
    const lockPath = resolve(root, "package-lock.json");
    const inconsistentLock = JSON.parse(readFileSync(lockPath, "utf8"));
    inconsistentLock.packages[""].dependencies.react = "^18.0.0";
    writeFileSync(lockPath, JSON.stringify(inconsistentLock));

    const result = runChecker(root, "--lockfile");

    expect(result.status).toBe(1);
    expect(result.stdout).toContain("dependencies do not exactly match package.json");
  });

  it("checks Functions and billing-guard lockfiles as independent packages", () => {
    const root = createFixture();
    createPackageFixture(root, "functions", "functions");
    createPackageFixture(root, "billing-guard", "billing-guard");

    const consistent = runChecker(root, "--lockfile");

    expect(consistent.status).toBe(0);
    expect(consistent.stdout).toContain("functions/package-lock.json");
    expect(consistent.stdout).toContain("billing-guard/package-lock.json");

    const lockPath = resolve(root, "billing-guard", "package-lock.json");
    const inconsistentLock = JSON.parse(readFileSync(lockPath, "utf8"));
    inconsistentLock.packages[""].dependencies.typescript = "~5.8.0";
    writeFileSync(lockPath, JSON.stringify(inconsistentLock));

    const inconsistent = runChecker(root, "--lockfile");

    expect(inconsistent.status).toBe(1);
    expect(inconsistent.stdout).toContain("billing-guard/package-lock.json");
    expect(inconsistent.stdout).toContain("dependencies do not exactly match package.json");
  });
});
