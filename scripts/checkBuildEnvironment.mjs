import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { verifyBuildEnvironment } from "./firebaseBuildIntegrity.mjs";

const targets = JSON.parse(
  readFileSync(new URL("./deploymentTargets.json", import.meta.url), "utf8")
);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
try {
  const build = verifyBuildEnvironment(
    path.resolve(root, process.argv[3] ?? "dist"),
    process.argv[2] ?? process.env.GCLOUD_PROJECT,
    targets
  );
  console.log(`Build environment verified for ${build.project} (${build.mode}).`);
} catch (error) {
  console.error(`Build environment check failed: ${error.message}`);
  process.exitCode = 1;
}
