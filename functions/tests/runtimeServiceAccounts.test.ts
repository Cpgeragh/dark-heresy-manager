import { beforeAll, describe, expect, it, vi } from "vitest";
import type { Expression } from "firebase-functions/params";

vi.mock("firebase-admin/app", () => ({ initializeApp: vi.fn() }));

type ExportedCallable = {
  __endpoint?: {
    serviceAccountEmail?: string | Expression<string>;
  };
};

let exportedFunctions: Record<string, ExportedCallable>;

beforeAll(async () => {
  exportedFunctions = await import("../src/index");
});

function serviceAccountExpression(callable: ExportedCallable): string | undefined {
  const serviceAccount = callable.__endpoint?.serviceAccountEmail;
  return typeof serviceAccount === "string" ? serviceAccount : serviceAccount?.toCEL();
}

describe("Cloud Function runtime service accounts", () => {
  it("uses the restricted account-deletion identity only for deleteAccount", () => {
    expect(serviceAccountExpression(exportedFunctions.deleteAccount)).toBe(
      "dh-account-deletion@{{ params.PROJECT_ID }}.iam.gserviceaccount.com"
    );
  });

  it("uses the ordinary restricted runtime identity for every other callable", () => {
    const ordinaryCallables = Object.entries(exportedFunctions).filter(
      ([name]) => name !== "deleteAccount"
    );

    expect(ordinaryCallables.length).toBeGreaterThan(0);
    for (const [name, callable] of ordinaryCallables) {
      expect(serviceAccountExpression(callable), name).toBe(
        "dh-functions-runtime@{{ params.PROJECT_ID }}.iam.gserviceaccount.com"
      );
    }
  });
});
