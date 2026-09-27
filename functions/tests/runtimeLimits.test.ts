import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("firebase-admin/app", () => ({ initializeApp: vi.fn() }));

type ExportedCallable = {
  __endpoint?: {
    timeoutSeconds?: number | null;
    maxInstances?: number | null;
    concurrency?: number | null;
  };
};

const heavyCallables = new Map<string, number>([
  ["startCharacterDeletionJob", 30],
  ["processCharacterDeletionChunk", 30],
  ["startCampaignDeletionJob", 30],
  ["processCampaignDeletionChunk", 30],
  ["startCustomItemMutationJob", 30],
  ["processCustomItemMutationChunk", 30],
  ["repairSessionSummaries", 30],
  ["deleteAccount", 60],
]);

let exportedFunctions: Record<string, ExportedCallable>;

beforeAll(async () => {
  exportedFunctions = await import("../src/index");
});

describe("Cloud Function runtime limits", () => {
  it("gives every ordinary callable the shared capacity and timeout limits", () => {
    const ordinaryCallables = Object.entries(exportedFunctions).filter(
      ([name]) => !heavyCallables.has(name)
    );

    expect(ordinaryCallables.length).toBeGreaterThan(0);
    for (const [name, callable] of ordinaryCallables) {
      expect(callable.__endpoint?.timeoutSeconds, name).toBe(30);
      expect(callable.__endpoint?.maxInstances, name).toBe(5);
      expect(callable.__endpoint?.concurrency, name).toBe(40);
    }
  });

  it("gives bulk and deletion callables tighter capacity limits", () => {
    expect([...heavyCallables.keys()].sort()).toEqual(
      Object.keys(exportedFunctions)
        .filter((name) => heavyCallables.has(name))
        .sort()
    );

    for (const [name, timeoutSeconds] of heavyCallables) {
      const callable = exportedFunctions[name];

      expect(callable, name).toBeDefined();
      expect(callable.__endpoint?.timeoutSeconds, name).toBe(timeoutSeconds);
      expect(callable.__endpoint?.maxInstances, name).toBe(2);
      expect(callable.__endpoint?.concurrency, name).toBe(5);
    }
  });
});
