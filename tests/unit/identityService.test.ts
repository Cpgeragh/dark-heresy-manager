// tests/unit/identityService.test.ts
//
// Tests for clearIdentityRecovery, reclaimIdentity, getRecoveryCode, and
// rotateRecoveryCode. Firebase and the registerIdentityCode/
// startIdentityReclaimJob/processIdentityReclaimChunk Functions are fully
// mocked — no emulator needed.

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockBatchSet = vi.fn();
const mockBatchDelete = vi.fn();
const mockBatchCommit = vi.fn().mockResolvedValue(undefined);
const mockBatchUpdate = vi.fn();

const mockBatch = {
  set: mockBatchSet,
  delete: mockBatchDelete,
  commit: mockBatchCommit,
  update: mockBatchUpdate,
};

const {
  mockWriteBatch,
  mockDoc,
  mockGetDoc,
  mockCallRegisterIdentityCode,
  mockCallStartIdentityReclaimJob,
  mockCallProcessIdentityReclaimChunk,
} = vi.hoisted(() => ({
  mockWriteBatch: vi.fn(),
  mockDoc: vi.fn((...args: unknown[]) => `${args[1]}/${args[2]}`),
  mockGetDoc: vi.fn(),
  mockCallRegisterIdentityCode: vi.fn(),
  mockCallStartIdentityReclaimJob: vi.fn(),
  mockCallProcessIdentityReclaimChunk: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  writeBatch: (...args: unknown[]) => mockWriteBatch(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
}));

vi.mock("firebase/functions", () => ({
  httpsCallable: vi.fn((_functions: unknown, name: string) => {
    if (name === "registerIdentityCode") return mockCallRegisterIdentityCode;
    if (name === "startIdentityReclaimJob") return mockCallStartIdentityReclaimJob;
    if (name === "processIdentityReclaimChunk") return mockCallProcessIdentityReclaimChunk;
    throw new Error(`Unexpected callable: ${name}`);
  }),
}));

vi.mock("../../src/firebase", () => ({
  db: "mock-db",
  functions: "mock-functions",
}));

import {
  clearIdentityRecovery,
  reclaimIdentity,
  getRecoveryCode,
  rotateRecoveryCode,
} from "../../src/services/identityService";

// ── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockWriteBatch.mockReturnValue(mockBatch);
});

// ── clearIdentityRecovery ─────────────────────────────────────────────────

describe("clearIdentityRecovery", () => {
  it("deletes the identityRecovery entry by code", async () => {
    await clearIdentityRecovery("uid-1", "DH-CODE-CLER");

    expect(mockBatchDelete).toHaveBeenCalledWith("identityRecovery/DH-CODE-CLER");
  });

  it("deletes the identitySecret entry by uid", async () => {
    await clearIdentityRecovery("uid-1", "DH-CODE-CLER");

    expect(mockBatchDelete).toHaveBeenCalledWith("identitySecret/uid-1");
  });

  it("commits the batch exactly once", async () => {
    await clearIdentityRecovery("uid-1", "DH-CODE-CLER");

    expect(mockBatchCommit).toHaveBeenCalledOnce();
  });
});

// ── reclaimIdentity ───────────────────────────────────────────────────────

