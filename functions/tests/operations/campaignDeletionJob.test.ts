// functions/tests/operations/campaignDeletionJob.test.ts
//
// bulkJobs.ts already has its own unit tests for lease/checkpoint behaviour,
// so it's mocked directly here, same reasoning as characterDeletionJob.test.ts.
// The preflight test builds its own lightweight character-doc mocks separate
// from the process-phase mocks below, since preflight only needs .count() on
// each character's subcollections, not paginated .get() traversal.
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  startCampaignDeletionJob,
  processCampaignDeletionChunk,
} from "../../src/operations/campaignDeletionJob";
import { hashRecoveryCode } from "../../src/shared/recoveryCode";
import type { BulkJobRecord } from "../../src/shared/bulkJobs";

const {
  mockCreateBulkJob,
  mockAcquireJobLease,
  mockAdvanceJobCheckpoint,
  mockCompleteJob,
  mockFailJob,
  mockHandleChunkFailure,
  mockCollection,
  mockBatch,
  mockBatchDelete,
  mockBatchCommit,
  mockCampaignGet,
  mockCampaignDelete,
  characters,
  threads,
  customItems,
  sessions,
  claimLogChild,
  xpProposalsChild,
  messagesChild,
  versionsChild,
  mockRecoveryDoc,
  mockRecoveryGetImpl,
  mockRecoveryDelete,
} = vi.hoisted(() => {
  function makeCollectionMock() {
    const countGet = vi.fn();
    const pageGet = vi.fn();
    const docMock = vi.fn();
    const self: Record<string, unknown> = {};
    self.orderBy = vi.fn(() => self);
    self.startAfter = vi.fn(() => self);
    self.limit = vi.fn(() => self);
    self.get = pageGet;
    self.count = vi.fn(() => ({ get: countGet }));
    self.doc = docMock;
    self.firestore = { batch: () => mockBatchObj };
    return { ref: self, countGet, pageGet, docMock };
  }

  const mockBatchDelete = vi.fn();
  const mockBatchCommit = vi.fn();
  const mockBatchObj = { delete: mockBatchDelete, commit: mockBatchCommit };
  const mockBatch = vi.fn(() => mockBatchObj);

  const claimLogChild = makeCollectionMock();
  const xpProposalsChild = makeCollectionMock();
  const messagesChild = makeCollectionMock();
  const versionsChild = makeCollectionMock();

  const characters = makeCollectionMock();
  (characters.docMock as ReturnType<typeof vi.fn>).mockImplementation(() => ({
    collection: (name: string) => {
      if (name === "claimLog") return claimLogChild.ref;
      if (name === "xpProposals") return xpProposalsChild.ref;
      throw new Error(`Unexpected character subcollection: ${name}`);
    },
  }));

  const threads = makeCollectionMock();
  (threads.docMock as ReturnType<typeof vi.fn>).mockImplementation(() => ({
    collection: (name: string) => {
      if (name === "messages") return messagesChild.ref;
      throw new Error(`Unexpected thread subcollection: ${name}`);
    },
  }));

  const customItems = makeCollectionMock();
  (customItems.docMock as ReturnType<typeof vi.fn>).mockImplementation(() => ({
    collection: (name: string) => {
      if (name === "versions") return versionsChild.ref;
      throw new Error(`Unexpected custom item subcollection: ${name}`);
    },
  }));

  const sessions = makeCollectionMock();

  const mockCampaignGet = vi.fn();
  const mockCampaignDelete = vi.fn();
  const mockCampaignRef = {
    get: mockCampaignGet,
    delete: mockCampaignDelete,
    collection: vi.fn((name: string) => {
      if (name === "characters") return characters.ref;
      if (name === "threads") return threads.ref;
      if (name === "customItems") return customItems.ref;
      if (name === "sessions") return sessions.ref;
      throw new Error(`Unexpected campaign subcollection: ${name}`);
    }),
  };

  const mockRecoveryGetImpl = vi.fn((_code: string) => Promise.resolve({ exists: true }));
  const mockRecoveryDelete = vi.fn();
  const mockRecoveryDoc = vi.fn((code: string) => ({
    get: () => mockRecoveryGetImpl(code),
    delete: mockRecoveryDelete,
  }));

  const mockCreateBulkJob = vi.fn();
  const mockAcquireJobLease = vi.fn();
  const mockAdvanceJobCheckpoint = vi.fn();
  const mockCompleteJob = vi.fn();
  const mockFailJob = vi.fn();
  const mockHandleChunkFailure = vi.fn();

  const mockCollection = vi.fn((name: string) => {
    if (name === "campaigns") return { doc: vi.fn(() => mockCampaignRef) };
    if (name === "recoveryIndex") return { doc: mockRecoveryDoc };
    throw new Error(`Unexpected collection: ${name}`);
  });

  return {
    mockCreateBulkJob,
    mockAcquireJobLease,
    mockAdvanceJobCheckpoint,
    mockCompleteJob,
    mockFailJob,
    mockHandleChunkFailure,
    mockCollection,
    mockBatch,
    mockBatchDelete,
    mockBatchCommit,
    mockCampaignGet,
    mockCampaignDelete,
    characters,
    threads,
    customItems,
    sessions,
    claimLogChild,
    xpProposalsChild,
    messagesChild,
    versionsChild,
    mockRecoveryDoc,
    mockRecoveryGetImpl,
    mockRecoveryDelete,
  };
});

