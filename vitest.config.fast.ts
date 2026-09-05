// Fast feedback config for app tests that are safe to isolate across workers.
// Resource-heavy UI suites run separately via `npm run test:heavy`.

import { defineConfig, configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./tests/setupTests.ts",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    exclude: [
      ...configDefaults.exclude,
      "tests/firestore/**",
      "tests/functions/**",
      "tests/integration/GearTab.test.tsx",
      "tests/integration/TalentsTab.test.tsx",
      "tests/integration/TalentsTab.overflowFlows.test.tsx",
    ],

    // Test files are isolated by Vitest, so they can safely use separate workers.
    // Capping the pool avoids starving heavier React Testing Library suites.
    fileParallelism: true,
    maxWorkers: "50%",
  },
});
