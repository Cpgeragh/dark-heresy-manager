import { beforeEach, describe, expect, it, vi } from "vitest";
import { getIdentityRecoveryMode } from "../../src/operations/getIdentityRecoveryMode";
import { hashRecoveryCode } from "../../src/shared/recoveryCode";

const { mockIndexGet, mockProfileGet, mockLinksGet, mockIndexDoc, mockCollection } = vi.hoisted(
  () => {
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
  }
);

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
      status: "found",
      mode: "link",
    });
  });

  it("selects reclaim when no linked-device records remain", async () => {
    mockLinksGet.mockResolvedValue({ empty: true });

    await expect(getIdentityRecoveryMode({ code: CODE }, "new-uid", SECRET)).resolves.toEqual({
      status: "found",
      mode: "reclaim",
    });
  });

  it("returns not-found for an unknown recovery code", async () => {
    mockIndexGet.mockResolvedValue({ exists: false });

    await expect(getIdentityRecoveryMode({ code: CODE }, "new-uid", SECRET)).resolves.toEqual({
      status: "not-found",
    });
  });

  it("returns own-code when the caller already owns the code", async () => {
    await expect(getIdentityRecoveryMode({ code: CODE }, "primary-uid", SECRET)).resolves.toEqual({
      status: "own-code",
    });
  });

  it("returns missing-data for a recovery identity without a valid profile", async () => {
    mockProfileGet.mockResolvedValue({ exists: false });

    await expect(getIdentityRecoveryMode({ code: CODE }, "new-uid", SECRET)).resolves.toEqual({
      status: "missing-data",
    });
  });

  it("looks up the HMAC hash rather than the raw code", async () => {
    await getIdentityRecoveryMode({ code: CODE }, "new-uid", SECRET);

    expect(mockIndexDoc).toHaveBeenCalledWith(hashRecoveryCode(CODE, SECRET));
  });
});
