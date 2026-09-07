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
});
