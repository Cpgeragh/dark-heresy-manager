import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { createPwaOptions } from "./pwaOptions";
import { firebaseBuildIntegrityPlugin } from "./scripts/firebaseBuildIntegrity.mjs";

export default defineConfig(({ mode }) => {
  const performanceRevision = process.env.DHM_PERFORMANCE_REVISION;

  return {
    define: {
      "import.meta.env.VITE_ACCOUNT_CHECK_BUILD": JSON.stringify(new Date().toISOString()),
    },
    plugins: [
      react(),
      firebaseBuildIntegrityPlugin(),
      VitePWA(createPwaOptions(mode, performanceRevision)),
    ],
  };
});