vi.mock("../../src/shared/bulkJobs", () => ({
  createBulkJob: mockCreateBulkJob,
  acquireJobLease: mockAcquireJobLease,
  advanceJobCheckpoint: mockAdvanceJobCheckpoint,
  completeJob: mockCompleteJob,
  failJob: mockFailJob,
  handleChunkFailure: mockHandleChunkFailure,
  MAX_JOB_TOTAL_COUNT: 10_000,
}));

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({ collection: mockCollection, batch: mockBatch }),
  FieldPath: { documentId: () => "__name__" },
}));

const CAMPAIGN_ID = "campaign-1";
const DM_UID = "dm-uid";

function makeJob(overrides: Partial<BulkJobRecord> = {}): BulkJobRecord {
  return {
    type: "campaign-deletion",
    status: "running",
    actorUid: DM_UID,
    data: { campaignId: CAMPAIGN_ID },
    totalCount: 10,
    processedCount: 0,
    checkpoint: null,
    leaseOwner: "lease-1",
    leaseExpiresAt: Date.now() + 60_000,
    error: null,
    idempotencyKey: null,
    retryCount: 0,
    lastError: null,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

function makeCharacterDoc(id: string, recoveryCode: string, claimLogCount: number, xpCount: number) {
  return {
    id,
    ref: {
      collection: (name: string) => {
        if (name === "claimLog") return { count: () => ({ get: () => Promise.resolve({ data: () => ({ count: claimLogCount }) }) }) };
        if (name === "xpProposals") return { count: () => ({ get: () => Promise.resolve({ data: () => ({ count: xpCount }) }) }) };
        throw new Error(`Unexpected: ${name}`);
      },
    },
    data: () => ({ recoveryCode }),
  };
}

describe("startCampaignDeletionJob", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects when the campaign does not exist", async () => {
    mockCampaignGet.mockResolvedValue({ exists: false });

    await expect(startCampaignDeletionJob({ campaignId: CAMPAIGN_ID }, DM_UID, "idem-key", "secret")).rejects.toThrow(
      expect.objectContaining({ code: "not-found" })
    );
  });

  it("rejects when the caller is not the campaign DM", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "someone-else" }) });

    await expect(startCampaignDeletionJob({ campaignId: CAMPAIGN_ID }, DM_UID, "idem-key", "secret")).rejects.toThrow(
      expect.objectContaining({ code: "permission-denied" })
    );
  });

  it("rejects when a character has no usable Recovery Code", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: DM_UID }) });
    characters.pageGet.mockResolvedValue({
      docs: [makeCharacterDoc("char-1", "not-a-code", 0, 0)],
    });

    await expect(startCampaignDeletionJob({ campaignId: CAMPAIGN_ID }, DM_UID, "idem-key", "secret")).rejects.toThrow(
      expect.objectContaining({ code: "failed-precondition" })
    );
  });

  it("computes the exact preflight total across every dependent collection", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: DM_UID }) });
    characters.pageGet.mockResolvedValue({
      docs: [
        makeCharacterDoc("char-1", "DH-AAAA-1111", 2, 1),
        makeCharacterDoc("char-2", "DH-BBBB-2222", 0, 0),
      ],
    });
    threads.pageGet.mockResolvedValue({
      docs: [{ ref: { collection: () => ({ count: () => ({ get: () => Promise.resolve({ data: () => ({ count: 5 }) }) }) }) } }],
    });
    customItems.pageGet.mockResolvedValue({
      docs: [{ ref: { collection: () => ({ count: () => ({ get: () => Promise.resolve({ data: () => ({ count: 3 }) }) }) }) } }],
    });
    sessions.countGet.mockResolvedValue({ data: () => ({ count: 4 }) });
    mockRecoveryGetImpl.mockImplementation((hash: string) =>
      Promise.resolve({ exists: hash === hashRecoveryCode("DH-AAAA-1111", "secret") })
    );
    mockCreateBulkJob.mockResolvedValue("job-1");

    const result = await startCampaignDeletionJob({ campaignId: CAMPAIGN_ID }, DM_UID, "idem-key", "secret");

    // 2 characters + (2+1 claimLog/xp for char-1) + (0+0 for char-2)
    // + 1 recoveryIndex entry (only char-1's exists) + 1 thread + 5 messages
    // + 1 customItem + 3 versions + 4 sessions + 1 campaign = 21
    expect(result).toEqual({ jobId: "job-1", totalCount: 21 });
    expect(mockCreateBulkJob).toHaveBeenCalledWith(
      "campaign-deletion",
      DM_UID,
      { campaignId: CAMPAIGN_ID },
      21,
      "idem-key"
    );
  });

  it("rejects starting a deletion job whose preflight total exceeds the size ceiling", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: DM_UID }) });
    characters.pageGet.mockResolvedValue({ docs: [] });
    threads.pageGet.mockResolvedValue({ docs: [] });
    customItems.pageGet.mockResolvedValue({ docs: [] });
    sessions.countGet.mockResolvedValue({ data: () => ({ count: 20_000 }) });

    await expect(
      startCampaignDeletionJob({ campaignId: CAMPAIGN_ID }, DM_UID, "idem-key", "secret")
    ).rejects.toThrow(expect.objectContaining({ code: "resource-exhausted" }));
    expect(mockCreateBulkJob).not.toHaveBeenCalled();
  });
});

