// functions/tests/operations/characterDeletionJob.test.ts
//
// bulkJobs.ts already has its own unit tests for lease/checkpoint behaviour,
// so it's mocked directly here rather than driven through a second layer of
// Firestore transaction mocking, unlike stateless shared helpers elsewhere
// in this test suite that run for real against a mocked transaction object.
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  startCharacterDeletionJob,
  processCharacterDeletionChunk,
} from "../../src/operations/characterDeletionJob";
import type { BulkJobRecord } from "../../src/shared/bulkJobs";

const {
  mockCreateBulkJob,
  mockAcquireJobLease,
  mockAdvanceJobCheckpoint,
  mockCompleteJob,
  mockFailJob,
  mockCollection,
  mockBatch,
  mockCampaignGet,
  mockCharacterGet,
  mockCharacterDelete,
  mockThreadGet,
  mockThreadDelete,
  mockRecoveryGet,
  mockRecoveryDelete,
  mockRecoveryDoc,
  mockBatchDelete,
  mockBatchCommit,
  claimLog,
  xpProposals,
  messages,
} = vi.hoisted(() => {
  function makeCollectionMock() {
    const countGet = vi.fn();
    const pageGet = vi.fn();
    const self: Record<string, unknown> = {};
    self.orderBy = vi.fn(() => self);
    self.startAfter = vi.fn(() => self);
    self.limit = vi.fn(() => self);
    self.get = pageGet;
    self.count = vi.fn(() => ({ get: countGet }));
    return { ref: self, countGet, pageGet };
  }

  const claimLog = makeCollectionMock();
  const xpProposals = makeCollectionMock();
  const messages = makeCollectionMock();

  const mockCampaignGet = vi.fn();
  const mockCharacterGet = vi.fn();
  const mockCharacterDelete = vi.fn();
  const mockThreadGet = vi.fn();
  const mockThreadDelete = vi.fn();
  const mockRecoveryGet = vi.fn();
  const mockRecoveryDelete = vi.fn();
  const mockRecoveryDoc = vi.fn(() => ({ get: mockRecoveryGet, delete: mockRecoveryDelete }));
  const mockBatchDelete = vi.fn();
  const mockBatchCommit = vi.fn();

  const mockCharacterRef = {
    get: mockCharacterGet,
    delete: mockCharacterDelete,
    collection: vi.fn((name: string) => {
      if (name === "claimLog") return claimLog.ref;
      if (name === "xpProposals") return xpProposals.ref;
      throw new Error(`Unexpected character subcollection: ${name}`);
    }),
  };
  const mockThreadRef = {
    get: mockThreadGet,
    delete: mockThreadDelete,
    collection: vi.fn((name: string) => {
      if (name === "messages") return messages.ref;
      throw new Error(`Unexpected thread subcollection: ${name}`);
    }),
  };
  const mockCampaignRef = {
    get: mockCampaignGet,
    collection: vi.fn((name: string) => {
      if (name === "characters") return { doc: vi.fn(() => mockCharacterRef) };
      if (name === "threads") return { doc: vi.fn(() => mockThreadRef) };
      throw new Error(`Unexpected campaign subcollection: ${name}`);
    }),
  };
  const mockCollection = vi.fn((name: string) => {
    if (name === "campaigns") return { doc: vi.fn(() => mockCampaignRef) };
    if (name === "recoveryIndex") return { doc: mockRecoveryDoc };
    throw new Error(`Unexpected collection: ${name}`);
  });
  const mockBatch = vi.fn(() => ({ delete: mockBatchDelete, commit: mockBatchCommit }));

  return {
    mockCreateBulkJob: vi.fn(),
    mockAcquireJobLease: vi.fn(),
    mockAdvanceJobCheckpoint: vi.fn(),
    mockCompleteJob: vi.fn(),
    mockFailJob: vi.fn(),
    mockCollection,
    mockBatch,
    mockCampaignGet,
    mockCharacterGet,
    mockCharacterDelete,
    mockThreadGet,
    mockThreadDelete,
    mockRecoveryGet,
    mockRecoveryDelete,
    mockRecoveryDoc,
    mockBatchDelete,
    mockBatchCommit,
    claimLog,
    xpProposals,
    messages,
  };
});

vi.mock("../../src/shared/bulkJobs", () => ({
  createBulkJob: mockCreateBulkJob,
  acquireJobLease: mockAcquireJobLease,
  advanceJobCheckpoint: mockAdvanceJobCheckpoint,
  completeJob: mockCompleteJob,
  failJob: mockFailJob,
}));

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({ collection: mockCollection, batch: mockBatch }),
  FieldPath: { documentId: () => "__name__" },
}));

const CAMPAIGN_ID = "campaign-1";
const CHARACTER_ID = "character-1";
const DM_UID = "dm-uid";
const RECOVERY_CODE = "DH-ABCD-1234";

