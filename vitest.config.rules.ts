// vitest.config.rules.ts
// Config for the Firestore rules tests. These require a live emulator and are
// launched by `npm run test:rules` via `firebase emulators:exec`.

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./tests/setupTests.ts",
    include: ["tests/firestore/**/*.test.ts"],
    fileParallelism: false,
  },
});
