import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockDeleteDoc,
  mockDoc,
  mockGetDoc,
  mockServerTimestamp,
  mockSetDoc,
} = vi.hoisted(() => ({
  mockDeleteDoc: vi.fn(),
  mockDoc: vi.fn((...args: unknown[]) => args.slice(1).join("/")),
  mockGetDoc: vi.fn(),
  mockServerTimestamp: vi.fn(() => "server-timestamp"),
  mockSetDoc: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  serverTimestamp: () => mockServerTimestamp(),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
}));

vi.mock("../../src/firebase", () => ({
  db: "mock-db",
}));

import { linkDeviceToAccount, unlinkDevice } from "../../src/services/deviceLinkService";

beforeEach(() => {
  vi.clearAllMocks();
  mockDeleteDoc.mockResolvedValue(undefined);
  mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({ uid: "primary-uid" }) });
  mockSetDoc.mockResolvedValue(undefined);
});

describe("device link operations", () => {
  it("rejects an unknown recovery code", async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });

    await expect(linkDeviceToAccount("device-uid", "UNKNOWN")).rejects.toThrow(
      "No account found with that recovery code."
    );
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it("rejects an attempt to link a device to itself", async () => {
    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({ uid: "device-uid" }) });

    await expect(linkDeviceToAccount("device-uid", "SELF-CODE")).rejects.toThrow(
      "This recovery code belongs to this device."
    );
  });

  it("creates the proof and link, then removes the proof", async () => {
    await linkDeviceToAccount("device-uid", "  VALID-CODE  ");

    expect(mockGetDoc).toHaveBeenCalledWith("identityRecovery/VALID-CODE");
    expect(mockSetDoc).toHaveBeenNthCalledWith(1, "linkProofs/device-uid", {
      primaryUid: "primary-uid",
      code: "VALID-CODE",
    });
    expect(mockSetDoc).toHaveBeenNthCalledWith(2, "userLinks/device-uid", {
      primaryUid: "primary-uid",
      linkedAt: "server-timestamp",
    });
    expect(mockDeleteDoc).toHaveBeenCalledWith("linkProofs/device-uid");
  });

  it("removes the proof when writing the link fails", async () => {
    const error = new Error("link write failed");
    mockSetDoc.mockResolvedValueOnce(undefined).mockRejectedValueOnce(error);

    await expect(linkDeviceToAccount("device-uid", "VALID-CODE")).rejects.toBe(error);
    expect(mockDeleteDoc).toHaveBeenCalledWith("linkProofs/device-uid");
  });

  it("unlinks the current device", async () => {
    await unlinkDevice("device-uid");

    expect(mockDeleteDoc).toHaveBeenCalledWith("userLinks/device-uid");
  });
});
