// tests/functions/protectedPing.test.ts
import { describe, it, expect, afterAll } from "vitest";
import { httpsCallable } from "firebase/functions";
import { getTestFunctions, teardownTestFunctions } from "./setup";

describe("Functions: real protected action", () => {
  afterAll(async () => {
    await teardownTestFunctions();
  });

  it("rejects an unauthenticated call, proving the real auth gate runs over the actual deployed callable", async () => {
    const protectedPing = httpsCallable(getTestFunctions(), "createCampaign");

    await expect(
      protectedPing({ name: "Test", operationId: "test-operation" })
    ).rejects.toMatchObject({
      code: "functions/unauthenticated",
    });
  });
});
