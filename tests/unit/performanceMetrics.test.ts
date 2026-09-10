import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("performance metrics recorder", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("MODE", "performance");
    delete window.__DHM_PERFORMANCE__;
    document.documentElement.removeAttribute("data-dhm-performance-snapshot");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    document.querySelector("#dhm-performance-snapshot")?.remove();
    document.querySelector("#dhm-performance-reset")?.remove();
    delete window.__DHM_PERFORMANCE__;
    vi.restoreAllMocks();
  });

  it("records startup marks and returns navigation and resource timing without query strings", async () => {
    const navigation = {
      startTime: 0,
      responseStart: 12.34,
      responseEnd: 18.21,
      domInteractive: 30.02,
      domContentLoadedEventEnd: 35.16,
      loadEventEnd: 42.08,
      transferSize: 1_200,
      encodedBodySize: 900,
    };
    const resource = {
      name: `${window.location.origin}/assets/app.js?private=value`,
      initiatorType: "script",
      startTime: 9.94,
      duration: 15.06,
      transferSize: 2_000,
      encodedBodySize: 1_700,
      decodedBodySize: 5_000,
    };
    vi.spyOn(performance, "getEntriesByType").mockImplementation((type) => {
      if (type === "navigation") return [navigation as PerformanceEntry];
      if (type === "resource") return [resource as PerformanceEntry];
      return [];
    });

    const { markApplicationPerformance } = await import("../../src/performance/performanceMetrics");
    markApplicationPerformance("startup:test");

    const snapshot = window.__DHM_PERFORMANCE__?.snapshot();
    expect(snapshot?.events).toEqual([
      expect.objectContaining({ kind: "mark", name: "startup:test" }),
    ]);
    expect(snapshot?.navigation).toEqual({
      startTime: 0,
      responseStart: 12.3,
      responseEnd: 18.2,
      domInteractive: 30,
      domContentLoaded: 35.2,
      load: 42.1,
      transferBytes: 1_200,
      encodedBytes: 900,
    });
    expect(snapshot?.resources).toEqual([
      {
        name: "/assets/app.js",
        initiatorType: "script",
        startTime: 9.9,
        duration: 15.1,
        transferBytes: 2_000,
        encodedBytes: 1_700,
        decodedBytes: 5_000,
      },
    ]);
  });

  it("records whether a listener snapshot came from cache", async () => {
    const { beginPerformanceSubscription } =
      await import("../../src/performance/performanceMetrics");
    const subscription = beginPerformanceSubscription("campaigns:test");

    subscription?.snapshot(3, { fromCache: true, hasPendingWrites: false });

    expect(window.__DHM_PERFORMANCE__?.snapshot().events).toContainEqual(
      expect.objectContaining({
        kind: "listener-snapshot",
        name: "campaigns:test",
        count: 3,
        fromCache: true,
        hasPendingWrites: false,
      })
    );
  });

  it("records a sanitized Firestore listener error code", async () => {
    const { beginPerformanceSubscription } =
      await import("../../src/performance/performanceMetrics");
    const subscription = beginPerformanceSubscription("campaigns:test:armour");

    subscription?.error("permission-denied");

    expect(window.__DHM_PERFORMANCE__?.snapshot().events).toContainEqual(
      expect.objectContaining({
        kind: "listener-error",
        name: "campaigns:test:armour",
        errorCode: "permission-denied",
      })
    );
  });

  it("records mutation acknowledgement timing without storing a payload", async () => {
    const { measurePerformanceMutation } = await import("../../src/performance/performanceMetrics");

    await expect(measurePerformanceMutation("character:notes", async () => "saved")).resolves.toBe(
      "saved"
    );

    const events = window.__DHM_PERFORMANCE__?.snapshot().events ?? [];
    const start = events.find((event) => event.kind === "mutation-start");
    const complete = events.find((event) => event.kind === "mutation-complete");
    expect(start).toEqual(
      expect.objectContaining({ kind: "mutation-start", name: "character:notes" })
    );
    expect(complete).toEqual(
      expect.objectContaining({
        kind: "mutation-complete",
        name: "character:notes",
        mutationId: start?.mutationId,
      })
    );
    expect(complete?.duration).toBeGreaterThanOrEqual(0);
    expect(JSON.stringify(events)).not.toContain("saved");
  });

  it("records a sanitized mutation error and preserves the rejection", async () => {
    const { measurePerformanceMutation } = await import("../../src/performance/performanceMetrics");
    const failure = Object.assign(new Error("private detail"), {
      code: "functions/permission-denied",
    });

    await expect(
      measurePerformanceMutation("character:notes", async () => {
        throw failure;
      })
    ).rejects.toBe(failure);

    expect(window.__DHM_PERFORMANCE__?.snapshot().events).toContainEqual(
      expect.objectContaining({
        kind: "mutation-error",
        name: "character:notes",
        errorCode: "functions/permission-denied",
      })
    );
    expect(JSON.stringify(window.__DHM_PERFORMANCE__?.snapshot().events)).not.toContain(
      "private detail"
    );
  });

  it("counts named component renders and clears them on reset", async () => {
    const { recordComponentRender } = await import("../../src/performance/performanceMetrics");

    recordComponentRender("SkillRow");
    recordComponentRender("SkillRow");
    recordComponentRender("SkillsTab");

    expect(window.__DHM_PERFORMANCE__?.snapshot().componentRenderCounts).toEqual({
      SkillRow: 2,
      SkillsTab: 1,
    });

    window.__DHM_PERFORMANCE__?.reset();
    expect(window.__DHM_PERFORMANCE__?.snapshot().componentRenderCounts).toEqual({});
  });
});
