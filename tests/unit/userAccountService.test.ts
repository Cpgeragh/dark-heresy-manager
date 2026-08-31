import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockDoc,
  mockGetDoc,
  mockServerTimestamp,
  mockSetDoc,
  mockUpdateDoc,
  mockCallDeleteAccount,
  mockSignOut,
} = vi.hoisted(() => ({
  mockDoc: vi.fn((..._args: unknown[]) => "user-ref"),
  mockGetDoc: vi.fn(),
  mockServerTimestamp: vi.fn(() => "server-time"),
  mockSetDoc: vi.fn().mockResolvedValue(undefined),
  mockUpdateDoc: vi.fn().mockResolvedValue(undefined),
  mockCallDeleteAccount: vi.fn(),
  mockSignOut: vi.fn(),
}));

vi.mock("firebase/auth", () => ({
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

vi.mock("firebase/firestore", () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  serverTimestamp: () => mockServerTimestamp(),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
}));

vi.mock("firebase/functions", () => ({
  httpsCallable: vi.fn((_functions: unknown, name: string) => {
    if (name === "deleteAccount") return mockCallDeleteAccount;
    throw new Error(`Unexpected callable: ${name}`);
  }),
}));

vi.mock("../../src/firebase", () => ({
  auth: "mock-auth",
  db: "mock-db",
  functions: "mock-functions",
}));

import {
  completeOnboarding,
  markRecoveryCodeBackedUp,
  needsRecoveryCodeBackup,
  synchroniseUserAccount,
  deleteCurrentAccount,
} from "../../src/services/userAccountService";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("user account recovery state", () => {
  it.each([
    [synchroniseUserAccount, ""],
    [needsRecoveryCodeBackup, "bad/id"],
    [markRecoveryCodeBackedUp, ".."],
    [completeOnboarding, "bad\nuid"],
  ])("rejects an invalid user ID before contacting Firestore", async (operation, uid) => {
    await expect(operation(uid)).rejects.toThrow("User ID is invalid");
    expect(mockDoc).not.toHaveBeenCalled();
    expect(mockGetDoc).not.toHaveBeenCalled();
    expect(mockSetDoc).not.toHaveBeenCalled();
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it("creates a missing user account and reports onboarding as incomplete", async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });

    await expect(synchroniseUserAccount("user-new")).resolves.toBe(false);
    expect(mockSetDoc).toHaveBeenCalledWith("user-ref", {
      createdAt: "server-time",
      onboarded: false,
    });
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it.each([
    [{ onboarded: false }, false],
    [{ onboarded: true }, true],
    [{}, true],
  ])("reports the stored onboarding state for an existing account", async (data, expected) => {
    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => data });

    await expect(synchroniseUserAccount("user-existing")).resolves.toBe(expected);
    expect(mockSetDoc).not.toHaveBeenCalled();
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it("does not request backup when the user document is missing", async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });

    await expect(needsRecoveryCodeBackup("user-1")).resolves.toBe(false);
    expect(mockDoc).toHaveBeenCalledWith("mock-db", "users", "user-1");
  });

  it.each([
    [{ recoveryBackedUp: true }, false],
    [{ recoveryBackedUp: false }, true],
    [{}, true],
  ])("maps the stored backup flag to prompt visibility", async (data, expected) => {
    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => data });

    await expect(needsRecoveryCodeBackup("user-2")).resolves.toBe(expected);
  });

  it("marks the recovery code as backed up", async () => {
    await markRecoveryCodeBackedUp("user-3");

    expect(mockDoc).toHaveBeenCalledWith("mock-db", "users", "user-3");
    expect(mockUpdateDoc).toHaveBeenCalledWith("user-ref", {
      recoveryBackedUp: true,
    });
  });

  it("completes onboarding and records recovery backup together", async () => {
    await completeOnboarding("user-4");

    expect(mockDoc).toHaveBeenCalledWith("mock-db", "users", "user-4");
    expect(mockUpdateDoc).toHaveBeenCalledWith("user-ref", {
      onboarded: true,
      recoveryBackedUp: true,
    });
  });

  it("preserves Firestore failures for the caller to handle", async () => {
    const error = new Error("write failed");
    mockUpdateDoc.mockRejectedValueOnce(error);

    await expect(markRecoveryCodeBackedUp("user-5")).rejects.toBe(error);
  });
});

describe("deleteCurrentAccount", () => {
  it("deletes server-side data before signing out the deleted local session", async () => {
    const order: string[] = [];
    mockCallDeleteAccount.mockImplementation(async () => {
      order.push("server");
      return { data: { releasedCharacters: 1, removedLinkedDevices: 2 } };
    });
    mockSignOut.mockImplementation(async () => {
      order.push("sign-out");
    });

    await deleteCurrentAccount();

    expect(mockCallDeleteAccount).toHaveBeenCalledWith({});
    expect(mockSignOut).toHaveBeenCalledWith("mock-auth");
    expect(order).toEqual(["server", "sign-out"]);
  });

  it("does not sign out when server-side deletion fails", async () => {
    const error = new Error("Delete owned campaigns first.");
    mockCallDeleteAccount.mockRejectedValue(error);

    await expect(deleteCurrentAccount()).rejects.toBe(error);
    expect(mockSignOut).not.toHaveBeenCalled();
  });
});
