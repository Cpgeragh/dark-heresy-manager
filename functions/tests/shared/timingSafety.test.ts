// functions/tests/shared/timingSafety.test.ts
import { describe, it, expect } from "vitest";
import { withMinimumDuration } from "../../src/shared/timingSafety";

describe("withMinimumDuration", () => {
  it("pads a fast resolving call up to the minimum duration", async () => {
    const start = Date.now();
    const result = await withMinimumDuration(100, async () => "fast");
    const elapsed = Date.now() - start;

    expect(result).toBe("fast");
    expect(elapsed).toBeGreaterThanOrEqual(95);
  });

  it("does not add extra delay when the call already exceeds the minimum", async () => {
    const start = Date.now();
    const result = await withMinimumDuration(10, async () => {
      await new Promise((resolve) => setTimeout(resolve, 60));
      return "slow";
    });
    const elapsed = Date.now() - start;

    expect(result).toBe("slow");
    expect(elapsed).toBeLessThan(150);
  });

  it("still pads a thrown error up to the minimum duration, then rethrows it", async () => {
    const failure = new Error("boom");
    const start = Date.now();

    await expect(
      withMinimumDuration(100, async () => {
        throw failure;
      })
    ).rejects.toBe(failure);

    expect(Date.now() - start).toBeGreaterThanOrEqual(95);
  });
});
