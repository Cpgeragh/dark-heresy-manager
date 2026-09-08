import type { ProfilerOnRenderCallback } from "react";
import type { SnapshotMetadata } from "firebase/firestore";

type PerformanceEventKind =
  | "listener-start"
  | "listener-snapshot"
  | "listener-error"
  | "listener-stop"
  | "react-commit"
  | "mark";

export interface ApplicationPerformanceEvent {
  kind: PerformanceEventKind;
  name: string;
  at: number;
  duration?: number;
  count?: number;
  phase?: string;
  fromCache?: boolean;
  hasPendingWrites?: boolean;
}

interface PerformanceSnapshot {
  events: ApplicationPerformanceEvent[];
  activeListeners: number;
  componentRenderCounts: Record<string, number>;
  heapBytes: number | null;
  navigation: NavigationPerformanceEntry | null;
  resources: ResourcePerformanceEntry[];
}

interface NavigationPerformanceEntry {
  startTime: number;
  responseStart: number;
  responseEnd: number;
  domInteractive: number;
  domContentLoaded: number;
  load: number;
  transferBytes: number;
  encodedBytes: number;
}

interface ResourcePerformanceEntry {
  name: string;
  initiatorType: string;
  startTime: number;
  duration: number;
  transferBytes: number;
  encodedBytes: number;
  decodedBytes: number;
}

interface ApplicationPerformanceRecorder {
  readonly events: ApplicationPerformanceEvent[];
  readonly componentRenderCounts: Map<string, number>;
  activeListeners: number;
  countComponentRender: (name: string) => void;
  mark: (name: string) => void;
  reset: () => void;
  snapshot: () => PerformanceSnapshot;
}

declare global {
  interface Window {
    __DHM_PERFORMANCE__?: ApplicationPerformanceRecorder;
  }
}

const MAX_RECORDED_EVENTS = 2_000;

