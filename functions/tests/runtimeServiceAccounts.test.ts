import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("firebase-admin/app", () => ({ initializeApp: vi.fn() }));

type ExportedCallable = {
  __endpoint?: {
    serviceAccountEmail?: string;
  };
};

let exportedFunctions: Record<string, ExportedCallable>;

beforeAll(async () => {
  exportedFunctions = await import("../src/index");
});

describe("Cloud Function runtime service accounts", () => {
  it("uses the restricted account-deletion identity only for deleteAccount", () => {
    expect(exportedFunctions.deleteAccount.__endpoint?.serviceAccountEmail).toBe(
      "dh-account-deletion@"
    );
  });

  it("uses the ordinary restricted runtime identity for every other callable", () => {
    const ordinaryCallables = Object.entries(exportedFunctions).filter(
      ([name]) => name !== "deleteAccount"
    );

    expect(ordinaryCallables.length).toBeGreaterThan(0);
    for (const [name, callable] of ordinaryCallables) {
      expect(callable.__endpoint?.serviceAccountEmail, name).toBe("dh-functions-runtime@");
    }
  });
});