function makeJob(overrides: Partial<BulkJobRecord> = {}): BulkJobRecord {
  return {
    type: "character-deletion",
    status: "running",
    actorUid: DM_UID,
    data: { campaignId: CAMPAIGN_ID, characterId: CHARACTER_ID, recoveryCode: RECOVERY_CODE },
    totalCount: 10,
    processedCount: 0,
    checkpoint: null,
    leaseOwner: "lease-1",
    leaseExpiresAt: Date.now() + 60_000,
    error: null,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

describe("startCharacterDeletionJob", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects when the campaign does not exist", async () => {
    mockCampaignGet.mockResolvedValue({ exists: false });

    await expect(
      startCharacterDeletionJob({ campaignId: CAMPAIGN_ID, characterId: CHARACTER_ID }, DM_UID, "idem-key")
    ).rejects.toThrow(expect.objectContaining({ code: "not-found" }));
  });

  it("rejects when the caller is not the campaign DM", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "someone-else" }) });

    await expect(
      startCharacterDeletionJob({ campaignId: CAMPAIGN_ID, characterId: CHARACTER_ID }, DM_UID, "idem-key")
    ).rejects.toThrow(expect.objectContaining({ code: "permission-denied" }));
  });

  it("rejects when the character does not exist", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: DM_UID }) });
    mockCharacterGet.mockResolvedValue({ exists: false });

    await expect(
      startCharacterDeletionJob({ campaignId: CAMPAIGN_ID, characterId: CHARACTER_ID }, DM_UID, "idem-key")
    ).rejects.toThrow(expect.objectContaining({ code: "not-found" }));
  });

  it("rejects when the character has no usable Recovery Code", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: DM_UID }) });
    mockCharacterGet.mockResolvedValue({ exists: true, data: () => ({}) });

    await expect(
      startCharacterDeletionJob({ campaignId: CAMPAIGN_ID, characterId: CHARACTER_ID }, DM_UID, "idem-key")
    ).rejects.toThrow(expect.objectContaining({ code: "failed-precondition" }));
  });

  it("creates a job with the exact preflight count across every dependent collection", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: DM_UID }) });
    mockCharacterGet.mockResolvedValue({ exists: true, data: () => ({ recoveryCode: RECOVERY_CODE }) });
    claimLog.countGet.mockResolvedValue({ data: () => ({ count: 3 }) });
    xpProposals.countGet.mockResolvedValue({ data: () => ({ count: 0 }) });
    messages.countGet.mockResolvedValue({ data: () => ({ count: 250 }) });
    mockThreadGet.mockResolvedValue({ exists: true });
    mockRecoveryGet.mockResolvedValue({ exists: true });
    mockCreateBulkJob.mockResolvedValue("job-1");

    const result = await startCharacterDeletionJob(
      { campaignId: CAMPAIGN_ID, characterId: CHARACTER_ID },
      DM_UID,
      "idem-key"
    );

    expect(result).toEqual({ jobId: "job-1", totalCount: 256 });
    expect(mockCreateBulkJob).toHaveBeenCalledWith(
      "character-deletion",
      DM_UID,
      { campaignId: CAMPAIGN_ID, characterId: CHARACTER_ID, recoveryCode: RECOVERY_CODE },
      256,
      "idem-key"
    );
  });
});

