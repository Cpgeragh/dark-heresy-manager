import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockDoc,
  mockServerTimestamp,
  mockSetDoc,
  mockUpdateDoc,
  mockDeleteField,
  mockGetDocs,
  mockQuery,
  mockWhere,
  mockLimit,
  mockWriteBatch,
  mockBatchUpdate,
  mockBatchCommit,
  mockCampaignsCollectionRef,
  mockCallStartCampaignDeletionJob,
  mockCallProcessCampaignDeletionChunk,
} = vi.hoisted(() => ({
  mockDoc: vi.fn((...args: unknown[]) => args.slice(1).join("/")),
  mockServerTimestamp: vi.fn(() => "server-timestamp"),
  mockSetDoc: vi.fn().mockResolvedValue(undefined),
  mockUpdateDoc: vi.fn().mockResolvedValue(undefined),
  mockDeleteField: vi.fn(() => "delete-field-sentinel"),
  mockGetDocs: vi.fn(),
  mockQuery: vi.fn((...args: unknown[]) => args),
  mockWhere: vi.fn((...args: unknown[]) => ["where", ...args]),
  mockLimit: vi.fn((value: number) => ["limit", value]),
  mockBatchUpdate: vi.fn(),
  mockBatchCommit: vi.fn().mockResolvedValue(undefined),
  mockWriteBatch: vi.fn(),
  mockCampaignsCollectionRef: vi.fn(() => "campaigns-ref"),
  mockCallStartCampaignDeletionJob: vi.fn(),
  mockCallProcessCampaignDeletionChunk: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  collection: (...args: unknown[]) =>
    args.length === 2 ? args.join("/") : args.slice(1).join("/"),
  doc: (...args: unknown[]) => mockDoc(...args),
  deleteField: () => mockDeleteField(),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  limit: (value: number) => mockLimit(value),
  query: (...args: unknown[]) => mockQuery(...args),
  serverTimestamp: () => mockServerTimestamp(),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  writeBatch: (...args: unknown[]) => mockWriteBatch(...args),
}));

vi.mock("firebase/functions", () => ({
  httpsCallable: vi.fn((_functions: unknown, name: string) => {
    if (name === "startCampaignDeletionJob") return mockCallStartCampaignDeletionJob;
    if (name === "processCampaignDeletionChunk") return mockCallProcessCampaignDeletionChunk;
    throw new Error(`Unexpected callable: ${name}`);
  }),
}));

vi.mock("../../src/firebase", () => ({
  db: "mock-db",
  functions: "mock-functions",
}));

vi.mock("../../src/firebase/converters", () => ({
  campaignsCollectionRef: (...args: unknown[]) => mockCampaignsCollectionRef(...args),
}));

import {
  archiveCampaign,
  createCampaign,
  deleteCampaign,
  preflightCampaignDeletion,
  restoreCampaign,
  syncGmNameAcrossCampaigns,
  updateCampaignDetails,
} from "../../src/services/campaignService";

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdateDoc.mockResolvedValue(undefined);
  mockSetDoc.mockResolvedValue(undefined);
  mockBatchCommit.mockResolvedValue(undefined);
  mockWriteBatch.mockReturnValue({ update: mockBatchUpdate, commit: mockBatchCommit });
});

