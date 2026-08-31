// scripts/buildForDeploy.mjs
//
// Used as the hosting predeploy hook. Firebase sets GCLOUD_PROJECT to the
// project being deployed to; this picks the matching Vite build mode so a
// staging deploy never ships production's .env config, or vice versa.

import { execSync } from "node:child_process";

const STAGING_PROJECT_ID = "dark-heresy-manager-staging";

const isStaging = process.env.GCLOUD_PROJECT === STAGING_PROJECT_ID;
const command = isStaging ? "npm run build -- --mode staging" : "npm run build";

execSync(command, { stdio: "inherit" });
