// tests/unit/identityService.test.ts
//
// @vitest-environment jsdom
// Tests for reclaimIdentity, getRecoveryCode, and rotateRecoveryCode.
// Firebase and the registerIdentityCode/startIdentityReclaimJob/
// processIdentityReclaimChunk Functions are fully mocked — no emulator
// needed.

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────

const {
  mockDoc,
  mockGetDoc,
  mockCallRegisterIdentityCode,
  mockCallStartIdentityReclaimJob,
  mockCallProcessIdentityReclaimChunk,
  mockCallRevokeIdentityCode,
  mockCallGetIdentityRecoveryMode,
} = vi.hoisted(() => ({
  mockDoc: vi.fn((...args: unknown[]) => `${args[1]}/${args[2]}`),
  mockGetDoc: vi.fn(),
  mockCallRegisterIdentityCode: vi.fn(),
  mockCallStartIdentityReclaimJob: vi.fn(),
  mockCallProcessIdentityReclaimChunk: vi.fn(),
  mockCallRevokeIdentityCode: vi.fn(),
  mockCallGetIdentityRecoveryMode: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
}));

vi.mock("firebase/functions", () => ({
  httpsCallable: vi.fn((_functions: unknown, name: string) => {
    if (name === "registerIdentityCode") return mockCallRegisterIdentityCode;
    if (name === "startIdentityReclaimJob") return mockCallStartIdentityReclaimJob;
    if (name === "processIdentityReclaimChunk") return mockCallProcessIdentityReclaimChunk;
    if (name === "revokeIdentityCode") return mockCallRevokeIdentityCode;
    if (name === "getIdentityRecoveryMode") return mockCallGetIdentityRecoveryMode;
    throw new Error(`Unexpected callable: ${name}`);
  }),
}));

vi.mock("../../src/firebase", () => ({
  db: "mock-db",
  functions: "mock-functions",
}));

import {
  reclaimIdentity,
  getRecoveryCode,
  rotateRecoveryCode,
  revokeIdentityRecoveryCode,
  getIdentityRecoveryMode,
} from "../../src/services/identityService";

// ── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

// ── reclaimIdentity ───────────────────────────────────────────────────────

describe("reclaimIdentity", () => {
  beforeEach(() => {
    mockCallStartIdentityReclaimJob.mockResolvedValue({
      data: { jobId: "job-1", totalCount: 0, role: "player", profileTransferred: false },
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
      data: { jobId: "job-1", totalCount: 2, role: "dm", profileTransferred: true },
    });
    mockCallProcessIdentityReclaimChunk
      .mockResolvedValueOnce({ data: { done: false, processedCount: 1, totalCount: 2 } })
      .mockResolvedValueOnce({ data: { done: true, processedCount: 2, totalCount: 2 } });

    const result = await reclaimIdentity("DH-C0DE-0001");

    expect(result).toEqual({ role: "dm", profileTransferred: true });
    expect(mockCallProcessIdentityReclaimChunk).toHaveBeenCalledTimes(2);
    expect(mockCallProcessIdentityReclaimChunk).toHaveBeenCalledWith({ jobId: "job-1" });
  });

  it("reports progress after the job starts and after each chunk", async () => {
    mockCallStartIdentityReclaimJob.mockResolvedValue({
      data: { jobId: "job-1", totalCount: 2, role: "player", profileTransferred: false },
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
    finishStart({
      data: { jobId: "job-1", totalCount: 0, role: "player", profileTransferred: false },
    });
    await expect(Promise.all([first, duplicate])).resolves.toEqual([
      { role: "player", profileTransferred: false },
      { role: "player", profileTransferred: false },
    ]);
  });

  it("blocks the sixth valid reclaim attempt before calling Firebase", async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await reclaimIdentity(`DH-RCLM-000${attempt}`);
    }

    await expect(reclaimIdentity("DH-RCLM-0005")).rejects.toThrow(
      "Too many recovery-code attempts. Try again in 15 minutes."
    );
    expect(mockCallStartIdentityReclaimJob).toHaveBeenCalledTimes(5);
  });
});

describe("getIdentityRecoveryMode", () => {
  it("returns link when connected device records remain", async () => {
    mockCallGetIdentityRecoveryMode.mockResolvedValue({ data: { mode: "link" } });

    await expect(getIdentityRecoveryMode("  DH-C0DE-0001  ")).resolves.toBe("link");
    expect(mockCallGetIdentityRecoveryMode).toHaveBeenCalledWith({ code: "DH-C0DE-0001" });
  });

  it("returns reclaim when no connected device records remain", async () => {
    mockCallGetIdentityRecoveryMode.mockResolvedValue({ data: { mode: "reclaim" } });

    await expect(getIdentityRecoveryMode("DH-C0DE-0001")).resolves.toBe("reclaim");
  });

  it("rejects an unexpected server mode", async () => {
    mockCallGetIdentityRecoveryMode.mockResolvedValue({ data: { mode: "unknown" } });

    await expect(getIdentityRecoveryMode("DH-C0DE-0001")).rejects.toThrow(
      "Recovery mode is invalid."
    );
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

describe("revokeIdentityRecoveryCode", () => {
  it("calls the protected revoke Function with an empty payload", async () => {
    mockCallRevokeIdentityCode.mockResolvedValue({ data: undefined });

    await revokeIdentityRecoveryCode();

    expect(mockCallRevokeIdentityCode).toHaveBeenCalledWith({});
  });

  it("reuses one in-flight revocation", async () => {
    let finish!: (value: unknown) => void;
    mockCallRevokeIdentityCode.mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      })
    );

    const first = revokeIdentityRecoveryCode();
    const duplicate = revokeIdentityRecoveryCode();
    await Promise.resolve();

    expect(mockCallRevokeIdentityCode).toHaveBeenCalledOnce();
    finish({ data: undefined });
    await expect(Promise.all([first, duplicate])).resolves.toEqual([undefined, undefined]);
  });
});
