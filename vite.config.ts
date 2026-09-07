import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { createPwaOptions } from "./pwaOptions";

export default defineConfig(({ mode }) => {
  const performanceRevision = process.env.DHM_PERFORMANCE_REVISION;

  return {
    plugins: [react(), VitePWA(createPwaOptions(mode, performanceRevision))],
  };
});
