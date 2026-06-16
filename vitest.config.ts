// vitest.config.ts

import { defineConfig, configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./tests/setupTests.ts",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    // Firestore rules tests need a live emulator — they run separately via
    // `npm run test:rules` (which wraps them in `firebase emulators:exec`).
    exclude: [...configDefaults.exclude, "tests/firestore/**"],

    // Run test files sequentially to prevent test interference
    fileParallelism: false,
  }
});