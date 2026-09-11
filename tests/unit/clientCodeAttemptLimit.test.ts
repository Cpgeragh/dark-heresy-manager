// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ClientCodeAttemptLimitError,
  recordClientCodeAttempt,
} from "../../src/utils/clientCodeAttemptLimit";

describe("client code-attempt limiting", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-29T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows five recovery attempts and blocks the sixth with a retry time", () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect(() => recordClientCodeAttempt("recovery")).not.toThrow();
    }

    expect(() => recordClientCodeAttempt("recovery")).toThrow(
      expect.objectContaining({
        name: "ClientCodeAttemptLimitError",
        message: "5-attempt recovery-code limit reached. Try again in 15 minutes.",
      })
    );
  });

  it("allows another attempt when the rolling 15-minute window has elapsed", () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      recordClientCodeAttempt("recovery");
    }
    vi.advanceTimersByTime(15 * 60 * 1_000);

    expect(() => recordClientCodeAttempt("recovery")).not.toThrow();
  });

  it("counts down to a full reset without jumping back up", () => {
    const minute = 60 * 1_000;
    const start = Date.now();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      recordClientCodeAttempt("recovery", start + attempt * minute);
    }

    expect(() => recordClientCodeAttempt("recovery", start + 14 * minute)).toThrow(
      expect.objectContaining({
        message: "5-attempt recovery-code limit reached. Try again in 5 minutes.",
      })
    );
    expect(() => recordClientCodeAttempt("recovery", start + 18 * minute)).toThrow(
      expect.objectContaining({
        message: "5-attempt recovery-code limit reached. Try again in 1 minute.",
      })
    );
    expect(() => recordClientCodeAttempt("recovery", start + 19 * minute)).not.toThrow();
  });

  it("tracks recovery and device-link attempts independently", () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      recordClientCodeAttempt("recovery");
    }

    expect(() => recordClientCodeAttempt("recovery")).toThrow(ClientCodeAttemptLimitError);
    expect(() => recordClientCodeAttempt("device-link")).not.toThrow();
  });

  it("recovers safely from malformed browser storage", () => {
    localStorage.setItem("dh-manager:code-attempts:v1:recovery", "not-json");

    expect(() => recordClientCodeAttempt("recovery")).not.toThrow();
  });
});
