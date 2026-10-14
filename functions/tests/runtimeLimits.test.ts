import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("firebase-admin/app", () => ({ initializeApp: vi.fn() }));

type ExportedCallable = {
  __endpoint?: {
    timeoutSeconds?: number | null;
    maxInstances?: number | null;
    concurrency?: number | null;
    scheduleTrigger?: {
      schedule?: string;
      timeZone?: string;
      retryConfig?: { retryCount?: number | null };
    };
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
  ["exportChat", 120],
]);

const scheduledFunctions = new Map<string, { schedule: string; timeoutSeconds: number }>([
  ["purgeBinnedChatsDaily", { schedule: "0 3 * * *", timeoutSeconds: 300 }],
]);

let exportedFunctions: Record<string, ExportedCallable>;

beforeAll(async () => {
  exportedFunctions = await import("../src/index");
});

describe("Cloud Function runtime limits", () => {
  it("gives every ordinary callable the shared capacity and timeout limits", () => {
    const ordinaryCallables = Object.entries(exportedFunctions).filter(
      ([name]) => !heavyCallables.has(name) && !scheduledFunctions.has(name)
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

  it("runs each scheduled function once a day, with one instance and no retries", () => {
    expect([...scheduledFunctions.keys()].sort()).toEqual(
      Object.keys(exportedFunctions)
        .filter((name) => scheduledFunctions.has(name))
        .sort()
    );

    for (const [name, expected] of scheduledFunctions) {
      const endpoint = exportedFunctions[name].__endpoint;

      expect(endpoint?.scheduleTrigger?.schedule, name).toBe(expected.schedule);
      expect(endpoint?.scheduleTrigger?.timeZone, name).toBe("Europe/London");
      expect(endpoint?.scheduleTrigger?.retryConfig?.retryCount, name).toBe(0);
      expect(endpoint?.timeoutSeconds, name).toBe(expected.timeoutSeconds);
      expect(endpoint?.maxInstances, name).toBe(1);
    }
  });
});
