// tests/unit/campaignActions.test.ts
//
// Tests for the archiveCampaign utility in src/utils/campaignActions.ts.
// Firebase is fully mocked — no emulator needed.

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────

const { mockUpdateDoc, mockDoc, mockServerTimestamp } = vi.hoisted(() => ({
  mockUpdateDoc: vi.fn().mockResolvedValue(undefined),
  mockDoc: vi.fn(() => "doc-ref"),
  mockServerTimestamp: vi.fn(() => "server-timestamp"),
}));

vi.mock("firebase/firestore", () => ({
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  serverTimestamp: () => mockServerTimestamp(),
}));

vi.mock("../../src/firebase", () => ({
  db: "mock-db",
}));

import { archiveCampaign } from "../../src/utils/campaignActions";

// ── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe("archiveCampaign", () => {
  it("builds a ref pointing at the correct campaign document", async () => {
    await archiveCampaign("camp-1");
    expect(mockDoc).toHaveBeenCalledWith("mock-db", "campaigns", "camp-1");
  });

  it("calls updateDoc with archivedAt: serverTimestamp()", async () => {
    await archiveCampaign("camp-1");
    expect(mockUpdateDoc).toHaveBeenCalledWith("doc-ref", {
      archivedAt: "server-timestamp",
    });
  });

  it("calls updateDoc exactly once per invocation", async () => {
    await archiveCampaign("camp-1");
    expect(mockUpdateDoc).toHaveBeenCalledOnce();
  });

  it("uses the correct id when called with different campaign ids", async () => {
    await archiveCampaign("alpha");
    await archiveCampaign("beta");
    expect(mockDoc).toHaveBeenCalledWith("mock-db", "campaigns", "alpha");
    expect(mockDoc).toHaveBeenCalledWith("mock-db", "campaigns", "beta");
  });
});
