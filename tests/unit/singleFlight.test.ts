import { describe, expect, it, vi } from "vitest";
import { runSingleFlight } from "../../src/utils/singleFlight";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

describe("runSingleFlight", () => {
  it("shares one in-flight operation for an identical key", async () => {
    const pending = deferred<string>();
    const operation = vi.fn(() => pending.promise);

    const first = runSingleFlight("campaign:create", ["user-1"], operation);
    const duplicate = runSingleFlight("campaign:create", ["user-1"], operation);

    expect(first).toBe(duplicate);
    expect(operation).not.toHaveBeenCalled();

    await Promise.resolve();
    expect(operation).toHaveBeenCalledOnce();

    pending.resolve("campaign-1");
    await expect(first).resolves.toBe("campaign-1");
    await expect(duplicate).resolves.toBe("campaign-1");
  });

  it("allows different operation identities to run independently", async () => {
    const firstOperation = vi.fn().mockResolvedValue("one");
    const secondOperation = vi.fn().mockResolvedValue("two");

    await expect(
      Promise.all([
        runSingleFlight("character:update", ["char-1", { wounds: 1 }], firstOperation),
        runSingleFlight("character:update", ["char-1", { wounds: 2 }], secondOperation),
      ])
    ).resolves.toEqual(["one", "two"]);
    expect(firstOperation).toHaveBeenCalledOnce();
    expect(secondOperation).toHaveBeenCalledOnce();
  });

  it("releases a failed operation so it can be retried", async () => {
    const operation = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce("retried");

    await expect(runSingleFlight("session:save", ["session-1"], operation)).rejects.toThrow(
      "offline"
    );
    await expect(runSingleFlight("session:save", ["session-1"], operation)).resolves.toBe(
      "retried"
    );
    expect(operation).toHaveBeenCalledTimes(2);
  });
});
