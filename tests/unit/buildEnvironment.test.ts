import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, expect, it } from "vitest";
import {
  configurationFingerprint,
  hash,
  verifyBuildEnvironment,
} from "../../scripts/firebaseBuildIntegrity.mjs";

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});
function fixture(project = "production-project", mode = "production") {
  const root = mkdtempSync(path.join(tmpdir(), "dhm-environment-"));
  roots.push(root);
  mkdirSync(path.join(root, "assets"));
  const env = {
    VITE_FIREBASE_API_KEY: "browser-api-key",
    VITE_FIREBASE_AUTH_DOMAIN: `${project}.firebaseapp.com`,
    VITE_FIREBASE_PROJECT_ID: project,
    VITE_FIREBASE_STORAGE_BUCKET: `${project}.appspot.com`,
    VITE_FIREBASE_MESSAGING_SENDER_ID: "123",
    VITE_FIREBASE_APP_ID: "1:123:web:app",
  };
  const code = "console.log('application');";
  writeFileSync(path.join(root, "assets/app.js"), code);
  writeFileSync(
    path.join(root, "index.html"),
    '<script type="module" src="/assets/app.js"></script>'
  );
  const fingerprint = configurationFingerprint(env);
  const record = {
    schema: 1,
    project,
    mode,
    fingerprint,
    chunks: [{ file: "assets/app.js", hash: hash(code), entry: true }],
  };
  const save = () => writeFileSync(path.join(root, "firebase-build.json"), JSON.stringify(record));
  save();
  return { root, env, record, save, targets: { [project]: { mode, fingerprint } } };
}
it("accepts intact files for their approved target", () => {
  const build = fixture();
  expect(verifyBuildEnvironment(build.root, "production-project", build.targets)).toMatchObject({
    project: "production-project",
  });
});
it("stops a staging build being uploaded to production", () => {
  const production = fixture();
  const staging = fixture("staging-project", "staging");
  expect(() =>
    verifyBuildEnvironment(staging.root, "production-project", production.targets)
  ).toThrow("do not match");
});
it("rejects connection overrides even when the project name looks correct", () => {
  const build = fixture();
  build.record.fingerprint = configurationFingerprint({
    ...build.env,
    VITE_FIREBASE_API_KEY: "unexpected-key",
  });
  build.save();
  expect(() => verifyBuildEnvironment(build.root, "production-project", build.targets)).toThrow(
    "do not match"
  );
});
it("rejects a replaced compiled app or a page loading a different entry", () => {
  const build = fixture();
  writeFileSync(path.join(build.root, "assets/app.js"), "console.log('different build');");
  expect(() => verifyBuildEnvironment(build.root, "production-project", build.targets)).toThrow(
    "changed"
  );
  const other = fixture();
  writeFileSync(path.join(other.root, "index.html"), '<script src="/unverified.js"></script>');
  expect(() => verifyBuildEnvironment(other.root, "production-project", other.targets)).toThrow(
    "entry point"
  );
});
it("blocks unknown targets and missing build records", () => {
  const build = fixture();
  expect(() => verifyBuildEnvironment(build.root, "unknown", build.targets)).toThrow(
    "approved project"
  );
  rmSync(path.join(build.root, "firebase-build.json"));
  expect(() => verifyBuildEnvironment(build.root, "production-project", build.targets)).toThrow();
});
