// functions/tests/operations/linkDevice.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { linkDevice } from "../../src/operations/linkDevice";

const mockRecoveryGet = vi.fn();
const mockSecretGet = vi.fn();
const mockSet = vi.fn();

const mockCollection = vi.fn((name: string) => {
  if (name === "identityRecovery") return { doc: () => ({ get: mockRecoveryGet }) };
  if (name === "identitySecret") return { doc: () => ({ get: mockSecretGet }) };
  if (name === "userLinks") return { doc: () => ({ set: mockSet }) };
  throw new Error(`Unexpected collection: ${name}`);
});

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({ collection: mockCollection }),
  FieldValue: { serverTimestamp: () => "server-timestamp" },
}));

describe("linkDevice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSet.mockResolvedValue(undefined);
  });

  it("rejects when the code does not resolve", async () => {
    mockRecoveryGet.mockResolvedValue({ exists: false });

    await expect(linkDevice({ code: "DH-NOPE-0000" }, "device-uid")).rejects.toThrow(
      expect.objectContaining({ code: "not-found" })
    );
  });

  it("rejects linking a device to its own account", async () => {
    mockRecoveryGet.mockResolvedValue({ exists: true, data: () => ({ uid: "device-uid" }) });

    await expect(linkDevice({ code: "DH-SAME-0000" }, "device-uid")).rejects.toThrow(
      expect.objectContaining({ code: "failed-precondition" })
    );
  });

  it("rejects when the secret doesn't match the given code", async () => {
    mockRecoveryGet.mockResolvedValue({ exists: true, data: () => ({ uid: "primary-uid" }) });
    mockSecretGet.mockResolvedValue({ exists: true, data: () => ({ code: "DH-DIFF-0000" }) });

    await expect(linkDevice({ code: "DH-SAME-0000" }, "device-uid")).rejects.toThrow(
      expect.objectContaining({ code: "not-found" })
    );
  });

  it("writes the link record on success", async () => {
    mockRecoveryGet.mockResolvedValue({ exists: true, data: () => ({ uid: "primary-uid" }) });
    mockSecretGet.mockResolvedValue({ exists: true, data: () => ({ code: "DH-SAME-0000" }) });

    await linkDevice({ code: "DH-SAME-0000" }, "device-uid");

    expect(mockSet).toHaveBeenCalledWith({ primaryUid: "primary-uid", linkedAt: "server-timestamp" });
  });
});
