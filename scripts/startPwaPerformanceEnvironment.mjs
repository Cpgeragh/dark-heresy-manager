import { spawn } from "node:child_process";
import { createReadStream } from "node:fs";
import { mkdir, rm, stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createPerformanceEnvironment,
  verifyPerformanceConfiguration,
} from "./performanceEnvironmentConfig.mjs";

const HOST = "127.0.0.1";
const PORTS = [4176, 4177, 4178, 4179, 4180, 4181];
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = path.join(rootDir, "tmp", "pwa-performance");
const roots = {
  a: path.join(outputRoot, "a"),
  b: path.join(outputRoot, "b"),
};
const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webmanifest", "application/manifest+json"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
]);

let activeRevision = "a";
let stallUpdates = false;
const stalledAssetPath = "/__performance_revision__";
let requests = [];
const stalledResponses = new Set();

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

async function buildRevision(revision) {
  const vite = localBinary("vite", "bin", "vite.js");
  const environment = createPerformanceEnvironment(process.env, `pwa-${revision}`);
  environment.DHM_PERFORMANCE_REVISION = revision;
  const build = spawnNode(
    vite,
    ["build", "--mode", "performance", "--outDir", roots[revision], "--emptyOutDir"],
    { env: environment }
  );
  await waitForExit(build, `PWA build for revision ${revision}`);
}

function recordRequest(pathname, outcome, bytes = 0) {
  requests.push({ at: Date.now(), revision: activeRevision, pathname, outcome, bytes });
  if (requests.length > 2_000) requests = requests.slice(-2_000);
}

function cacheControl(pathname) {
  if (pathname.startsWith("/assets/")) return "public, max-age=31536000, immutable";
  if (["/", "/index.html", "/sw.js"].includes(pathname)) {
    return "no-cache, no-store, must-revalidate";
  }
  if (pathname === "/manifest.webmanifest") return "no-cache";
  return "no-cache";
}

async function serveFile(response, pathname) {
  if (pathname === stalledAssetPath) {
    if (stallUpdates && activeRevision === "b") {
      recordRequest(pathname, "stalled");
      stalledResponses.add(response);
      response.on("close", () => stalledResponses.delete(response));
      return;
    }

    const body = Buffer.from(activeRevision, "utf8");
    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Length": body.length,
      "Content-Type": "text/plain; charset=utf-8",
    });
    recordRequest(pathname, "served", body.length);
    response.end(body);
    return;
  }

  const revisionRoot = roots[activeRevision];
  let relativePath;
  try {
    relativePath = decodeURIComponent(pathname).replace(/^\/+/, "");
  } catch {
    response.writeHead(400).end("Invalid URL");
    return;
  }
  let filePath = path.resolve(revisionRoot, relativePath || "index.html");
  if (!filePath.startsWith(`${revisionRoot}${path.sep}`)) {
    response.writeHead(403).end("Forbidden");
    return;
  }
  let fileStat;
  try {
    fileStat = await stat(filePath);
    if (!fileStat.isFile()) throw new Error("not a file");
  } catch {
    filePath = path.join(revisionRoot, "index.html");
    fileStat = await stat(filePath);
  }

  response.writeHead(200, {
    "Cache-Control": cacheControl(pathname),
    "Content-Length": fileStat.size,
    "Content-Type": contentTypes.get(path.extname(filePath)) ?? "application/octet-stream",
  });
  recordRequest(pathname, "served", fileStat.size);
  createReadStream(filePath).pipe(response);
}

function releaseStalledResponses() {
  for (const response of stalledResponses) response.destroy();
  stalledResponses.clear();
}

function printStatus() {
  console.log(
    JSON.stringify({
      urls: PORTS.map((port) => `http://${HOST}:${port}`),
      activeRevision,
      stallUpdates,
      stalledAssetPath,
      requestCount: requests.length,
      openStalledResponses: stalledResponses.size,
    })
  );
}

async function run() {
  await verifyPerformanceConfiguration(rootDir);
  const resolvedOutput = path.resolve(outputRoot);
  const resolvedTmp = path.resolve(rootDir, "tmp");
  if (!resolvedOutput.startsWith(`${resolvedTmp}${path.sep}`)) {
    throw new Error("Refusing to replace a PWA output directory outside tmp.");
  }
  await rm(resolvedOutput, { recursive: true, force: true });
  await mkdir(resolvedOutput, { recursive: true });
  const compiler = localBinary("typescript", "bin", "tsc");
  const typecheck = spawnNode(compiler, ["--build", "tsconfig.app.json"], {
    env: createPerformanceEnvironment(process.env, "pwa-typecheck"),
  });
  await waitForExit(typecheck, "TypeScript build for the PWA measurement environment");
  await buildRevision("a");
  await buildRevision("b");

  const servers = PORTS.map((port) =>
    http.createServer(async (request, response) => {
      const url = new URL(request.url ?? "/", `http://${HOST}:${port}`);
      if (url.pathname === "/__performance__/state") {
        const body = JSON.stringify({ activeRevision, stallUpdates, stalledAssetPath, requests });
        response.writeHead(200, {
          "Cache-Control": "no-store",
          "Content-Type": "application/json; charset=utf-8",
        });
        response.end(body);
        return;
      }
      try {
        await serveFile(response, url.pathname);
      } catch (error) {
        recordRequest(url.pathname, "error");
        response.writeHead(500).end(error instanceof Error ? error.message : String(error));
      }
    })
  );

  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (input) => {
    for (const line of input
      .split(/\r?\n/u)
      .map((value) => value.trim())
      .filter(Boolean)) {
      if (line === "revision a" || line === "revision b") {
        releaseStalledResponses();
        activeRevision = line.endsWith("b") ? "b" : "a";
        stallUpdates = false;
        console.log(`Serving guarded revision ${activeRevision.toUpperCase()}.`);
      } else if (line === "revision b-stall") {
        releaseStalledResponses();
        activeRevision = "b";
        stallUpdates = true;
        console.log(`Serving revision B and stalling ${stalledAssetPath}.`);
      } else if (line === "requests clear") {
        requests = [];
        console.log("Cleared the local request log.");
      } else if (line === "status") {
        printStatus();
      } else {
        console.log(
          "Commands: revision a | revision b | revision b-stall | requests clear | status"
        );
      }
    }
  });

  await Promise.all(
    servers.map(
      (server, index) =>
        new Promise((resolve, reject) => {
          server.once("error", reject);
          server.listen(PORTS[index], HOST, resolve);
        })
    )
  );
  console.log(
    `Guarded PWA revisions are ready at ${PORTS.map((port) => `http://${HOST}:${port}`).join(", ")}.`
  );
  console.log(`Use npm run performance:local in another terminal for the dh-test emulators.`);
  printStatus();

  const stop = () => {
    releaseStalledResponses();
    let openServers = servers.length;
    for (const server of servers) {
      server.close(() => {
        openServers -= 1;
        if (openServers === 0) process.exit(0);
      });
    }
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
