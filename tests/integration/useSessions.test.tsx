// tests/integration/useSessions.test.tsx
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

const {
  sessionsData,
  adjustSessionXp,
  updateSessionDocument,
  startSessionDocument,
  closeSessionDocument,
} = vi.hoisted(() => ({
  sessionsData: { current: [] as Record<string, unknown>[] },
  adjustSessionXp: vi.fn().mockResolvedValue(undefined),
  updateSessionDocument: vi.fn().mockResolvedValue(undefined),
  startSessionDocument: vi.fn().mockResolvedValue(undefined),
  closeSessionDocument: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => ({})),
  limit: vi.fn(() => ({})),
  orderBy: vi.fn(() => ({})),
  query: vi.fn(() => ({})),
}));
vi.mock("../../src/firebase", () => ({ db: {} }));
vi.mock("../../src/hooks/useFirestoreSubscription", () => ({
  useQuerySubscription: () => ({ data: sessionsData.current, loading: false, error: null }),
}));
vi.mock("../../src/services/sessionService", () => ({
  adjustSessionXp: (...args: unknown[]) => adjustSessionXp(...args),
  startSession: (...args: unknown[]) => startSessionDocument(...args),
  closeSession: (...args: unknown[]) => closeSessionDocument(...args),
  deleteSession: vi.fn(),
  updateSession: (...args: unknown[]) => updateSessionDocument(...args),
}));

import { useSessions } from "../../src/hooks/useSessions";

function session(overrides: Record<string, unknown> = {}) {
  return {
    id: "s1",
    date: new Date("2026-03-15"),
    summary: "Recap",
    dmNotes: "",
    xpAwarded: 100,
    attendees: ["c1"],
    xpApplied: true,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionsData.current = [session()];
});

describe("useSessions open session", () => {
  it("returns the session whose status is open, or null when none is", () => {
    sessionsData.current = [
      session({ id: "closed", status: "closed" }),
      session({ id: "older" }),
      session({ id: "live", status: "open", xpApplied: undefined, xpAwarded: 0 }),
    ];
    const { result, rerender } = renderHook(() => useSessions("camp-1", true));
    expect(result.current.openSession?.id).toBe("live");

    sessionsData.current = [session({ id: "closed", status: "closed" })];
    rerender();
    expect(result.current.openSession).toBeNull();
  });

  it("starts and closes a session for the current campaign", async () => {
    const { result } = renderHook(() => useSessions("camp-1", true));
    const closeData = { xpAwarded: 150, summary: "Recap", dmNotes: "", attendees: ["c1"] };

    await result.current.startSession("2026-10-17", ["c1"]);
    await result.current.closeSession("s1", closeData);

    expect(startSessionDocument).toHaveBeenCalledWith("camp-1", "2026-10-17", ["c1"]);
    expect(closeSessionDocument).toHaveBeenCalledWith("camp-1", "s1", closeData);
  });

  it("saves the notes of an open session directly, with no XP adjustment", async () => {
    sessionsData.current = [
      session({ id: "live", status: "open", xpApplied: undefined, xpAwarded: 0 }),
    ];
    const { result } = renderHook(() => useSessions("camp-1", true));

    await result.current.updateSession("live", {
      summary: "Notes so far",
      attendees: ["c1", "c2"],
    });

    expect(adjustSessionXp).not.toHaveBeenCalled();
    expect(updateSessionDocument).toHaveBeenCalledWith("camp-1", "live", {
      summary: "Notes so far",
      attendees: ["c1", "c2"],
    });
  });
});

describe("useSessions updateSession", () => {
  it("adjusts the characters first and then saves the other fields without the XP", async () => {
    const { result } = renderHook(() => useSessions("camp-1", true));
    const date = new Date("2026-04-01");

    await result.current.updateSession("s1", {
      date,
      summary: "New recap",
      dmNotes: "Notes",
      xpAwarded: 150,
      attendees: ["c1", "c2"],
    });

    expect(adjustSessionXp).toHaveBeenCalledWith("camp-1", "s1", 150, ["c1", "c2"]);
    expect(updateSessionDocument).toHaveBeenCalledWith("camp-1", "s1", {
      date,
      summary: "New recap",
      dmNotes: "Notes",
    });
    expect(adjustSessionXp.mock.invocationCallOrder[0]).toBeLessThan(
      updateSessionDocument.mock.invocationCallOrder[0]
    );
  });

  it("does not adjust any character when an applied session's XP and attendees are unchanged", async () => {
    const { result } = renderHook(() => useSessions("camp-1", true));

    await result.current.updateSession("s1", {
      summary: "Only the recap changed",
      xpAwarded: 100,
      attendees: ["c1"],
    });

    expect(adjustSessionXp).not.toHaveBeenCalled();
    expect(updateSessionDocument).toHaveBeenCalledWith("camp-1", "s1", {
      summary: "Only the recap changed",
    });
  });

  it("saves everything directly when the session's XP was never applied", async () => {
    sessionsData.current = [session({ xpApplied: false })];
    const { result } = renderHook(() => useSessions("camp-1", true));
    const data = { summary: "Recap", xpAwarded: 250, attendees: ["c1", "c2"] };

    await result.current.updateSession("s1", data);

    expect(adjustSessionXp).not.toHaveBeenCalled();
    expect(updateSessionDocument).toHaveBeenCalledWith("camp-1", "s1", data);
  });

  it("does not save the other fields when the adjustment is refused", async () => {
    adjustSessionXp.mockRejectedValueOnce(new Error("below the Spent XP"));
    const { result } = renderHook(() => useSessions("camp-1", true));

    await expect(
      result.current.updateSession("s1", { summary: "Recap", xpAwarded: 10, attendees: ["c1"] })
    ).rejects.toThrow("below the Spent XP");

    expect(updateSessionDocument).not.toHaveBeenCalled();
  });
});
