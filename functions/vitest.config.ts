// functions/vitest.config.ts
// Local unit tests for functions/'s own shared foundation code — no
// emulator needed. Emulator-based end-to-end proof stays in the root
// project's tests/functions/ + test:functions script.

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
