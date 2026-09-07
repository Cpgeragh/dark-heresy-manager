export function createPwaOptions(mode: string, performanceRevision?: string) {
  return {
    registerType: "autoUpdate" as const,
    // Workbox's PNG glob already includes these files. Letting the plugin add
    // manifest icons separately creates duplicate precache entries.
    includeManifestIcons: false,
    manifest: {
      name: "Dark Heresy Manager",
      short_name: "Heresy Manager",
      description: "Campaign and character management for Dark Heresy",
      start_url: "/",
      scope: "/",
      theme_color: "#0F172A",
      background_color: "#0F172A",
      display: "standalone" as const,
      icons: [
        {
          src: "icon-192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable",
        },
        {
          src: "icon-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable",
        },
      ],
    },
    workbox: {
      globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2}"],
      // Performance builds use one tiny local-only revision resource so
      // update downloads can be stalled deterministically without changing
      // production cache contents.
      additionalManifestEntries:
        mode === "performance" && performanceRevision
          ? [{ url: "__performance_revision__", revision: performanceRevision }]
          : undefined,
      // Keep the Workbox default explicit as a guardrail: a JavaScript split
      // must not silently create an asset too large for the offline cache.
      maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
    },
  };
}