describe("processCampaignDeletionChunk", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects when the job is not a campaign-deletion job, without touching Firestore", async () => {
    mockAcquireJobLease.mockResolvedValue({ job: makeJob({ type: "other-job" }), leaseId: "lease-1" });

    await expect(processCampaignDeletionChunk({ jobId: "job-1" }, DM_UID, "secret")).rejects.toThrow(
      expect.objectContaining({ code: "failed-precondition" })
    );
    expect(mockFailJob).not.toHaveBeenCalled();
    expect(mockCampaignGet).not.toHaveBeenCalled();
  });

  it("fails the job and rejects when the caller is no longer the campaign DM", async () => {
    mockAcquireJobLease.mockResolvedValue({ job: makeJob(), leaseId: "lease-1" });
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "someone-else" }) });

    await expect(processCampaignDeletionChunk({ jobId: "job-1" }, DM_UID, "secret")).rejects.toThrow(
      expect.objectContaining({ code: "permission-denied" })
    );
    expect(mockHandleChunkFailure).toHaveBeenCalledWith(
      "job-1",
      "lease-1",
      expect.anything(),
      expect.anything(),
      "Only the campaign DM can delete this campaign."
    );
  });

  it("fails the job with a safe message and rethrows on an unexpected error", async () => {
    mockAcquireJobLease.mockResolvedValue({ job: makeJob(), leaseId: "lease-1" });
    mockCampaignGet.mockRejectedValue(new Error("firestore is down"));

    await expect(processCampaignDeletionChunk({ jobId: "job-1" }, DM_UID, "secret")).rejects.toThrow(
      "firestore is down"
    );
    expect(mockHandleChunkFailure).toHaveBeenCalledWith(
      "job-1",
      "lease-1",
      expect.anything(),
      expect.anything(),
      "Unexpected error."
    );
  });

  it("returns an in-progress result instead of throwing when handleChunkFailure signals a retry", async () => {
    mockAcquireJobLease.mockResolvedValue({ job: makeJob({ processedCount: 3 }), leaseId: "lease-1" });
    mockCampaignGet.mockRejectedValue(new Error("transient"));
    mockHandleChunkFailure.mockResolvedValueOnce(true);

    const result = await processCampaignDeletionChunk({ jobId: "job-1" }, DM_UID, "secret");

    expect(result).toEqual({ done: false, processedCount: 3, totalCount: 10 });
  });

  it("picks the first character and stays on it when its claimLog page is full", async () => {
    mockAcquireJobLease.mockResolvedValue({ job: makeJob(), leaseId: "lease-1" });
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: DM_UID }) });
    characters.pageGet.mockResolvedValue({ empty: false, docs: [{ id: "char-1" }] });
    const docs = Array.from({ length: 400 }, (_, i) => ({ id: `c${i}`, ref: {} }));
    claimLogChild.pageGet.mockResolvedValue({ empty: false, docs });

    const result = await processCampaignDeletionChunk({ jobId: "job-1" }, DM_UID, "secret");

    expect(characters.docMock).toHaveBeenCalledWith("char-1");
    expect(mockBatchDelete).toHaveBeenCalledTimes(400);
    expect(mockAdvanceJobCheckpoint).toHaveBeenCalledWith(
      "job-1",
      "lease-1",
      JSON.stringify({ phase: "characterClaimLogs", parentCursor: "char-1", cursor: "c399" }),
      400
    );
    expect(result).toEqual({ done: false, processedCount: 400, totalCount: 10 });
  });

  it("moves to the next character when the current one's subcollection page is short", async () => {
    mockAcquireJobLease.mockResolvedValue({
      job: makeJob({
        checkpoint: JSON.stringify({ phase: "characterClaimLogs", parentCursor: "char-1", cursor: null }),
      }),
      leaseId: "lease-1",
    });
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: DM_UID }) });
    claimLogChild.pageGet.mockResolvedValue({
      empty: false,
      docs: [{ id: "c0", ref: {} }, { id: "c1", ref: {} }],
    });
    characters.pageGet.mockResolvedValue({ empty: false, docs: [{ id: "char-2" }] });

    const result = await processCampaignDeletionChunk({ jobId: "job-1" }, DM_UID, "secret");

    expect(mockAdvanceJobCheckpoint).toHaveBeenCalledWith(
      "job-1",
      "lease-1",
      JSON.stringify({ phase: "characterClaimLogs", parentCursor: "char-2", cursor: null }),
      2
    );
    expect(result.processedCount).toBe(2);
  });

  it("moves to the next phase when the last character's subcollection is exhausted", async () => {
    mockAcquireJobLease.mockResolvedValue({
      job: makeJob({
        checkpoint: JSON.stringify({ phase: "characterClaimLogs", parentCursor: "char-1", cursor: null }),
      }),
      leaseId: "lease-1",
    });
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: DM_UID }) });
    claimLogChild.pageGet.mockResolvedValue({ empty: true, docs: [] });
    characters.pageGet.mockResolvedValue({ empty: true, docs: [] });

    await processCampaignDeletionChunk({ jobId: "job-1" }, DM_UID, "secret");

    expect(mockBatchCommit).not.toHaveBeenCalled();
    expect(mockAdvanceJobCheckpoint).toHaveBeenCalledWith(
      "job-1",
      "lease-1",
      JSON.stringify({ phase: "characterXpProposals", parentCursor: null, cursor: null }),
      0
    );
  });

  it("completes the phase immediately when there are no characters at all", async () => {
    mockAcquireJobLease.mockResolvedValue({ job: makeJob(), leaseId: "lease-1" });
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: DM_UID }) });
    characters.pageGet.mockResolvedValue({ empty: true, docs: [] });

    const result = await processCampaignDeletionChunk({ jobId: "job-1" }, DM_UID, "secret");

    expect(result.processedCount).toBe(0);
    expect(mockAdvanceJobCheckpoint).toHaveBeenCalledWith(
      "job-1",
      "lease-1",
      JSON.stringify({ phase: "characterXpProposals", parentCursor: null, cursor: null }),
      0
    );
  });

  it("deletes only the recoveryIndex entries that actually exist for the page's characters", async () => {
    mockAcquireJobLease.mockResolvedValue({
      job: makeJob({
        checkpoint: JSON.stringify({ phase: "characterRecoveryIndex", parentCursor: null, cursor: null }),
      }),
      leaseId: "lease-1",
    });
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: DM_UID }) });
    characters.pageGet.mockResolvedValue({
      empty: false,
      docs: [
        { id: "char-1", data: () => ({ recoveryCode: "DH-AAAA-1111" }) },
        { id: "char-2", data: () => ({ recoveryCode: "DH-BBBB-2222" }) },
      ],
    });
    mockRecoveryGetImpl.mockImplementation((hash: string) =>
      Promise.resolve({ exists: hash === hashRecoveryCode("DH-AAAA-1111", "secret") })
    );

    const result = await processCampaignDeletionChunk({ jobId: "job-1" }, DM_UID, "secret");

    expect(mockRecoveryDoc).toHaveBeenCalledWith(hashRecoveryCode("DH-AAAA-1111", "secret"));
    expect(mockRecoveryDoc).toHaveBeenCalledWith(hashRecoveryCode("DH-BBBB-2222", "secret"));
    expect(mockBatchDelete).toHaveBeenCalledTimes(1);
    expect(result.processedCount).toBe(1);
  });

  it("deletes the campaign document and completes the job in the final phase", async () => {
    mockAcquireJobLease.mockResolvedValue({
      job: makeJob({ checkpoint: JSON.stringify({ phase: "campaign", parentCursor: null, cursor: null }) }),
      leaseId: "lease-1",
    });
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: DM_UID }) });

    const result = await processCampaignDeletionChunk({ jobId: "job-1" }, DM_UID, "secret");

    expect(mockCampaignDelete).toHaveBeenCalled();
    expect(mockCompleteJob).toHaveBeenCalledWith("job-1", "lease-1");
    expect(result).toEqual({ done: true, processedCount: 1, totalCount: 10 });
  });

  it("deletes a flat sessions page and moves to the next phase when short", async () => {
    mockAcquireJobLease.mockResolvedValue({
      job: makeJob({ checkpoint: JSON.stringify({ phase: "sessions", parentCursor: null, cursor: null }) }),
      leaseId: "lease-1",
    });
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: DM_UID }) });
    sessions.pageGet.mockResolvedValue({ empty: false, docs: [{ id: "s1", ref: {} }] });

    await processCampaignDeletionChunk({ jobId: "job-1" }, DM_UID, "secret");

    expect(mockAdvanceJobCheckpoint).toHaveBeenCalledWith(
      "job-1",
      "lease-1",
      JSON.stringify({ phase: "threadMessages", parentCursor: null, cursor: null }),
      1
    );
  });
});
