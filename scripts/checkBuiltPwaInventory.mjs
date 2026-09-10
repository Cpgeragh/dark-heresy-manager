import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MAX_CACHEABLE_ASSET_BYTES = 2 * 1024 * 1024;
const CACHEABLE_EXTENSIONS = new Set([
  ".css",
  ".html",
  ".ico",
  ".js",
  ".png",
  ".svg",
  ".webmanifest",
  ".webp",
  ".woff2",
]);
const REQUIRED_CACHED_ASSETS = [
  "icon-192.png",
  "icon-512.png",
  "index.html",
  "manifest.webmanifest",
  "splash-aquila-divider.webp",
  "splash-inquisition-emblem.webp",
];

function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

function listFiles(directory, relativeDirectory = "") {
  return readdirSync(path.join(directory, relativeDirectory), {
    withFileTypes: true,
  }).flatMap((entry) => {
    const relativePath = path.join(relativeDirectory, entry.name);
    return entry.isDirectory() ? listFiles(directory, relativePath) : [toPosixPath(relativePath)];
  });
}

function isGeneratedServiceWorkerFile(filePath) {
  return (
    filePath === "sw.js" || filePath === "registerSW.js" || /^workbox-[^/]+\.js$/u.test(filePath)
  );
}

function parsePrecacheUrls(serviceWorkerSource) {
  const entryPattern = /\{url:"((?:\\.|[^"\\])*)",revision:(?:"(?:\\.|[^"\\])*"|null)\}/gu;
  return Array.from(serviceWorkerSource.matchAll(entryPattern), (match) =>
    JSON.parse(`"${match[1]}"`)
  );
}

export function inspectBuiltPwa(buildDirectory = "dist") {
  const resolvedBuildDirectory = path.resolve(buildDirectory);
  const serviceWorkerPath = path.join(resolvedBuildDirectory, "sw.js");

  if (!existsSync(serviceWorkerPath)) {
    throw new Error(`Missing generated service worker: ${serviceWorkerPath}`);
  }

  const files = listFiles(resolvedBuildDirectory);
  const fileSet = new Set(files);
  const serviceWorkerSource = readFileSync(serviceWorkerPath, "utf8");
  const precacheUrls = parsePrecacheUrls(serviceWorkerSource);

  if (precacheUrls.length === 0) {
    throw new Error("No precache entries were found in the generated service worker.");
  }

  const errors = [];
  const duplicateUrls = precacheUrls.filter((url, index) => precacheUrls.indexOf(url) !== index);
  const uniquePrecacheUrls = [...new Set(precacheUrls)];
  const precacheSet = new Set(uniquePrecacheUrls);

  if (duplicateUrls.length > 0) {
    errors.push(`Duplicate precache URLs: ${[...new Set(duplicateUrls)].join(", ")}`);
  }

  for (const url of uniquePrecacheUrls) {
    if (!fileSet.has(url)) {
      errors.push(`Precache URL does not exist in the build: ${url}`);
    }
  }

  const eligibleFiles = files.filter(
    (filePath) =>
      CACHEABLE_EXTENSIONS.has(path.extname(filePath)) && !isGeneratedServiceWorkerFile(filePath)
  );

  for (const filePath of eligibleFiles) {
    if (!precacheSet.has(filePath)) {
      errors.push(`Cache-eligible build asset is not precached: ${filePath}`);
    }

    const size = statSync(path.join(resolvedBuildDirectory, filePath)).size;
    if (size > MAX_CACHEABLE_ASSET_BYTES) {
      errors.push(`Cache-eligible asset exceeds 2 MiB: ${filePath} (${size} bytes)`);
    }
  }

  for (const requiredAsset of REQUIRED_CACHED_ASSETS) {
    if (!fileSet.has(requiredAsset)) {
      errors.push(`Required PWA asset is missing: ${requiredAsset}`);
    } else if (!precacheSet.has(requiredAsset)) {
      errors.push(`Required PWA asset is not precached: ${requiredAsset}`);
    }
  }

  const forbiddenRobotoFiles = files.filter((filePath) => /roboto/iu.test(filePath));
  const forbiddenRobotoUrls = uniquePrecacheUrls.filter((url) => /roboto/iu.test(url));
  if (forbiddenRobotoFiles.length > 0 || forbiddenRobotoUrls.length > 0) {
    errors.push(
      `Roboto assets must not be emitted or cached: ${[
        ...new Set([...forbiddenRobotoFiles, ...forbiddenRobotoUrls]),
      ].join(", ")}`
    );
  }

  if (serviceWorkerSource.includes("__performance_revision__")) {
    errors.push("The production service worker contains the performance-only revision marker.");
  }

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }

  const precacheBytes = uniquePrecacheUrls.reduce(
    (total, url) => total + statSync(path.join(resolvedBuildDirectory, url)).size,
    0
  );

  return {
    buildDirectory: resolvedBuildDirectory,
    emittedFileCount: files.length,
    eligibleFileCount: eligibleFiles.length,
    precacheEntryCount: uniquePrecacheUrls.length,
    precacheBytes,
  };
}

function formatKib(bytes) {
  return (bytes / 1024).toFixed(2);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try {
    const result = inspectBuiltPwa(process.argv[2] ?? "dist");
    console.log(
      `PWA build inventory verified: ${result.precacheEntryCount} unique precache entries, ` +
        `${formatKib(result.precacheBytes)} KiB, ${result.eligibleFileCount} cache-eligible files, ` +
        `${result.emittedFileCount} emitted files.`
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
