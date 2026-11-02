import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.useFakeTimers();
  vi.resetModules();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("code preparation", () => {
  it("shares an import with immediate foreground use and permits retry after failure", async () => {
    const { cachedImport } = await import("../../src/utils/prepareCode");
    const importer = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue({ ready: true });
    const load = cachedImport(importer);
    const first = load();
    expect(load()).toBe(first);
    await expect(first).rejects.toThrow("offline");
    await expect(load()).resolves.toEqual({ ready: true });
    await load();
    expect(importer).toHaveBeenCalledTimes(2);
  });

  it("waits for idle time and serialises imports", async () => {
    const callbacks: IdleRequestCallback[] = [];
    vi.stubGlobal(
      "requestIdleCallback",
      vi.fn((callback) => {
        callbacks.push(callback);
        return callbacks.length;
      })
    );
    vi.stubGlobal("cancelIdleCallback", vi.fn());
    const { prepareCode } = await import("../../src/utils/prepareCode");
    let finish!: () => void;
    const first = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    );
    const second = vi.fn().mockResolvedValue(undefined);
    prepareCode([first, second]);
    expect(first).not.toHaveBeenCalled();
    callbacks.shift()!({} as IdleDeadline);
    await vi.advanceTimersByTimeAsync(0);
    expect(first).toHaveBeenCalledOnce();
    expect(second).not.toHaveBeenCalled();
    expect(callbacks).toHaveLength(0);
    finish();
    await vi.advanceTimersByTimeAsync(0);
    expect(callbacks).toHaveLength(1);
    callbacks.shift()!({} as IdleDeadline);
    await vi.advanceTimersByTimeAsync(0);
    expect(second).toHaveBeenCalledOnce();
  });

  it("cancels pending work without cancelling another owner's request", async () => {
    vi.stubGlobal("requestIdleCallback", undefined);
    const { prepareCode } = await import("../../src/utils/prepareCode");
    const shared = vi.fn().mockResolvedValue(undefined);
    const cancelled = vi.fn().mockResolvedValue(undefined);
    const cancel = prepareCode([shared, cancelled]);
    prepareCode([shared]);
    cancel();
    await vi.runAllTimersAsync();
    expect(shared).toHaveBeenCalledOnce();
    expect(cancelled).not.toHaveBeenCalled();
  });

  it("continues after a failed background import and cancels the fallback timer", async () => {
    vi.stubGlobal("requestIdleCallback", undefined);
    const { prepareCode } = await import("../../src/utils/prepareCode");
    const failed = vi.fn().mockRejectedValue(new Error("offline"));
    const next = vi.fn().mockResolvedValue(undefined);
    prepareCode([failed, next]);
    await vi.runAllTimersAsync();
    expect(next).toHaveBeenCalledOnce();
    const cancelled = vi.fn().mockResolvedValue(undefined);
    prepareCode([cancelled])();
    await vi.runAllTimersAsync();
    expect(cancelled).not.toHaveBeenCalled();
  });
});