describe("campaign input validation", () => {
  it("reuses one Firebase write for a duplicate in-flight campaign creation", async () => {
    let finish!: () => void;
    const pending = new Promise<void>((resolve) => {
      finish = resolve;
    });
    mockSetDoc.mockReturnValueOnce(pending);

    const first = createCampaign("The same campaign", "dm-1");
    const duplicate = createCampaign("The same campaign", "dm-1");
    await Promise.resolve();

    expect(mockSetDoc).toHaveBeenCalledOnce();
    finish();
    await Promise.all([first, duplicate]);
  });

  it("rejects a non-text campaign name before creating a Firestore reference", async () => {
    await expect(createCampaign(42 as unknown as string, "dm-1")).rejects.toThrow(
      "Campaign name must be text"
    );
    expect(mockDoc).not.toHaveBeenCalled();
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it("rejects a non-text renamed campaign value before writing", async () => {
    await expect(updateCampaignDetails("camp-1", false as unknown as string)).rejects.toThrow(
      "Campaign name must be text"
    );
    expect(mockDoc).not.toHaveBeenCalled();
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });
});

describe("campaign archive operations", () => {
  it("archives the requested campaign using a server timestamp", async () => {
    await archiveCampaign("camp-1");

    expect(mockDoc).toHaveBeenCalledWith("mock-db", "campaigns", "camp-1");
    expect(mockServerTimestamp).toHaveBeenCalledOnce();
    expect(mockUpdateDoc).toHaveBeenCalledWith("campaigns/camp-1", {
      archivedAt: "server-timestamp",
    });
  });

  it("restores the requested campaign by clearing its archive timestamp", async () => {
    await restoreCampaign("camp-2");

    expect(mockDoc).toHaveBeenCalledWith("mock-db", "campaigns", "camp-2");
    expect(mockServerTimestamp).not.toHaveBeenCalled();
    expect(mockUpdateDoc).toHaveBeenCalledWith("campaigns/camp-2", {
      archivedAt: null,
    });
  });

  it("preserves Firestore failures for the caller to handle", async () => {
    const error = new Error("write failed");
    mockUpdateDoc.mockRejectedValueOnce(error);

    await expect(archiveCampaign("camp-3")).rejects.toBe(error);
  });
});

describe("preflightCampaignDeletion", () => {
  it("calls the Function and returns the job id and total count", async () => {
    mockCallStartCampaignDeletionJob.mockResolvedValue({
      data: { jobId: "job-1", totalCount: 12 },
    });

    const result = await preflightCampaignDeletion("camp-1");

    expect(mockCallStartCampaignDeletionJob).toHaveBeenCalledWith({ campaignId: "camp-1" });
    expect(result).toEqual({ jobId: "job-1", totalCount: 12 });
  });

  it("propagates a rejection when a character has no usable Recovery Code", async () => {
    const error = new Error(
      "At least one character has no usable Recovery Code, so its Recovery Index cannot be removed safely."
    );
    mockCallStartCampaignDeletionJob.mockRejectedValue(error);

    await expect(preflightCampaignDeletion("camp-2")).rejects.toBe(error);
  });
});

describe("deleteCampaign", () => {
  beforeEach(() => {
    mockCallProcessCampaignDeletionChunk.mockResolvedValue({
      data: { done: true, processedCount: 12, totalCount: 12 },
    });
  });

  it("drives the job to completion", async () => {
    await deleteCampaign("job-1");

    expect(mockCallProcessCampaignDeletionChunk).toHaveBeenCalledWith({ jobId: "job-1" });
  });

  it("keeps calling process until the job reports done, reporting progress", async () => {
    mockCallProcessCampaignDeletionChunk
      .mockResolvedValueOnce({ data: { done: false, processedCount: 6, totalCount: 12 } })
      .mockResolvedValueOnce({ data: { done: true, processedCount: 12, totalCount: 12 } });
    const onProgress = vi.fn();

    await deleteCampaign("job-1", onProgress);

    expect(mockCallProcessCampaignDeletionChunk).toHaveBeenCalledTimes(2);
    expect(onProgress).toHaveBeenNthCalledWith(1, { processedCount: 6, totalCount: 12 });
    expect(onProgress).toHaveBeenNthCalledWith(2, { processedCount: 12, totalCount: 12 });
  });

  it("propagates failures from the chunk Function", async () => {
    const error = new Error("delete failed");
    mockCallProcessCampaignDeletionChunk.mockRejectedValueOnce(error);

    await expect(deleteCampaign("job-1")).rejects.toBe(error);
  });

  it("reuses one in-flight drive for a duplicate call with the same jobId", async () => {
    let finish!: (value: unknown) => void;
    const pending = new Promise((resolve) => {
      finish = resolve;
    });
    mockCallProcessCampaignDeletionChunk.mockReturnValueOnce(pending);

    const first = deleteCampaign("job-1");
    const duplicate = deleteCampaign("job-1");
    await Promise.resolve();

    expect(mockCallProcessCampaignDeletionChunk).toHaveBeenCalledOnce();
    finish({ data: { done: true, processedCount: 12, totalCount: 12 } });
    await Promise.all([first, duplicate]);
  });
});

describe("createCampaign — GM and Inquisitor name", () => {
  it("stores gmName and inquisitorName when both are provided", async () => {
    await createCampaign("The Lathe Run", "dm-1", "Cain", "Inquisitor Vail");

    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ gmName: "Cain", inquisitorName: "Inquisitor Vail" })
    );
  });

  it("omits gmName and inquisitorName from the write when neither is provided", async () => {
    await createCampaign("The Lathe Run", "dm-1");

    const written = mockSetDoc.mock.calls[0][1];
    expect(written).not.toHaveProperty("gmName");
    expect(written).not.toHaveProperty("inquisitorName");
  });

  it("rejects an Inquisitor name over 100 characters before writing", async () => {
    await expect(createCampaign("The Lathe Run", "dm-1", "Cain", "x".repeat(101))).rejects.toThrow(
      "Inquisitor name cannot be more than 100 characters"
    );
    expect(mockSetDoc).not.toHaveBeenCalled();
  });
});

