import { beforeEach, describe, expect, it, vi } from "vitest";
import { repairSessionSummaries } from "../../src/operations/repairSessionSummaries";

const {
  mockCampaignGet,
  mockUserLinkGet,
  mockSessionsGet,
  mockSessionsLimit,
  mockSummaryDoc,
  mockBatchSet,
  mockBatchCommit,
} = vi.hoisted(() => {
  const mockCampaignGet = vi.fn();
  const mockUserLinkGet = vi.fn();
  const mockSessionsGet = vi.fn();
  const mockSessionsLimit = vi.fn();
  const mockSummaryDoc = vi.fn((id: string) => ({ path: `sessionSummaries/${id}` }));
  const mockBatchSet = vi.fn();
  const mockBatchCommit = vi.fn().mockResolvedValue(undefined);
  return {
    mockCampaignGet,
    mockUserLinkGet,
    mockSessionsGet,
    mockSessionsLimit,
    mockSummaryDoc,
    mockBatchSet,
    mockBatchCommit,
  };
});

const sessionsQuery = {
  orderBy: vi.fn(() => sessionsQuery),
  limit: mockSessionsLimit.mockImplementation(() => sessionsQuery),
  get: mockSessionsGet,
};
const summaryCollection = { doc: mockSummaryDoc };
const campaignRef = {
  get: mockCampaignGet,
  collection: vi.fn((name: string) => {
    if (name === "sessions") return sessionsQuery;
    if (name === "sessionSummaries") return summaryCollection;
    throw new Error(`Unexpected campaign subcollection: ${name}`);
  }),
};
const campaignsCollection = { doc: vi.fn(() => campaignRef) };
const userLinksCollection = { doc: vi.fn(() => ({ get: mockUserLinkGet })) };
const batch = { set: mockBatchSet, commit: mockBatchCommit };

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({
    collection: (name: string) => {
      if (name === "campaigns") return campaignsCollection;
      if (name === "userLinks") return userLinksCollection;
      throw new Error(`Unexpected collection: ${name}`);
    },
    batch: () => batch,
  }),
  FieldPath: { documentId: () => "__name__" },
}));

const timestamp = () => ({ toMillis: () => 1_787_860_000_000 });

function session(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    data: () => ({
      date: timestamp(),
      summary: `Recap ${id}`,
      dmNotes: `Private ${id}`,
      xpAwarded: 100,
      attendees: ["char-1"],
      createdAt: timestamp(),
      xpApplied: false,
      ...overrides,
    }),
  };
}

describe("repairSessionSummaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionsLimit.mockImplementation(() => sessionsQuery);
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockSessionsGet.mockResolvedValue({ docs: [] });
    mockUserLinkGet.mockResolvedValue({ exists: false });
    mockBatchCommit.mockResolvedValue(undefined);
  });

  it("rejects an invalid campaign ID before reading Firestore", async () => {
    await expect(repairSessionSummaries({ campaignId: "bad/id" }, "dm-1")).rejects.toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
    expect(mockCampaignGet).not.toHaveBeenCalled();
  });

  it("rejects a missing campaign", async () => {
    mockCampaignGet.mockResolvedValue({ exists: false });

    await expect(repairSessionSummaries({ campaignId: "c1" }, "dm-1")).rejects.toThrow(
      expect.objectContaining({ code: "not-found" })
    );
  });

  it("rejects a caller who is not the campaign DM", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "other-dm" }) });

    await expect(repairSessionSummaries({ campaignId: "c1" }, "dm-1")).rejects.toThrow(
      expect.objectContaining({ code: "permission-denied" })
    );
    expect(mockSessionsGet).not.toHaveBeenCalled();
  });

  it("allows a device linked to the campaign DM", async () => {
    mockUserLinkGet.mockResolvedValue({
      exists: true,
      data: () => ({ primaryUid: "dm-1" }),
    });
    mockSessionsGet.mockResolvedValue({ docs: [session("s1")] });

    await expect(repairSessionSummaries({ campaignId: "c1" }, "linked-device")).resolves.toEqual({
      repairedCount: 1,
    });
    expect(mockBatchCommit).toHaveBeenCalledOnce();
  });

  it("rejects a device linked to someone other than the campaign DM", async () => {
    mockUserLinkGet.mockResolvedValue({
      exists: true,
      data: () => ({ primaryUid: "other-user" }),
    });

    await expect(repairSessionSummaries({ campaignId: "c1" }, "linked-device")).rejects.toThrow(
      expect.objectContaining({ code: "permission-denied" })
    );
    expect(mockSessionsGet).not.toHaveBeenCalled();
  });

  it("returns zero without creating a batch when there are no sessions", async () => {
    await expect(repairSessionSummaries({ campaignId: "c1" }, "dm-1")).resolves.toEqual({
      repairedCount: 0,
    });
    expect(mockBatchSet).not.toHaveBeenCalled();
    expect(mockBatchCommit).not.toHaveBeenCalled();
  });

  it("writes only approved member-safe fields for every historical session", async () => {
    mockSessionsGet.mockResolvedValue({
      docs: [session("s1"), session("s2", { xpApplied: undefined })],
    });

    await expect(repairSessionSummaries({ campaignId: "c1" }, "dm-1")).resolves.toEqual({
      repairedCount: 2,
    });

    expect(mockSessionsLimit).toHaveBeenCalledWith(201);
    expect(mockBatchSet).toHaveBeenCalledTimes(2);
    expect(mockBatchSet).toHaveBeenCalledWith(
      { path: "sessionSummaries/s1" },
      expect.objectContaining({
        summary: "Recap s1",
        xpAwarded: 100,
        attendees: ["char-1"],
        xpApplied: false,
      })
    );
    const writtenData = mockBatchSet.mock.calls[0][1] as Record<string, unknown>;
    expect(writtenData).not.toHaveProperty("dmNotes");
    expect(mockBatchSet.mock.calls[1][1]).not.toHaveProperty("xpApplied");
    expect(mockBatchCommit).toHaveBeenCalledOnce();
  });

  it("stops before any write when historical source data is invalid", async () => {
    mockSessionsGet.mockResolvedValue({
      docs: [session("valid"), session("bad", { attendees: ["bad/id"] })],
    });

    await expect(repairSessionSummaries({ campaignId: "c1" }, "dm-1")).rejects.toThrow(
      expect.objectContaining({ code: "failed-precondition" })
    );
    expect(mockBatchSet).not.toHaveBeenCalled();
    expect(mockBatchCommit).not.toHaveBeenCalled();
  });

  it("refuses more than 200 sessions before staging any write", async () => {
    mockSessionsGet.mockResolvedValue({
      docs: Array.from({ length: 201 }, (_, index) => session(`s${index}`)),
    });

    await expect(repairSessionSummaries({ campaignId: "c1" }, "dm-1")).rejects.toThrow(
      expect.objectContaining({ code: "resource-exhausted" })
    );
    expect(mockBatchSet).not.toHaveBeenCalled();
    expect(mockBatchCommit).not.toHaveBeenCalled();
  });
});
