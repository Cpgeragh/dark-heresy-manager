// vitest.config.functions.ts
// Config for the Cloud Functions emulator tests. These require the local
// Functions emulator and are launched by `npm run test:functions` via
// `firebase emulators:exec`.

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/functions/**/*.test.ts"],
    fileParallelism: false,
  },
});
