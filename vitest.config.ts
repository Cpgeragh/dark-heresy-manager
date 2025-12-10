// vitest.config.ts

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./tests/setupTests.ts",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    
    // Run test files sequentially to prevent test interference
    fileParallelism: false,
  }
});