describe("processCharacterDeletionChunk", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects when the job is not a character-deletion job, without touching Firestore", async () => {
    mockAcquireJobLease.mockResolvedValue({ job: makeJob({ type: "other-job" }), leaseId: "lease-1" });

    await expect(processCharacterDeletionChunk({ jobId: "job-1" }, DM_UID)).rejects.toThrow(
      expect.objectContaining({ code: "failed-precondition" })
    );
    expect(mockFailJob).not.toHaveBeenCalled();
    expect(mockCampaignGet).not.toHaveBeenCalled();
  });

  it("fails the job and rejects when the caller is no longer the campaign DM", async () => {
    mockAcquireJobLease.mockResolvedValue({ job: makeJob(), leaseId: "lease-1" });
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "someone-else" }) });

    await expect(processCharacterDeletionChunk({ jobId: "job-1" }, DM_UID)).rejects.toThrow(
      expect.objectContaining({ code: "permission-denied" })
    );
    expect(mockFailJob).toHaveBeenCalledWith(
      "job-1",
      "lease-1",
      "Only the campaign DM can delete this character."
    );
  });

  it("deletes a full page and advances the checkpoint within the same phase when more remain", async () => {
    mockAcquireJobLease.mockResolvedValue({ job: makeJob(), leaseId: "lease-1" });
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: DM_UID }) });
    const docs = Array.from({ length: 400 }, (_, i) => ({ id: `c${i}`, ref: { id: `c${i}` } }));
    claimLog.pageGet.mockResolvedValue({ empty: false, docs });

    const result = await processCharacterDeletionChunk({ jobId: "job-1" }, DM_UID);

    expect(mockBatchDelete).toHaveBeenCalledTimes(400);
    expect(mockBatchCommit).toHaveBeenCalledTimes(1);
    expect(mockAdvanceJobCheckpoint).toHaveBeenCalledWith(
      "job-1",
      "lease-1",
      JSON.stringify({ phase: "claimLog", cursor: "c399" }),
      400
    );
    expect(result).toEqual({ done: false, processedCount: 400, totalCount: 10 });
  });

  it("moves to the next phase when a page comes back short of the chunk size", async () => {
    mockAcquireJobLease.mockResolvedValue({ job: makeJob(), leaseId: "lease-1" });
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: DM_UID }) });
    claimLog.pageGet.mockResolvedValue({
      empty: false,
      docs: [{ id: "c0", ref: {} }, { id: "c1", ref: {} }],
    });

    await processCharacterDeletionChunk({ jobId: "job-1" }, DM_UID);

    expect(mockAdvanceJobCheckpoint).toHaveBeenCalledWith(
      "job-1",
      "lease-1",
      JSON.stringify({ phase: "xpProposals", cursor: null }),
      2
    );
  });

  it("skips an already-empty phase without touching the batch", async () => {
    mockAcquireJobLease.mockResolvedValue({
      job: makeJob({ checkpoint: JSON.stringify({ phase: "xpProposals", cursor: null }) }),
      leaseId: "lease-1",
    });
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: DM_UID }) });
    xpProposals.pageGet.mockResolvedValue({ empty: true, docs: [] });

    const result = await processCharacterDeletionChunk({ jobId: "job-1" }, DM_UID);

    expect(mockBatchCommit).not.toHaveBeenCalled();
    expect(mockAdvanceJobCheckpoint).toHaveBeenCalledWith(
      "job-1",
      "lease-1",
      JSON.stringify({ phase: "messages", cursor: null }),
      0
    );
    expect(result.processedCount).toBe(0);
  });

  it("deletes the thread document when reaching the thread phase", async () => {
    mockAcquireJobLease.mockResolvedValue({
      job: makeJob({ checkpoint: JSON.stringify({ phase: "thread", cursor: null }) }),
      leaseId: "lease-1",
    });
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: DM_UID }) });
    mockThreadGet.mockResolvedValue({ exists: true });

    await processCharacterDeletionChunk({ jobId: "job-1" }, DM_UID);

    expect(mockThreadDelete).toHaveBeenCalled();
    expect(mockAdvanceJobCheckpoint).toHaveBeenCalledWith(
      "job-1",
      "lease-1",
      JSON.stringify({ phase: "recoveryIndex", cursor: null }),
      1
    );
  });

  it("skips deleting the thread when none exists", async () => {
    mockAcquireJobLease.mockResolvedValue({
      job: makeJob({ checkpoint: JSON.stringify({ phase: "thread", cursor: null }) }),
      leaseId: "lease-1",
    });
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: DM_UID }) });
    mockThreadGet.mockResolvedValue({ exists: false });

    await processCharacterDeletionChunk({ jobId: "job-1" }, DM_UID);

    expect(mockThreadDelete).not.toHaveBeenCalled();
  });

  it("deletes the recoveryIndex entry using the job's stored code", async () => {
    mockAcquireJobLease.mockResolvedValue({
      job: makeJob({ checkpoint: JSON.stringify({ phase: "recoveryIndex", cursor: null }) }),
      leaseId: "lease-1",
    });
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: DM_UID }) });
    mockRecoveryGet.mockResolvedValue({ exists: true });

    await processCharacterDeletionChunk({ jobId: "job-1" }, DM_UID);

    expect(mockRecoveryDoc).toHaveBeenCalledWith(RECOVERY_CODE);
    expect(mockRecoveryDelete).toHaveBeenCalled();
  });

  it("completes the job after deleting the character document in the final phase", async () => {
    mockAcquireJobLease.mockResolvedValue({
      job: makeJob({ checkpoint: JSON.stringify({ phase: "character", cursor: null }) }),
      leaseId: "lease-1",
    });
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: DM_UID }) });

    const result = await processCharacterDeletionChunk({ jobId: "job-1" }, DM_UID);

    expect(mockCharacterDelete).toHaveBeenCalled();
    expect(mockCompleteJob).toHaveBeenCalledWith("job-1", "lease-1");
    expect(mockAdvanceJobCheckpoint).not.toHaveBeenCalled();
    expect(result).toEqual({ done: true, processedCount: 1, totalCount: 10 });
  });

  it("fails the job with a safe message and rethrows on an unexpected error", async () => {
    mockAcquireJobLease.mockResolvedValue({ job: makeJob(), leaseId: "lease-1" });
    mockCampaignGet.mockRejectedValue(new Error("firestore is down"));

    await expect(processCharacterDeletionChunk({ jobId: "job-1" }, DM_UID)).rejects.toThrow(
      "firestore is down"
    );
    expect(mockFailJob).toHaveBeenCalledWith("job-1", "lease-1", "Unexpected error.");
  });
});
