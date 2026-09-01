// billing-guard/vitest.config.ts
//
// Unit tests for billing-guard's own logic — no emulator, no real
// GCP calls. The Pub/Sub-triggered handler itself is exercised via the
// dry-run and live-fire drill procedures in docs/billing-kill-switch.md,
// not by this suite.

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
