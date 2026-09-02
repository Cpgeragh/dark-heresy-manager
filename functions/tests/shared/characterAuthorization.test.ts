// functions/tests/shared/characterAuthorization.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Firestore } from "firebase-admin/firestore";
import { assertCanEditCharacter } from "../../src/shared/characterAuthorization";

const mockUserLinkGet = vi.fn();
const mockUserLinkDoc = vi.fn(() => ({ get: mockUserLinkGet }));
const mockUserLinksCollection = { doc: mockUserLinkDoc };
const mockCollection = vi.fn((name: string) => {
  if (name === "userLinks") return mockUserLinksCollection;
  throw new Error(`Unexpected collection: ${name}`);
});
const mockDb = { collection: mockCollection } as unknown as Firestore;

describe("assertCanEditCharacter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserLinkGet.mockResolvedValue({ exists: false });
  });

  it("allows the campaign DM", async () => {
    await expect(
      assertCanEditCharacter(mockDb, "dm-1", "dm-1", { userId: "player-1", isEditableByPlayer: false })
    ).resolves.toBeUndefined();
  });

  it("allows a device linked to the DM", async () => {
    mockUserLinkGet.mockResolvedValue({ exists: true, data: () => ({ primaryUid: "dm-1" }) });

    await expect(
      assertCanEditCharacter(mockDb, "linked-device", "dm-1", { userId: "player-1", isEditableByPlayer: false })
    ).resolves.toBeUndefined();
  });

  it("allows the owning player when the character is editable", async () => {
    await expect(
      assertCanEditCharacter(mockDb, "player-1", "dm-1", { userId: "player-1", isEditableByPlayer: true })
    ).resolves.toBeUndefined();
  });

  it("rejects the owning player when the character is NOT editable", async () => {
    await expect(
      assertCanEditCharacter(mockDb, "player-1", "dm-1", { userId: "player-1", isEditableByPlayer: false })
    ).rejects.toThrow(expect.objectContaining({ code: "permission-denied" }));
  });

  it("rejects a caller who doesn't own the character even if it's editable", async () => {
    await expect(
      assertCanEditCharacter(mockDb, "someone-else", "dm-1", { userId: "player-1", isEditableByPlayer: true })
    ).rejects.toThrow(expect.objectContaining({ code: "permission-denied" }));
  });

  it("rejects an unclaimed character (no userId) for a non-DM caller", async () => {
    await expect(
      assertCanEditCharacter(mockDb, "player-1", "dm-1", { userId: null, isEditableByPlayer: true })
    ).rejects.toThrow(expect.objectContaining({ code: "permission-denied" }));
  });
});
