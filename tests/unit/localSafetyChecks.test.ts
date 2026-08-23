import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const checkerPath = resolve(process.cwd(), "scripts/checkLocalSafety.mjs");
const temporaryDirectories: string[] = [];

function createFixture() {
  const root = mkdtempSync(resolve(tmpdir(), "dh-local-safety-"));
  temporaryDirectories.push(root);
  mkdirSync(resolve(root, "src"));
  mkdirSync(resolve(root, "tests"));

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
  it("passes a consistent lockfile and the approved public browser setting", () => {
    const root = createFixture();
    writeFileSync(resolve(root, ".env"), "VITE_FIREBASE_API_KEY=fixture-public-value\n");

    const result = runChecker(root);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("no network requests or source uploads");
    expect(result.stdout).not.toContain("fixture-public-value");
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

  it("permits Recovery Code fixtures only in tests and documentation", () => {
    const root = createFixture();
    const fixtureCode = ["DH", "TEST", "0001"].join("-");
    writeFileSync(
      resolve(root, "tests/recovery-fixture.ts"),
      `export const code = "${fixtureCode}";`
    );
    expect(runChecker(root, "--secrets").status).toBe(0);

    writeFileSync(resolve(root, "src/recovery-leak.ts"), `export const code = "${fixtureCode}";`);
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
});