describe("updateCampaignDetails", () => {
  it("updates the campaign name and Inquisitor name together", async () => {
    await updateCampaignDetails("camp-1", "New Name", "Inquisitor Vail");

    expect(mockUpdateDoc).toHaveBeenCalledWith("campaigns/camp-1", {
      name: "New Name",
      inquisitorName: "Inquisitor Vail",
    });
  });

  it("clears the Inquisitor name by deleting the field when saved blank", async () => {
    await updateCampaignDetails("camp-1", "New Name", "");

    expect(mockUpdateDoc).toHaveBeenCalledWith("campaigns/camp-1", {
      name: "New Name",
      inquisitorName: "delete-field-sentinel",
    });
  });

  it("rejects an Inquisitor name over 100 characters before writing", async () => {
    await expect(updateCampaignDetails("camp-1", "New Name", "x".repeat(101))).rejects.toThrow(
      "Inquisitor name cannot be more than 100 characters"
    );
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });
});

describe("syncGmNameAcrossCampaigns", () => {
  it("updates gmName across every campaign the caller DMs", async () => {
    mockGetDocs.mockResolvedValue({
      empty: false,
      docs: [{ ref: "campaign-1-ref" }, { ref: "campaign-2-ref" }],
    });

    await syncGmNameAcrossCampaigns("dm-1", "  Cain  ");

    expect(mockWhere).toHaveBeenCalledWith("dmId", "==", "dm-1");
    expect(mockLimit).toHaveBeenCalledWith(100);
    expect(mockBatchUpdate).toHaveBeenNthCalledWith(1, "campaign-1-ref", { gmName: "Cain" });
    expect(mockBatchUpdate).toHaveBeenNthCalledWith(2, "campaign-2-ref", { gmName: "Cain" });
    expect(mockBatchCommit).toHaveBeenCalledOnce();
  });

  it("does nothing when the caller DMs no campaigns", async () => {
    mockGetDocs.mockResolvedValue({ empty: true, docs: [] });

    await syncGmNameAcrossCampaigns("dm-1", "Cain");

    expect(mockBatchCommit).not.toHaveBeenCalled();
  });

  it("skips the query entirely for a blank name", async () => {
    await syncGmNameAcrossCampaigns("dm-1", "   ");

    expect(mockGetDocs).not.toHaveBeenCalled();
  });
});
