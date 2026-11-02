// scripts/buildForDeploy.mjs
//
// Used as the hosting predeploy hook. Firebase sets GCLOUD_PROJECT to the
// project being deployed to; this picks the matching Vite build mode so a
// staging deploy never ships production's .env config, or vice versa.

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const STAGING_PROJECT_ID = "dark-heresy-manager-staging";
const targets = JSON.parse(
  readFileSync(new URL("./deploymentTargets.json", import.meta.url), "utf8")
);
if (!Object.hasOwn(targets, process.env.GCLOUD_PROJECT ?? "")) {
  throw new Error("Deployment target is missing or is not an approved project.");
}

const isStaging = process.env.GCLOUD_PROJECT === STAGING_PROJECT_ID;
const command = isStaging ? "npm run build -- --mode staging" : "npm run build";

execSync(command, { stdio: "inherit" });
execSync("npm run check:build-inventory", { stdio: "inherit" });
execSync("node scripts/checkBuildEnvironment.mjs", { stdio: "inherit" });
