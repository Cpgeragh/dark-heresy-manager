import type { ProfilerOnRenderCallback } from "react";

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
}

interface PerformanceSnapshot {
  events: ApplicationPerformanceEvent[];
  activeListeners: number;
  heapBytes: number | null;
}

interface ApplicationPerformanceRecorder {
  readonly events: ApplicationPerformanceEvent[];
  activeListeners: number;
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

function recorder(): ApplicationPerformanceRecorder | null {
  if (import.meta.env.MODE !== "performance" || typeof window === "undefined") return null;
  if (window.__DHM_PERFORMANCE__) return window.__DHM_PERFORMANCE__;

  const events: ApplicationPerformanceEvent[] = [];
  window.__DHM_PERFORMANCE__ = {
    events,
    activeListeners: 0,
    mark(name) {
      record({ kind: "mark", name, at: performance.now() });
    },
    reset() {
      events.length = 0;
    },
    snapshot() {
      return {
        events: [...events],
        activeListeners: this.activeListeners,
        heapBytes: heapBytes(),
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
    snapshot(count: number) {
      const now = performance.now();
      record({ kind: "listener-snapshot", name, at: now, duration: now - startedAt, count });
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
