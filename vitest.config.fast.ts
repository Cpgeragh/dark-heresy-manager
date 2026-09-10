// Fast feedback config for app tests that are safe to isolate across workers.
// Resource-heavy UI suites run separately via `npm run test:heavy`.

import { defineConfig, configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";

const heavyIntegrationTests = [
  "tests/integration/GearTab.test.tsx",
  "tests/integration/TalentsTab.test.tsx",
  "tests/integration/TalentsTab.overflowFlows.test.tsx",
];

// These unit tests need browser APIs directly or through their imported modules.
// New unit tests default to the Node project so an undeclared browser dependency
// fails visibly instead of adding jsdom startup cost to every unit-test worker.
const browserUnitTests = [
  "tests/unit/armourSnapshotHelpers.test.ts",
  "tests/unit/boundedFirestoreQueries.test.tsx",
  "tests/unit/campaignsContext.test.tsx",
  "tests/unit/characterPermissions.test.ts",
  "tests/unit/clientCodeAttemptLimit.test.ts",
  "tests/unit/customItemService.test.ts",
  "tests/unit/cyberneticSnapshotHelpers.test.ts",
  "tests/unit/deviceLinkService.test.ts",
  "tests/unit/errorPropagation.test.tsx",
  "tests/unit/firebase.test.ts",
  "tests/unit/gearSnapshotHelpers.test.ts",
  "tests/unit/identityService.test.ts",
  "tests/unit/messageDrawer.test.tsx",
  "tests/unit/performanceMetrics.test.ts",
  "tests/unit/portraitService.test.ts",
  "tests/unit/psychicPowers.test.ts",
  "tests/unit/recoveryLookupService.test.ts",
  "tests/unit/SegmentedTimeline.test.tsx",
  "tests/unit/skillComputation.test.ts",
  "tests/unit/skillFilters.test.ts",
  "tests/unit/skillGroupCollapse.test.ts",
  "tests/unit/skillSorting.test.ts",
  "tests/unit/ToastContext.test.ts",
  "tests/unit/useAssignedItemMeta.test.ts",
  "tests/unit/useAuth.test.tsx",
  "tests/unit/useCharacterHelpers.test.ts",
  "tests/unit/useCharacterMutations.test.ts",
  "tests/unit/useCharacterSheet.test.ts",
  "tests/unit/useFirestoreSubscription.test.tsx",
  "tests/unit/useMediaQuery.test.ts",
  "tests/unit/useRecoveryLookup.test.ts",
  "tests/unit/weaponSnapshotHelpers.test.ts",
];

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    fileParallelism: true,
    maxWorkers: "50%",
    projects: [
      {
        extends: true,
        test: {
          name: "node-unit",
          environment: "node",
          include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.test.tsx"],
          exclude: [...configDefaults.exclude, ...browserUnitTests],
        },
      },
      {
        extends: true,
        test: {
          name: "jsdom-app",
          environment: "jsdom",
          setupFiles: "./tests/setupTests.ts",
          include: [
            "tests/integration/**/*.test.ts",
            "tests/integration/**/*.test.tsx",
            ...browserUnitTests,
          ],
          exclude: [
            ...configDefaults.exclude,
            "tests/firestore/**",
            "tests/functions/**",
            ...heavyIntegrationTests,
          ],
        },
      },
    ],
  },
});
