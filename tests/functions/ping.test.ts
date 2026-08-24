// tests/functions/ping.test.ts
import { describe, it, expect, afterAll } from "vitest";
import { httpsCallable } from "firebase/functions";
import { getTestFunctions, teardownTestFunctions } from "./setup";

describe("Functions: ping", () => {
  afterAll(async () => {
    await teardownTestFunctions();
  });

  it("responds ok over the emulator, proving the client-to-Function plumbing works", async () => {
    const ping = httpsCallable(getTestFunctions(), "ping");
    const result = await ping();
    expect(result.data).toEqual({ ok: true });
  });
});
