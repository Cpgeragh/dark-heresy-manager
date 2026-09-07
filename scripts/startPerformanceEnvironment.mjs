import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createPerformanceEnvironment,
  PERFORMANCE_PROJECT_ID,
  verifyPerformanceConfiguration,
} from "./performanceEnvironmentConfig.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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
  await verifyPerformanceConfiguration(rootDir);
  await buildFunctions();

  const performanceEnvironment = createPerformanceEnvironment(process.env);
  const firebase = spawnNode(
    localBinary("firebase-tools", "lib", "bin", "firebase.js"),
    ["emulators:start", "--only", "auth,firestore,functions", "--project", PERFORMANCE_PROJECT_ID],
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
