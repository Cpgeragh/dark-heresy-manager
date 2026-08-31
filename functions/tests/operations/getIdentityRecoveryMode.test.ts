import { beforeEach, describe, expect, it, vi } from "vitest";
import { getIdentityRecoveryMode } from "../../src/operations/getIdentityRecoveryMode";
import { hashRecoveryCode } from "../../src/shared/recoveryCode";

const { mockIndexGet, mockProfileGet, mockLinksGet, mockIndexDoc, mockCollection } = vi.hoisted(() => {
  const mockIndexGet = vi.fn();
  const mockProfileGet = vi.fn();
  const mockLinksGet = vi.fn();
  const mockIndexDoc = vi.fn((id: string) => ({ id, get: mockIndexGet }));
  const mockCollection = vi.fn((name: string) => {
    if (name === "identityRecoveryIndex") return { doc: mockIndexDoc };
    if (name === "userProfiles") return { doc: vi.fn(() => ({ get: mockProfileGet })) };
    if (name === "userLinks") {
      return {
        where: vi.fn(() => ({
          limit: vi.fn(() => ({ get: mockLinksGet })),
        })),
      };
    }
    throw new Error(`Unexpected collection: ${name}`);
  });
  return { mockIndexGet, mockProfileGet, mockLinksGet, mockIndexDoc, mockCollection };
});

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({ collection: mockCollection }),
}));

const SECRET = "secret";
const CODE = "DH-C0DE-0001";

beforeEach(() => {
  vi.clearAllMocks();
  mockIndexGet.mockResolvedValue({ exists: true, data: () => ({ uid: "primary-uid" }) });
  mockProfileGet.mockResolvedValue({
    exists: true,
    data: () => ({ firstName: "ExistingUser" }),
  });
  mockLinksGet.mockResolvedValue({ empty: false });
});

describe("getIdentityRecoveryMode", () => {
  it("selects link when a linked-device record remains", async () => {
    await expect(getIdentityRecoveryMode({ code: CODE }, "new-uid", SECRET)).resolves.toEqual({
      mode: "link",
    });
  });

  it("selects reclaim when no linked-device records remain", async () => {
    mockLinksGet.mockResolvedValue({ empty: true });

    await expect(getIdentityRecoveryMode({ code: CODE }, "new-uid", SECRET)).resolves.toEqual({
      mode: "reclaim",
    });
  });

  it("rejects an unknown recovery code", async () => {
    mockIndexGet.mockResolvedValue({ exists: false });

    await expect(getIdentityRecoveryMode({ code: CODE }, "new-uid", SECRET)).rejects.toThrow(
      expect.objectContaining({ code: "not-found" })
    );
  });

  it("rejects a recovery identity without a valid profile", async () => {
    mockProfileGet.mockResolvedValue({ exists: false });

    await expect(getIdentityRecoveryMode({ code: CODE }, "new-uid", SECRET)).rejects.toThrow(
      expect.objectContaining({ code: "failed-precondition" })
    );
  });

  it("looks up the HMAC hash rather than the raw code", async () => {
    await getIdentityRecoveryMode({ code: CODE }, "new-uid", SECRET);

    expect(mockIndexDoc).toHaveBeenCalledWith(hashRecoveryCode(CODE, SECRET));
  });
});
