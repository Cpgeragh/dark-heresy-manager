import { describe, expect, it } from "vitest";
import { createPwaOptions } from "../../pwaOptions";

describe("PWA build configuration", () => {
  it("precaches splash images without duplicating public icons", () => {
    const options = createPwaOptions("production");

    expect(options).not.toHaveProperty("includeAssets");
    expect(options.includeManifestIcons).toBe(false);
    expect(options.workbox.globPatterns).toContain("**/*.{js,css,html,ico,png,svg,webp,woff2}");
    expect(options.workbox.additionalManifestEntries).toBeUndefined();
    expect(options.manifest.icons.map(({ src }) => src)).toEqual(["icon-192.png", "icon-512.png"]);
    expect(options.manifest.icons.every(({ purpose }) => purpose === "any maskable")).toBe(true);
  });

  it("adds the deterministic revision resource only to guarded performance builds", () => {
    expect(createPwaOptions("performance", "revision-a").workbox.additionalManifestEntries).toEqual(
      [{ url: "__performance_revision__", revision: "revision-a" }]
    );
    expect(createPwaOptions("production", "revision-a").workbox.additionalManifestEntries).toBe(
      undefined
    );
  });
});
