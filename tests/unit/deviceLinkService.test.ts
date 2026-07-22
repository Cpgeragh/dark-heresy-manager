import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockCollection,
  mockDeleteDoc,
  mockDoc,
  mockGetDoc,
  mockGetDocs,
  mockQuery,
  mockServerTimestamp,
  mockSetDoc,
  mockWhere,
} = vi.hoisted(() => ({
  mockCollection: vi.fn((..._args: unknown[]) => "links-collection"),
  mockDeleteDoc: vi.fn(),
  mockDoc: vi.fn((...args: unknown[]) => args.slice(1).join("/")),
  mockGetDoc: vi.fn(),
  mockGetDocs: vi.fn(),
  mockQuery: vi.fn((..._args: unknown[]) => "links-query"),
  mockServerTimestamp: vi.fn(() => "server-timestamp"),
  mockSetDoc: vi.fn(),
  mockWhere: vi.fn((..._args: unknown[]) => "primary-filter"),
}));

vi.mock("firebase/firestore", () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  serverTimestamp: () => mockServerTimestamp(),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  where: (...args: unknown[]) => mockWhere(...args),
}));

vi.mock("../../src/firebase", () => ({
  db: "mock-db",
}));

import { linkDeviceToAccount, unlinkDevice } from "../../src/services/deviceLinkService";

beforeEach(() => {
  vi.clearAllMocks();
  mockDeleteDoc.mockResolvedValue(undefined);
  mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({ uid: "primary-uid" }) });
  mockGetDocs.mockResolvedValue({ size: 0 });
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
    expect(mockGetDocs).not.toHaveBeenCalled();
  });

  it("enforces the three-device limit", async () => {
    mockGetDocs.mockResolvedValue({ size: 3 });

    await expect(linkDeviceToAccount("device-uid", "FULL-CODE")).rejects.toThrow(
      "This account already has 3 linked devices — the maximum allowed."
    );
    expect(mockSetDoc).not.toHaveBeenCalled();
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
