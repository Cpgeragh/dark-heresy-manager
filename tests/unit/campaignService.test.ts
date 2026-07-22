import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockDoc, mockServerTimestamp, mockUpdateDoc } = vi.hoisted(() => ({
  mockDoc: vi.fn((..._args: unknown[]) => "doc-ref"),
  mockServerTimestamp: vi.fn(() => "server-timestamp"),
  mockUpdateDoc: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  doc: (...args: unknown[]) => mockDoc(...args),
  getDocs: vi.fn(),
  serverTimestamp: () => mockServerTimestamp(),
  setDoc: vi.fn(),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  writeBatch: vi.fn(),
}));

vi.mock("../../src/firebase", () => ({
  db: "mock-db",
}));

import { archiveCampaign, restoreCampaign } from "../../src/services/campaignService";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("campaign archive operations", () => {
  it("archives the requested campaign using a server timestamp", async () => {
    await archiveCampaign("camp-1");

    expect(mockDoc).toHaveBeenCalledWith("mock-db", "campaigns", "camp-1");
    expect(mockServerTimestamp).toHaveBeenCalledOnce();
    expect(mockUpdateDoc).toHaveBeenCalledWith("doc-ref", {
      archivedAt: "server-timestamp",
    });
  });

  it("restores the requested campaign by clearing its archive timestamp", async () => {
    await restoreCampaign("camp-2");

    expect(mockDoc).toHaveBeenCalledWith("mock-db", "campaigns", "camp-2");
    expect(mockServerTimestamp).not.toHaveBeenCalled();
    expect(mockUpdateDoc).toHaveBeenCalledWith("doc-ref", {
      archivedAt: null,
    });
  });

  it("preserves Firestore failures for the caller to handle", async () => {
    const error = new Error("write failed");
    mockUpdateDoc.mockRejectedValueOnce(error);

    await expect(archiveCampaign("camp-3")).rejects.toBe(error);
  });
});
