import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

export const buildRecordName = "firebase-build.json";
const fields = [
  "API_KEY",
  "AUTH_DOMAIN",
  "PROJECT_ID",
  "STORAGE_BUCKET",
  "MESSAGING_SENDER_ID",
  "APP_ID",
];
export function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}
export function configurationFingerprint(environment) {
  const values = fields.map((field) => {
    const value = environment[`VITE_FIREBASE_${field}`];
    if (typeof value !== "string" || !value)
      throw new Error(`Missing Firebase build setting: ${field}`);
    return value;
  });
  values.push(environment.VITE_RECAPTCHA_SITE_KEY ?? "");
  return hash(JSON.stringify(values));
}

export function firebaseBuildIntegrityPlugin() {
  let resolved;
  return {
    name: "firebase-build-integrity",
    apply: "build",
    configResolved(config) {
      resolved = config;
    },
    generateBundle: {
      order: "post",
      handler(_options, bundle) {
        if (resolved.mode === "performance") return;
        for (const key of Object.keys(resolved.define ?? {})) {
          if (
            key === "import.meta.env" ||
            key.startsWith("import.meta.env.VITE_FIREBASE_") ||
            key === "import.meta.env.VITE_RECAPTCHA_SITE_KEY"
          ) {
            throw new Error("Firebase build settings must come from the resolved environment.");
          }
        }
        this.emitFile({
          type: "asset",
          fileName: buildRecordName,
          source: JSON.stringify(
            {
              schema: 1,
              mode: resolved.mode,
              project: resolved.env.VITE_FIREBASE_PROJECT_ID,
              fingerprint: configurationFingerprint(resolved.env),
              chunks: Object.values(bundle)
                .filter((item) => item.type === "chunk")
                .map((item) => ({
                  file: item.fileName,
                  hash: hash(item.code),
                  entry: item.isEntry,
                })),
            },
            null,
            2
          ),
        });
      },
    },
  };
}

export function verifyBuildEnvironment(buildDirectory, project, targets) {
  const expected = targets[project];
  if (!expected) throw new Error("Deployment target is missing or is not an approved project.");
  const build = JSON.parse(readFileSync(path.join(buildDirectory, buildRecordName), "utf8"));
  if (
    build.schema !== 1 ||
    build.project !== project ||
    build.mode !== expected.mode ||
    build.fingerprint !== expected.fingerprint
  ) {
    throw new Error("Built Firebase settings do not match the deployment target. Upload stopped.");
  }
  if (
    !Array.isArray(build.chunks) ||
    !build.chunks.length ||
    !build.chunks.some((chunk) => chunk.entry === true)
  )
    throw new Error("Build record has no application entry point.");
  const root = path.resolve(buildDirectory);
  for (const chunk of build.chunks) {
    if (typeof chunk.file !== "string" || typeof chunk.hash !== "string")
      throw new Error("Invalid build record.");
    const file = path.resolve(root, chunk.file);
    const relative = path.relative(root, file);
    if (!relative || relative.startsWith("..") || path.isAbsolute(relative))
      throw new Error("Invalid build record path.");
    if (hash(readFileSync(file)) !== chunk.hash)
      throw new Error(
        "Compiled app files changed after the environment was recorded. Upload stopped."
      );
  }
  const html = readFileSync(path.join(root, "index.html"), "utf8");
  if (!build.chunks.some((chunk) => chunk.entry === true && html.includes(`/${chunk.file}`)))
    throw new Error("The page does not load the verified application entry point.");
  return build;
}