function heapBytes(): number | null {
  const memory = (performance as Performance & { memory?: { usedJSHeapSize?: number } }).memory;
  return typeof memory?.usedJSHeapSize === "number" ? memory.usedJSHeapSize : null;
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function navigationEntry(): NavigationPerformanceEntry | null {
  if (typeof performance.getEntriesByType !== "function") return null;
  const entry = performance.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;
  if (!entry) return null;
  return {
    startTime: round(entry.startTime),
    responseStart: round(entry.responseStart),
    responseEnd: round(entry.responseEnd),
    domInteractive: round(entry.domInteractive),
    domContentLoaded: round(entry.domContentLoadedEventEnd),
    load: round(entry.loadEventEnd),
    transferBytes: entry.transferSize,
    encodedBytes: entry.encodedBodySize,
  };
}

function safeResourceName(name: string): string {
  try {
    const url = new URL(name, window.location.href);
    return url.origin === window.location.origin ? url.pathname : `${url.origin}${url.pathname}`;
  } catch {
    return name.split("?", 1)[0];
  }
}

function resourceEntries(): ResourcePerformanceEntry[] {
  if (typeof performance.getEntriesByType !== "function") return [];
  return (performance.getEntriesByType("resource") as PerformanceResourceTiming[])
    .slice(-500)
    .map((entry) => ({
      name: safeResourceName(entry.name),
      initiatorType: entry.initiatorType,
      startTime: round(entry.startTime),
      duration: round(entry.duration),
      transferBytes: entry.transferSize,
      encodedBytes: entry.encodedBodySize,
      decodedBytes: entry.decodedBodySize,
    }));
}

function recorder(): ApplicationPerformanceRecorder | null {
  if (import.meta.env.MODE !== "performance" || typeof window === "undefined") return null;
  if (window.__DHM_PERFORMANCE__) return window.__DHM_PERFORMANCE__;

  const events: ApplicationPerformanceEvent[] = [];
  const componentRenderCounts = new Map<string, number>();
  window.__DHM_PERFORMANCE__ = {
    events,
    componentRenderCounts,
    activeListeners: 0,
    countComponentRender(name) {
      componentRenderCounts.set(name, (componentRenderCounts.get(name) ?? 0) + 1);
    },
    mark(name) {
      record({ kind: "mark", name, at: performance.now() });
    },
    reset() {
      events.length = 0;
      componentRenderCounts.clear();
    },
    snapshot() {
      return {
        events: [...events],
        activeListeners: this.activeListeners,
        componentRenderCounts: Object.fromEntries(componentRenderCounts),
        heapBytes: heapBytes(),
        navigation: navigationEntry(),
        resources: resourceEntries(),
      };
    },
  };
  document.addEventListener("dhm-performance-snapshot-request", () => {
    document.documentElement.dataset.dhmPerformanceSnapshot = JSON.stringify(
      window.__DHM_PERFORMANCE__?.snapshot() ?? null
    );
  });
  document.addEventListener("dhm-performance-reset", () => {
    window.__DHM_PERFORMANCE__?.reset();
  });
  document.addEventListener("dhm-performance-mark", () => {
    const name = document.documentElement.dataset.dhmPerformanceMark;
    if (name) window.__DHM_PERFORMANCE__?.mark(name);
    delete document.documentElement.dataset.dhmPerformanceMark;
  });
  const snapshotButton = document.createElement("button");
  snapshotButton.id = "dhm-performance-snapshot";
  snapshotButton.type = "button";
  snapshotButton.tabIndex = -1;
  snapshotButton.setAttribute("aria-hidden", "true");
  snapshotButton.style.cssText =
    "position:fixed;right:0;bottom:0;width:2px;height:2px;opacity:.01;z-index:2147483647;padding:0;border:0";
  snapshotButton.addEventListener("click", (event) => {
    event.stopPropagation();
    document.documentElement.dataset.dhmPerformanceSnapshot = JSON.stringify(
      window.__DHM_PERFORMANCE__?.snapshot() ?? null
    );
  });
  document.documentElement.append(snapshotButton);
  const resetButton = document.createElement("button");
  resetButton.id = "dhm-performance-reset";
  resetButton.type = "button";
  resetButton.tabIndex = -1;
  resetButton.setAttribute("aria-hidden", "true");
  resetButton.style.cssText = snapshotButton.style.cssText;
  resetButton.style.right = "3px";
  resetButton.addEventListener("click", (event) => {
    event.stopPropagation();
    window.__DHM_PERFORMANCE__?.reset();
  });
  document.documentElement.append(resetButton);
  return window.__DHM_PERFORMANCE__;
}

function record(event: ApplicationPerformanceEvent): void {
  const target = recorder();
  if (!target) return;
  target.events.push(event);
  if (target.events.length > MAX_RECORDED_EVENTS) target.events.shift();
}

export function beginPerformanceSubscription(name: string) {
  const target = recorder();
  if (!target) return null;
  const startedAt = performance.now();
  target.activeListeners += 1;
  record({ kind: "listener-start", name, at: startedAt });

  return {
    snapshot(count: number, metadata?: SnapshotMetadata) {
      const now = performance.now();
      record({
        kind: "listener-snapshot",
        name,
        at: now,
        duration: now - startedAt,
        count,
        ...(metadata
          ? {
              fromCache: metadata.fromCache,
              hasPendingWrites: metadata.hasPendingWrites,
            }
          : {}),
      });
    },
    error() {
      record({ kind: "listener-error", name, at: performance.now() });
    },
    stop() {
      target.activeListeners = Math.max(0, target.activeListeners - 1);
      record({ kind: "listener-stop", name, at: performance.now() });
    },
  };
}

export const recordApplicationCommit: ProfilerOnRenderCallback = (id, phase, actualDuration) => {
  record({
    kind: "react-commit",
    name: id,
    at: performance.now(),
    duration: actualDuration,
    phase,
  });
};

export function markApplicationPerformance(name: string): void {
  recorder()?.mark(name);
}

/** Counts component function executions in performance builds only. */
export function recordComponentRender(name: string): void {
  if (import.meta.env.MODE !== "performance") return;
  recorder()?.countComponentRender(name);
}
