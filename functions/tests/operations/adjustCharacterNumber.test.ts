import { beforeEach, describe, expect, it, vi } from "vitest";
import { adjustCharacterNumber } from "../../src/operations/adjustCharacterNumber";

const campaignGet = vi.fn();
const transactionGet = vi.fn();
const transactionUpdate = vi.fn();
const runTransaction = vi.fn(async (handler: (transaction: unknown) => Promise<void>) => {
  await handler({ get: transactionGet, update: transactionUpdate });
});
const characterRef = {};
const campaignRef = {
  get: campaignGet,
  collection: vi.fn(() => ({ doc: vi.fn(() => characterRef) })),
};
const userLinkGet = vi.fn();

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({
    collection: vi.fn((name: string) => {
      if (name === "campaigns") return { doc: vi.fn(() => campaignRef) };
      if (name === "userLinks") return { doc: vi.fn(() => ({ get: userLinkGet })) };
      throw new Error(`Unexpected collection: ${name}`);
    }),
    runTransaction,
  }),
}));

const baseInput = {
  campaignId: "campaign-1",
  characterId: "character-1",
  field: "drugs",
  itemId: "drug-1",
  property: "quantity",
  delta: 2,
  fallbackValue: 0,
};

describe("adjustCharacterNumber", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    campaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    userLinkGet.mockResolvedValue({ exists: false });
  });

  it("applies a delta to the freshly read collection value", async () => {
    transactionGet.mockResolvedValue({
      exists: true,
      data: () => ({
        userId: "player-1",
        isEditableByPlayer: false,
        drugs: [
          { id: "drug-1", name: "Obscura", quantity: 4 },
          { id: "drug-2", name: "Stimm", quantity: 1 },
        ],
      }),
    });

    await adjustCharacterNumber(baseInput, "dm-1");

    expect(transactionUpdate).toHaveBeenCalledWith(characterRef, {
      drugs: [
        { id: "drug-1", name: "Obscura", quantity: 6 },
        { id: "drug-2", name: "Stimm", quantity: 1 },
      ],
    });
  });

  it("updates one nested ammunition value without replacing sibling state", async () => {
    transactionGet.mockResolvedValue({
      exists: true,
      data: () => ({
        userId: "player-1",
        isEditableByPlayer: false,
        rangedWeapons: [
          {
            id: "weapon-1",
            name: "Autogun",
            ammoEntries: [{ id: "ammo-1", name: "Bullets", clips: 1, rounds: 12, loaded: true }],
          },
        ],
      }),
    });

    await adjustCharacterNumber(
      {
        ...baseInput,
        field: "rangedWeapons",
        itemId: "weapon-1",
        nestedCollection: "ammoEntries",
        nestedItemId: "ammo-1",
        property: "rounds",
        delta: -3,
        fallbackValue: 0,
      },
      "dm-1"
    );

    expect(transactionUpdate).toHaveBeenCalledWith(characterRef, {
      rangedWeapons: [
        {
          id: "weapon-1",
          name: "Autogun",
          ammoEntries: [{ id: "ammo-1", name: "Bullets", clips: 1, rounds: 9, loaded: true }],
        },
      ],
    });
  });

  it("clamps decrements at zero", async () => {
    transactionGet.mockResolvedValue({
      exists: true,
      data: () => ({
        userId: "player-1",
        isEditableByPlayer: false,
        drugs: [{ id: "drug-1", quantity: 1 }],
      }),
    });

    await adjustCharacterNumber({ ...baseInput, delta: -4 }, "dm-1");

    expect(transactionUpdate).toHaveBeenCalledWith(characterRef, {
      drugs: [{ id: "drug-1", quantity: 0 }],
    });
  });

  it("rejects unsupported paths before reading Firestore", async () => {
    await expect(adjustCharacterNumber({ ...baseInput, field: "gear" }, "dm-1")).rejects.toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
    expect(campaignGet).not.toHaveBeenCalled();
  });

  it("rejects a missing target without writing", async () => {
    transactionGet.mockResolvedValue({
      exists: true,
      data: () => ({ userId: "player-1", isEditableByPlayer: false, drugs: [] }),
    });

    await expect(adjustCharacterNumber(baseInput, "dm-1")).rejects.toThrow(
      expect.objectContaining({ code: "not-found" })
    );
    expect(transactionUpdate).not.toHaveBeenCalled();
  });
});
