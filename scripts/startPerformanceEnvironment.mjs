import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ID = "dh-test";
const REQUIRED_PORTS = { firestore: 8080, functions: 5001, auth: 9099 };
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function verifyConfiguration() {
  const configuration = JSON.parse(await readFile(path.join(rootDir, "firebase.json"), "utf8"));
  for (const [emulator, port] of Object.entries(REQUIRED_PORTS)) {
    if (configuration.emulators?.[emulator]?.port !== port) {
      throw new Error(`firebase.json must configure ${emulator} on port ${port}.`);
    }
  }
  if (configuration.emulators?.singleProjectMode !== true) {
    throw new Error("Firebase emulator singleProjectMode must remain enabled.");
  }
}

function localBinary(...segments) {
  return path.join(rootDir, "node_modules", ...segments);
}

function spawnNode(script, args, options = {}) {
  return spawn(process.execPath, [script, ...args], {
    cwd: rootDir,
    stdio: "inherit",
    ...options,
  });
}

function waitForExit(child, label) {
  return new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${label} exited with ${signal ?? `code ${code}`}.`));
    });
  });
}

async function buildFunctions() {
  const compiler = localBinary("typescript", "bin", "tsc");
  const child = spawnNode(compiler, ["--project", "functions/tsconfig.json"]);
  await waitForExit(child, "Functions build");
}

async function run() {
  await verifyConfiguration();
  await buildFunctions();

  const performanceEnvironment = {
    ...process.env,
    VITE_FIREBASE_API_KEY: "performance-local-only",
    VITE_FIREBASE_AUTH_DOMAIN: "dh-test.firebaseapp.com",
    VITE_FIREBASE_PROJECT_ID: PROJECT_ID,
    VITE_FIREBASE_STORAGE_BUCKET: "dh-test.appspot.com",
    VITE_FIREBASE_MESSAGING_SENDER_ID: "000000000000",
    VITE_FIREBASE_APP_ID: "1:000000000000:web:performance-local-only",
    VITE_RECAPTCHA_SITE_KEY: "",
    GCLOUD_PROJECT: PROJECT_ID,
    FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
    FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
  };
  const firebase = spawnNode(
    localBinary("firebase-tools", "lib", "bin", "firebase.js"),
    ["emulators:start", "--only", "auth,firestore,functions", "--project", PROJECT_ID],
    { env: performanceEnvironment }
  );
  const vite = spawnNode(
    localBinary("vite", "bin", "vite.js"),
    ["--mode", "performance", "--host", "127.0.0.1", "--port", "4175", "--strictPort"],
    { env: performanceEnvironment }
  );
  const children = [firebase, vite];
  let stopping = false;

  const stop = () => {
    if (stopping) return;
    stopping = true;
    for (const child of children) {
      if (!child.killed) child.kill("SIGINT");
    }
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);

  try {
    await Promise.race([
      waitForExit(firebase, "Firebase emulators"),
      waitForExit(vite, "Performance app"),
    ]);
  } finally {
    stop();
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
