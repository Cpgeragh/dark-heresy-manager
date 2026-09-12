// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockDoc,
  mockGetDoc,
  mockSetDoc,
  mockUpdateDoc,
  callComplete,
  callDiscard,
  callDelete,
  mockSignOut,
} = vi.hoisted(() => ({
  mockDoc: vi.fn(() => "user-ref"),
  mockGetDoc: vi.fn(),
  mockSetDoc: vi.fn(),
  mockUpdateDoc: vi.fn(),
  callComplete: vi.fn(),
  callDiscard: vi.fn(),
  callDelete: vi.fn(),
  mockSignOut: vi.fn(),
}));

vi.mock("firebase/auth", () => ({ signOut: (...args: unknown[]) => mockSignOut(...args) }));
vi.mock("firebase/firestore", () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  serverTimestamp: () => "server-time",
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
}));
vi.mock("firebase/functions", () => ({
  httpsCallable: vi.fn((_functions: unknown, name: string) => {
    if (name === "completeOnboarding") return callComplete;
    if (name === "discardOnboardingSetup") return callDiscard;
    if (name === "deleteAccount") return callDelete;
    throw new Error(`Unexpected callable: ${name}`);
  }),
}));
vi.mock("../../src/firebase", () => ({ auth: "auth", db: "db", functions: "functions" }));

import {
  completeOnboarding,
  deleteCurrentAccount,
  discardOnboardingSetup,
  markRecoveryCodeBackedUp,
  needsRecoveryCodeBackup,
  synchroniseUserAccount,
} from "../../src/services/userAccountService";

beforeEach(() => {
  vi.clearAllMocks();
  callComplete.mockResolvedValue({ data: undefined });
  callDiscard.mockResolvedValue({ data: undefined });
  callDelete.mockResolvedValue({ data: { releasedCharacters: 0, removedLinkedDevices: 1 } });
  mockSignOut.mockResolvedValue(undefined);
  Object.defineProperty(window, "location", { configurable: true, value: { reload: vi.fn() } });
});

describe("user account service", () => {
  it("creates a missing local device record", async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });
    await expect(synchroniseUserAccount("device-1")).resolves.toBe(false);
    expect(mockSetDoc).toHaveBeenCalledWith("user-ref", {
      createdAt: "server-time",
      onboarded: false,
    });
  });

  it("reads and updates recovery-backup state", async () => {
    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({ recoveryBackedUp: false }) });
    await expect(needsRecoveryCodeBackup("device-1")).resolves.toBe(true);
    await markRecoveryCodeBackedUp("device-1");
    expect(mockUpdateDoc).toHaveBeenCalledWith("user-ref", { recoveryBackedUp: true });
  });

  it("completes onboarding through the protected server operation", async () => {
    await completeOnboarding();
    expect(callComplete).toHaveBeenCalledWith({});
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it("discards only through the protected server operation", async () => {
    await discardOnboardingSetup();
    expect(callDiscard).toHaveBeenCalledWith({});
  });

  it("deletes server data before clearing the local session", async () => {
    await deleteCurrentAccount();
    expect(callDelete).toHaveBeenCalledWith({});
    expect(mockSignOut).toHaveBeenCalledWith("auth");
    expect(window.location.reload).toHaveBeenCalledOnce();
  });
});
