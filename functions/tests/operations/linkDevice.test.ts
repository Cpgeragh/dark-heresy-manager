// functions/tests/operations/linkDevice.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { linkDevice } from "../../src/operations/linkDevice";
import { hashRecoveryCode } from "../../src/shared/recoveryCode";

const mockIndexGet = vi.fn();
const mockIndexDoc = vi.fn(() => ({ get: mockIndexGet }));
const mockSet = vi.fn();

const mockCollection = vi.fn((name: string) => {
  if (name === "identityRecoveryIndex") return { doc: mockIndexDoc };
  if (name === "userLinks") return { doc: () => ({ set: mockSet }) };
  throw new Error(`Unexpected collection: ${name}`);
});

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({ collection: mockCollection }),
  FieldValue: { serverTimestamp: () => "server-timestamp" },
}));

const SECRET = "secret";
const CODE = "DH-SAME-0000";

describe("linkDevice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSet.mockResolvedValue(undefined);
  });

  it("rejects when the code does not resolve", async () => {
    mockIndexGet.mockResolvedValue({ exists: false });

    await expect(linkDevice({ code: "DH-NOPE-0000" }, "device-uid", SECRET)).rejects.toThrow(
      expect.objectContaining({ code: "not-found" })
    );
  });

  it("rejects linking a device to its own account", async () => {
    mockIndexGet.mockResolvedValue({ exists: true, data: () => ({ uid: "device-uid" }) });

    await expect(linkDevice({ code: CODE }, "device-uid", SECRET)).rejects.toThrow(
      expect.objectContaining({ code: "failed-precondition" })
    );
  });

  it("writes the link record on success", async () => {
    mockIndexGet.mockResolvedValue({ exists: true, data: () => ({ uid: "primary-uid" }) });

    await linkDevice({ code: CODE }, "device-uid", SECRET);

    expect(mockSet).toHaveBeenCalledWith({ primaryUid: "primary-uid", linkedAt: "server-timestamp" });
  });

  it("resolves the target by the code's HMAC hash, not the raw code", async () => {
    mockIndexGet.mockResolvedValue({ exists: false });

    await linkDevice({ code: CODE }, "device-uid", SECRET).catch(() => {});

    expect(mockIndexDoc).toHaveBeenCalledWith(hashRecoveryCode(CODE, SECRET));
  });
});
