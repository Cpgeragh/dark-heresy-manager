// tests/unit/identityService.test.ts
//
// Tests for registerIdentityRecovery and clearIdentityRecovery.
// Firebase and generateRecoveryCode are fully mocked — no emulator needed.

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockBatchSet    = vi.fn();
const mockBatchDelete = vi.fn();
const mockBatchCommit = vi.fn().mockResolvedValue(undefined);

const mockBatch = {
  set:    mockBatchSet,
  delete: mockBatchDelete,
  commit: mockBatchCommit,
};

const { mockWriteBatch, mockDoc, mockGenerateRecoveryCode } = vi.hoisted(() => ({
  mockWriteBatch:           vi.fn(),
  mockDoc:                  vi.fn((_, col, id) => `${col}/${id}`),
  mockGenerateRecoveryCode: vi.fn(() => "DH-GENERATED-CODE"),
}));

vi.mock("firebase/firestore", () => ({
  writeBatch: (...args: unknown[]) => mockWriteBatch(...args),
  doc:        (...args: unknown[]) => mockDoc(...args),
}));

vi.mock("../../src/firebase", () => ({
  db: "mock-db",
}));

vi.mock("../../src/utils/recoveryCode", () => ({
  generateRecoveryCode: () => mockGenerateRecoveryCode(),
}));

import {
  registerIdentityRecovery,
  clearIdentityRecovery,
} from "../../src/services/identityService";

// ── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockWriteBatch.mockReturnValue(mockBatch);
});

// ── registerIdentityRecovery ───────────────────────────────────────────────

describe("registerIdentityRecovery", () => {

  it("writes identityRecovery entry with uid and role", async () => {
    await registerIdentityRecovery("uid-1", "dm");

    expect(mockBatchSet).toHaveBeenCalledWith(
      "identityRecovery/DH-GENERATED-CODE",
      { uid: "uid-1", role: "dm" }
    );
  });

  it("writes identitySecret entry with the generated code", async () => {
    await registerIdentityRecovery("uid-1", "dm");

    expect(mockBatchSet).toHaveBeenCalledWith(
      "identitySecret/uid-1",
      { code: "DH-GENERATED-CODE" }
    );
  });

  it("returns the generated code", async () => {
    const result = await registerIdentityRecovery("uid-1", "player");

    expect(result).toBe("DH-GENERATED-CODE");
  });

  it("deletes the old identityRecovery entry when existingCode is provided", async () => {
    await registerIdentityRecovery("uid-1", "dm", "DH-OLD-CODE");

    expect(mockBatchDelete).toHaveBeenCalledWith("identityRecovery/DH-OLD-CODE");
  });

  it("does not call delete when existingCode is not provided", async () => {
    await registerIdentityRecovery("uid-1", "dm");

    expect(mockBatchDelete).not.toHaveBeenCalled();
  });

  it("commits the batch exactly once", async () => {
    await registerIdentityRecovery("uid-1", "dm");

    expect(mockBatchCommit).toHaveBeenCalledOnce();
  });
});

// ── clearIdentityRecovery ─────────────────────────────────────────────────

describe("clearIdentityRecovery", () => {

  it("deletes the identityRecovery entry by code", async () => {
    await clearIdentityRecovery("uid-1", "DH-CODE-TO-CLEAR");

    expect(mockBatchDelete).toHaveBeenCalledWith(
      "identityRecovery/DH-CODE-TO-CLEAR"
    );
  });

  it("deletes the identitySecret entry by uid", async () => {
    await clearIdentityRecovery("uid-1", "DH-CODE-TO-CLEAR");

    expect(mockBatchDelete).toHaveBeenCalledWith("identitySecret/uid-1");
  });

  it("commits the batch exactly once", async () => {
    await clearIdentityRecovery("uid-1", "DH-CODE-TO-CLEAR");

    expect(mockBatchCommit).toHaveBeenCalledOnce();
  });
});