describe("reclaimIdentity", () => {
  beforeEach(() => {
    mockCallStartIdentityReclaimJob.mockResolvedValue({
      data: { jobId: "job-1", totalCount: 0, role: "player" },
    });
    mockCallProcessIdentityReclaimChunk.mockResolvedValue({
      data: { done: true, processedCount: 0, totalCount: 0 },
    });
  });

  it("rejects a malformed recovery code before calling the Function", async () => {
    await expect(reclaimIdentity("not-a-code")).rejects.toThrow("DH-XXXX-YYYY");
    expect(mockCallStartIdentityReclaimJob).not.toHaveBeenCalled();
  });

  it("starts the job with the trimmed code", async () => {
    await reclaimIdentity("  DH-C0DE-0001  ");

    expect(mockCallStartIdentityReclaimJob).toHaveBeenCalledWith({ code: "DH-C0DE-0001" });
  });

  it("drives chunks to completion and returns the reclaimed role", async () => {
    mockCallStartIdentityReclaimJob.mockResolvedValue({
      data: { jobId: "job-1", totalCount: 2, role: "dm" },
    });
    mockCallProcessIdentityReclaimChunk
      .mockResolvedValueOnce({ data: { done: false, processedCount: 1, totalCount: 2 } })
      .mockResolvedValueOnce({ data: { done: true, processedCount: 2, totalCount: 2 } });

    const role = await reclaimIdentity("DH-C0DE-0001");

    expect(role).toBe("dm");
    expect(mockCallProcessIdentityReclaimChunk).toHaveBeenCalledTimes(2);
    expect(mockCallProcessIdentityReclaimChunk).toHaveBeenCalledWith({ jobId: "job-1" });
  });

  it("reports progress after the job starts and after each chunk", async () => {
    mockCallStartIdentityReclaimJob.mockResolvedValue({
      data: { jobId: "job-1", totalCount: 2, role: "player" },
    });
    mockCallProcessIdentityReclaimChunk.mockResolvedValue({
      data: { done: true, processedCount: 2, totalCount: 2 },
    });
    const onProgress = vi.fn();

    await reclaimIdentity("DH-C0DE-0001", onProgress);

    expect(onProgress).toHaveBeenNthCalledWith(1, { processedCount: 0, totalCount: 2 });
    expect(onProgress).toHaveBeenNthCalledWith(2, { processedCount: 2, totalCount: 2 });
  });

  it("propagates a rejection when starting the job fails", async () => {
    const error = new Error("Recovery code not found.");
    mockCallStartIdentityReclaimJob.mockRejectedValue(error);

    await expect(reclaimIdentity("DH-BADD-C0DE")).rejects.toBe(error);
    expect(mockCallProcessIdentityReclaimChunk).not.toHaveBeenCalled();
  });

  it("reuses one in-flight reclaim for a duplicate call with the same code", async () => {
    let finishStart!: (value: unknown) => void;
    const pendingStart = new Promise((resolve) => {
      finishStart = resolve;
    });
    mockCallStartIdentityReclaimJob.mockReturnValueOnce(pendingStart);

    const first = reclaimIdentity("DH-DUPE-CODE");
    const duplicate = reclaimIdentity("DH-DUPE-CODE");
    await Promise.resolve();

    expect(mockCallStartIdentityReclaimJob).toHaveBeenCalledOnce();
    finishStart({ data: { jobId: "job-1", totalCount: 0, role: "player" } });
    await expect(Promise.all([first, duplicate])).resolves.toEqual(["player", "player"]);
  });
});

// ── getRecoveryCode ───────────────────────────────────────────────────────

describe("getRecoveryCode", () => {
  it("returns the code when identitySecret document exists", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ code: "DH-MY00-CODE" }),
    });

    const result = await getRecoveryCode("uid-1");

    expect(result).toBe("DH-MY00-CODE");
    expect(mockDoc).toHaveBeenCalledWith("mock-db", "identitySecret", "uid-1");
  });

  it("returns null when no identitySecret document exists", async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false, data: () => null });

    const result = await getRecoveryCode("uid-1");

    expect(result).toBeNull();
  });
});

// ── rotateRecoveryCode ────────────────────────────────────────────────────

describe("rotateRecoveryCode", () => {
  it("calls registerIdentityCode with the uid as targetUid and the given role", async () => {
    mockCallRegisterIdentityCode.mockResolvedValue({ data: { code: "DH-GENE-CODE" } });

    const result = await rotateRecoveryCode("uid-1", "dm");

    expect(mockCallRegisterIdentityCode).toHaveBeenCalledWith({ role: "dm", targetUid: "uid-1" });
    expect(result).toBe("DH-GENE-CODE");
  });

  it("defaults to the player role when none is given", async () => {
    mockCallRegisterIdentityCode.mockResolvedValue({ data: { code: "DH-GENE-CODE" } });

    await rotateRecoveryCode("uid-1");

    expect(mockCallRegisterIdentityCode).toHaveBeenCalledWith({
      role: "player",
      targetUid: "uid-1",
    });
  });

  it("generates only one code for a duplicate in-flight rotation", async () => {
    let finish!: (value: unknown) => void;
    const pending = new Promise((resolve) => {
      finish = resolve;
    });
    mockCallRegisterIdentityCode.mockReturnValueOnce(pending);

    const first = rotateRecoveryCode("uid-duplicate", "dm");
    const duplicate = rotateRecoveryCode("uid-duplicate", "dm");
    await Promise.resolve();

    expect(mockCallRegisterIdentityCode).toHaveBeenCalledOnce();
    finish({ data: { code: "DH-GENE-CODE" } });
    await expect(Promise.all([first, duplicate])).resolves.toEqual([
      "DH-GENE-CODE",
      "DH-GENE-CODE",
    ]);
  });

  it("rejects an invalid role before calling the Function", async () => {
    // @ts-expect-error testing runtime guard against an invalid role
    await expect(rotateRecoveryCode("uid-1", "invalid")).rejects.toThrow(
      "Recovery role is invalid."
    );
    expect(mockCallRegisterIdentityCode).not.toHaveBeenCalled();
  });
});
