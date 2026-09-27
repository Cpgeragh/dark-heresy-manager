import { afterAll, describe, expect, it } from "vitest";
import { httpsCallable } from "firebase/functions";
import { getTestFunctions, teardownTestFunctions } from "./setup";

describe("Functions: real callable authentication", () => {
  afterAll(async () => {
    await teardownTestFunctions();
  });

  it("enforces authentication on the recovery-code endpoint", async () => {
    const revealIdentityCode = httpsCallable(getTestFunctions(), "revealIdentityCode");

    await expect(revealIdentityCode({})).rejects.toMatchObject({
      code: "functions/unauthenticated",
    });
  });

  it("enforces authentication on a protected mutation", async () => {
    const createCampaign = httpsCallable(getTestFunctions(), "createCampaign");

    await expect(
      createCampaign({ name: "Test", operationId: "test-operation" })
    ).rejects.toMatchObject({
      code: "functions/unauthenticated",
    });
  });
});
