// tests/functions/ping.test.ts
import { describe, it, expect, afterAll } from "vitest";
import { httpsCallable } from "firebase/functions";
import { getTestFunctions, teardownTestFunctions } from "./setup";

describe("Functions: protected callable transport", () => {
  afterAll(async () => {
    await teardownTestFunctions();
  });

  it("reaches the real recovery-code endpoint and enforces authentication", async () => {
    const revealCode = httpsCallable(getTestFunctions(), "revealIdentityCode");
    await expect(revealCode({})).rejects.toMatchObject({ code: "functions/unauthenticated" });
  });
});
