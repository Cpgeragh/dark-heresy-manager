// @vitest-environment node

import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const checkerPath = path.resolve("scripts/checkBuiltPwaInventory.mjs");
const temporaryDirectories: string[] = [];

function createBuildFixture() {
  const buildDirectory = mkdtempSync(path.join(tmpdir(), "dhm-pwa-inventory-"));
  temporaryDirectories.push(buildDirectory);

  const files = {
    "assets/app.css": "body{}",
    "assets/app.js": "console.log('app')",
    "assets/font.woff2": "font",
    "icon-192.png": "icon",
    "icon-512.png": "icon",
    "index.html": "<main></main>",
    "manifest.webmanifest": "{}",
    "splash-aquila-divider.webp": "splash",
    "splash-inquisition-emblem.webp": "splash",
    "workbox-runtime.js": "runtime",
  };

  for (const [filePath, contents] of Object.entries(files)) {
    const absolutePath = path.join(buildDirectory, filePath);
    mkdirSync(path.dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, contents);
  }

  const precacheUrls = Object.keys(files).filter((filePath) => filePath !== "workbox-runtime.js");
  writeServiceWorker(buildDirectory, precacheUrls);

  return { buildDirectory, precacheUrls };
}

function writeServiceWorker(buildDirectory: string, urls: string[], suffix = "") {
  const entries = urls.map((url) => `{url:${JSON.stringify(url)},revision:"revision"}`).join(",");
  writeFileSync(path.join(buildDirectory, "sw.js"), `${entries}${suffix}`);
}

function runChecker(buildDirectory: string) {
  return spawnSync(process.execPath, [checkerPath, buildDirectory], {
    encoding: "utf8",
  });
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("built PWA inventory", () => {
  it("accepts a complete generated build and reports its inventory", () => {
    const { buildDirectory } = createBuildFixture();

    const result = runChecker(buildDirectory);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("9 unique precache entries");
    expect(result.stdout).toContain("9 cache-eligible files");
  });

  it("rejects a cache-eligible emitted asset that is absent from the precache", () => {
    const { buildDirectory, precacheUrls } = createBuildFixture();
    writeServiceWorker(
      buildDirectory,
      precacheUrls.filter((url) => url !== "assets/app.js")
    );

    const result = runChecker(buildDirectory);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Cache-eligible build asset is not precached: assets/app.js");
  });

  it("rejects duplicate URLs and production-only forbidden markers", () => {
    const { buildDirectory, precacheUrls } = createBuildFixture();
    writeServiceWorker(buildDirectory, [...precacheUrls, "index.html"], "__performance_revision__");

    const result = runChecker(buildDirectory);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Duplicate precache URLs: index.html");
    expect(result.stderr).toContain("performance-only revision marker");
  });
});
