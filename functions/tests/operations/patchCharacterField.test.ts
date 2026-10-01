// functions/tests/operations/patchCharacterField.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { patchCharacterField } from "../../src/operations/patchCharacterField";

const mockCampaignGet = vi.fn();
const mockTransactionGet = vi.fn();
const mockTransactionUpdate = vi.fn();
const mockTransactionSet = vi.fn();
const mockRunTransaction = vi.fn(async (callback: (transaction: unknown) => Promise<void>) => {
  await callback({
    get: mockTransactionGet,
    update: mockTransactionUpdate,
    set: mockTransactionSet,
  });
});

const mockCharacterRef = {};
const mockSummaryRef = {};
const mockCharactersCollection = { doc: vi.fn(() => mockCharacterRef) };
const mockSummariesCollection = { doc: vi.fn(() => mockSummaryRef) };
const mockCampaignRef = {
  get: mockCampaignGet,
  collection: vi.fn((name: string) => {
    if (name === "characters") return mockCharactersCollection;
    if (name === "characterSummaries") return mockSummariesCollection;
    throw new Error(`Unexpected subcollection: ${name}`);
  }),
};
const mockCampaignsCollection = { doc: vi.fn(() => mockCampaignRef) };
const mockUserLinkGet = vi.fn();
const mockUserLinkDoc = vi.fn(() => ({ get: mockUserLinkGet }));
const mockUserLinksCollection = { doc: mockUserLinkDoc };
const mockUserProfilesCollection = { doc: vi.fn(() => ({})) };

const mockCollection = vi.fn((name: string) => {
  if (name === "campaigns") return mockCampaignsCollection;
  if (name === "userLinks") return mockUserLinksCollection;
  if (name === "userProfiles") return mockUserProfilesCollection;
  throw new Error(`Unexpected collection: ${name}`);
});

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({
    collection: mockCollection,
    runTransaction: mockRunTransaction,
  }),
}));

describe("patchCharacterField", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserLinkGet.mockResolvedValue({ exists: false });
  });

  it("rejects a field with no registered validator before touching Firestore", async () => {
    await expect(
      patchCharacterField(
        { campaignId: "c1", characterId: "char-1", field: "notARealCharacterField", value: {} },
        "dm-1"
      )
    ).rejects.toThrow(expect.objectContaining({ code: "invalid-argument" }));
    expect(mockCampaignGet).not.toHaveBeenCalled();
  });

  it("rejects when the campaign does not exist", async () => {
    mockCampaignGet.mockResolvedValue({ exists: false });

    await expect(
      patchCharacterField(
        { campaignId: "c1", characterId: "char-1", field: "notes", value: [{ id: "n1", title: "Note", text: "hi", updatedAt: "2026-01-01T00:00:00.000Z" }] },
        "dm-1"
      )
    ).rejects.toThrow(expect.objectContaining({ code: "not-found" }));
  });

  it("rejects when the character does not exist", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({ exists: false });

    await expect(
      patchCharacterField(
        { campaignId: "c1", characterId: "char-1", field: "notes", value: [{ id: "n1", title: "Note", text: "hi", updatedAt: "2026-01-01T00:00:00.000Z" }] },
        "dm-1"
      )
    ).rejects.toThrow(expect.objectContaining({ code: "not-found" }));
  });

  it("allows the DM to patch notes", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => ({ userId: "player-1", isEditableByPlayer: false }),
    });

    const notes = [{ id: "n1", title: "Note", text: "hi", updatedAt: "2026-01-01T00:00:00.000Z" }];
    await patchCharacterField(
      { campaignId: "c1", characterId: "char-1", field: "notes", value: notes },
      "dm-1"
    );

    expect(mockTransactionUpdate).toHaveBeenCalledWith(mockCharacterRef, { notes });
  });

  it("allows the DM to patch the header", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => ({ campaignId: "c1", userId: "player-1", isEditableByPlayer: false }),
    });

    await patchCharacterField(
      {
        campaignId: "c1",
        characterId: "char-1",
        field: "header",
        value: { characterName: "Brother Corvus" },
      },
      "dm-1"
    );

    expect(mockTransactionUpdate).toHaveBeenCalledWith(mockCharacterRef, {
      header: { characterName: "Brother Corvus" },
    });
  });

  it("also writes the character summary when patching the header", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => ({
        campaignId: "c1",
        userId: "player-1",
        isEditableByPlayer: false,
        header: { characterName: "Old Name" },
      }),
    });

    await patchCharacterField(
      {
        campaignId: "c1",
        characterId: "char-1",
        field: "header",
        value: { characterName: "Brother Corvus" },
      },
      "dm-1"
    );

    expect(mockTransactionSet).toHaveBeenCalledWith(mockSummaryRef, {
      campaignId: "c1",
      characterName: "Brother Corvus",
      userId: "player-1",
    });
  });

  it("uses the owner's live profile name when patching the summary", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          campaignId: "c1",
          userId: "player-1",
          isEditableByPlayer: false,
          header: { characterName: "Old Name", playerName: "Temporary Name" },
        }),
      })
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({ firstName: "Iris" }),
      });

    await patchCharacterField(
      {
        campaignId: "c1",
        characterId: "char-1",
        field: "header",
        value: { characterName: "Brother Corvus", playerName: "Temporary Name" },
      },
      "dm-1"
    );

    expect(mockTransactionSet).toHaveBeenCalledWith(
      mockSummaryRef,
      expect.objectContaining({ playerName: "Iris", userId: "player-1" })
    );
  });

  it("allows the DM to patch the portrait and updates the summary", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => ({
        campaignId: "c1",
        userId: "player-1",
        isEditableByPlayer: false,
        header: { characterName: "Brother Corvus" },
      }),
    });

    const portrait = `data:image/jpeg;base64,${"a".repeat(100)}`;
    await patchCharacterField(
      { campaignId: "c1", characterId: "char-1", field: "portraitUrl", value: portrait },
      "dm-1"
    );

    expect(mockTransactionUpdate).toHaveBeenCalledWith(mockCharacterRef, { portraitUrl: portrait });
    expect(mockTransactionSet).toHaveBeenCalledWith(mockSummaryRef, {
      campaignId: "c1",
      characterName: "Brother Corvus",
      portraitUrl: portrait,
      userId: "player-1",
    });
  });

  it("allows the DM to patch characteristics without touching the summary", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => ({ userId: "player-1", isEditableByPlayer: false }),
    });

    const characteristics = {
      ws: { base: 30, advances: 1 },
      bs: { base: 30, advances: 0 },
      s: { base: 30, advances: 0 },
      t: { base: 30, advances: 0 },
      ag: { base: 30, advances: 0 },
      int: { base: 30, advances: 0 },
      per: { base: 30, advances: 0 },
      wp: { base: 30, advances: 0 },
      fel: { base: 30, advances: 0 },
    };
    await patchCharacterField(
      { campaignId: "c1", characterId: "char-1", field: "characteristics", value: characteristics },
      "dm-1"
    );

    expect(mockTransactionUpdate).toHaveBeenCalledWith(mockCharacterRef, { characteristics });
    expect(mockTransactionSet).not.toHaveBeenCalled();
  });

  it("patches several fields atomically via the fields shape", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => ({ userId: "player-1", isEditableByPlayer: false }),
    });

    const talentsAndTraits = { talents: [], traits: [] };
    const psychic = { psyRating: 1 };
    await patchCharacterField(
      {
        campaignId: "c1",
        characterId: "char-1",
        fields: { talentsAndTraits, psychic },
      },
      "dm-1"
    );

    expect(mockTransactionUpdate).toHaveBeenCalledWith(mockCharacterRef, {
      talentsAndTraits,
      psychic,
    });
  });

  it("rejects the whole multi-field patch when one field is invalid, writing nothing", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });

    await expect(
      patchCharacterField(
        {
          campaignId: "c1",
          characterId: "char-1",
          fields: { talentsAndTraits: { talents: [], traits: [] }, psychic: "not-an-object" },
        },
        "dm-1"
      )
    ).rejects.toThrow(expect.objectContaining({ code: "invalid-argument" }));
    expect(mockCampaignGet).not.toHaveBeenCalled();
    expect(mockTransactionUpdate).not.toHaveBeenCalled();
  });

  it("rejects when both field/value and fields are provided", async () => {
    await expect(
      patchCharacterField(
        {
          campaignId: "c1",
          characterId: "char-1",
          field: "notes",
          value: "hi",
          fields: { psychic: { psyRating: 1 } },
        },
        "dm-1"
      )
    ).rejects.toThrow(expect.objectContaining({ code: "invalid-argument" }));
  });

  it("rejects an empty fields object", async () => {
    await expect(
      patchCharacterField({ campaignId: "c1", characterId: "char-1", fields: {} }, "dm-1")
    ).rejects.toThrow(expect.objectContaining({ code: "invalid-argument" }));
  });

  it("writes the summary once from the merged result when a multi-field patch touches a summary-relevant field", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => ({ campaignId: "c1", userId: "player-1", isEditableByPlayer: false }),
    });

    const header = { characterName: "Brother Corvus" };
    const psychic = { psyRating: 1 };
    await patchCharacterField(
      { campaignId: "c1", characterId: "char-1", fields: { header, psychic } },
      "dm-1"
    );

    expect(mockTransactionSet).toHaveBeenCalledTimes(1);
    expect(mockTransactionSet).toHaveBeenCalledWith(mockSummaryRef, {
      campaignId: "c1",
      characterName: "Brother Corvus",
      userId: "player-1",
    });
  });

  it("does not write the character summary when patching notes", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => ({ userId: "player-1", isEditableByPlayer: false }),
    });

    await patchCharacterField(
      {
        campaignId: "c1",
        characterId: "char-1",
        field: "notes",
        value: [{ id: "n1", title: "Note", text: "hi", updatedAt: "2026-01-01T00:00:00.000Z" }],
      },
      "dm-1"
    );

    expect(mockTransactionSet).not.toHaveBeenCalled();
  });

  it("allows the owning player to patch notes when the character is editable", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => ({ userId: "player-1", isEditableByPlayer: true }),
    });

    const notes = [{ id: "n1", title: "Note", text: "hi", updatedAt: "2026-01-01T00:00:00.000Z" }];
    await patchCharacterField(
      { campaignId: "c1", characterId: "char-1", field: "notes", value: notes },
      "player-1"
    );

    expect(mockTransactionUpdate).toHaveBeenCalledWith(mockCharacterRef, { notes });
  });

  it("rejects the owning player when the character is not editable", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => ({ userId: "player-1", isEditableByPlayer: false }),
    });

    await expect(
      patchCharacterField(
        { campaignId: "c1", characterId: "char-1", field: "notes", value: [{ id: "n1", title: "Note", text: "hi", updatedAt: "2026-01-01T00:00:00.000Z" }] },
        "player-1"
      )
    ).rejects.toThrow(expect.objectContaining({ code: "permission-denied" }));
    expect(mockTransactionUpdate).not.toHaveBeenCalled();
  });

  it("rejects an unrelated caller", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => ({ userId: "player-1", isEditableByPlayer: true }),
    });

    await expect(
      patchCharacterField(
        { campaignId: "c1", characterId: "char-1", field: "notes", value: [{ id: "n1", title: "Note", text: "hi", updatedAt: "2026-01-01T00:00:00.000Z" }] },
        "someone-else"
      )
    ).rejects.toThrow(expect.objectContaining({ code: "permission-denied" }));
  });

  it("rejects an invalid value for a registered field before touching Firestore", async () => {
    await expect(
      patchCharacterField(
        { campaignId: "c1", characterId: "char-1", field: "notes", value: 42 },
        "dm-1"
      )
    ).rejects.toThrow(expect.objectContaining({ code: "invalid-argument" }));
    expect(mockCampaignGet).not.toHaveBeenCalled();
    expect(mockTransactionGet).not.toHaveBeenCalled();
  });

  const OTHER_CHARACTERISTICS = {
    bs: { base: 30, advances: 0 },
    s: { base: 30, advances: 0 },
    t: { base: 30, advances: 0 },
    ag: { base: 30, advances: 0 },
    int: { base: 30, advances: 0 },
    per: { base: 30, advances: 0 },
    wp: { base: 30, advances: 0 },
    fel: { base: 30, advances: 0 },
  };

  it("allows a characteristics advance that pays the real, career-derived cost", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => ({
        userId: "player-1",
        isEditableByPlayer: false,
        header: { career: "Adept" },
        characteristics: { ws: { base: 30, advances: 0 }, ...OTHER_CHARACTERISTICS },
      }),
    });

    const characteristics = {
      ws: { base: 30, advances: 1, advancePurchases: { simple: { cost: 500 } } },
      ...OTHER_CHARACTERISTICS,
    };
    await patchCharacterField(
      { campaignId: "c1", characterId: "char-1", field: "characteristics", value: characteristics },
      "dm-1"
    );

    expect(mockTransactionUpdate).toHaveBeenCalledWith(mockCharacterRef, { characteristics });
  });

  it("rejects a characteristics advance recorded at a cheaper cost than the career table says", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => ({
        userId: "player-1",
        isEditableByPlayer: false,
        header: { career: "Adept" },
        characteristics: { ws: { base: 30, advances: 0 }, ...OTHER_CHARACTERISTICS },
      }),
    });

    await expect(
      patchCharacterField(
        {
          campaignId: "c1",
          characterId: "char-1",
          field: "characteristics",
          value: {
            ws: { base: 30, advances: 1, advancePurchases: { simple: { cost: 1 } } },
            ...OTHER_CHARACTERISTICS,
          },
        },
        "dm-1"
      )
    ).rejects.toThrow(expect.objectContaining({ code: "invalid-argument" }));
    expect(mockTransactionUpdate).not.toHaveBeenCalled();
  });

  it("allows the DM to train a skill that isn't on the career table at a DM-set cost", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => ({
        userId: "player-1",
        isEditableByPlayer: false,
        header: { career: "Adept", rank: "Archivist" },
        skills: [],
      }),
    });

    const skills = [
      {
        id: "not-a-real-skill",
        level: "trained",
        manualCosts: { trained: 50 },
        xpPurchases: { trained: { cost: 50 } },
      },
    ];
    await patchCharacterField(
      { campaignId: "c1", characterId: "char-1", field: "skills", value: skills },
      "dm-1"
    );

    expect(mockTransactionUpdate).toHaveBeenCalledWith(mockCharacterRef, { skills });
  });

  it("rejects a player training a skill that isn't on the career table, even with a cost attached", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => ({
        userId: "player-1",
        isEditableByPlayer: true,
        header: { career: "Adept", rank: "Archivist" },
        skills: [],
      }),
    });

    await expect(
      patchCharacterField(
        {
          campaignId: "c1",
          characterId: "char-1",
          field: "skills",
          value: [
            {
              id: "not-a-real-skill",
              level: "trained",
              manualCosts: { trained: 50 },
              xpPurchases: { trained: { cost: 50 } },
            },
          ],
        },
        "player-1"
      )
    ).rejects.toThrow(expect.objectContaining({ code: "invalid-argument" }));
    expect(mockTransactionUpdate).not.toHaveBeenCalled();
  });

  it("allows the DM to train a weapon group that isn't unlocked, at a DM-set cost", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => ({
        userId: "player-1",
        isEditableByPlayer: false,
        header: { career: "Guardsman", rank: "Conscript" },
        weaponTraining: { trained: [], exoticWeapons: [] },
      }),
    });

    const weaponTraining = {
      trained: ["basic-bolt"],
      exoticWeapons: [],
      manualCosts: { "basic-bolt": 350 },
      xpPurchases: { "basic-bolt": { cost: 350 } },
    };
    await patchCharacterField(
      { campaignId: "c1", characterId: "char-1", field: "weaponTraining", value: weaponTraining },
      "dm-1"
    );

    expect(mockTransactionUpdate).toHaveBeenCalledWith(mockCharacterRef, { weaponTraining });
  });

  it("rejects a player training a weapon group that isn't unlocked, even with a cost attached", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => ({
        userId: "player-1",
        isEditableByPlayer: true,
        header: { career: "Guardsman", rank: "Conscript" },
        weaponTraining: { trained: [], exoticWeapons: [] },
      }),
    });

    await expect(
      patchCharacterField(
        {
          campaignId: "c1",
          characterId: "char-1",
          field: "weaponTraining",
          value: {
            trained: ["basic-bolt"],
            exoticWeapons: [],
            manualCosts: { "basic-bolt": 0 },
            xpPurchases: { "basic-bolt": { cost: 0 } },
          },
        },
        "player-1"
      )
    ).rejects.toThrow(expect.objectContaining({ code: "invalid-argument" }));
    expect(mockTransactionUpdate).not.toHaveBeenCalled();
  });

  it("allows a player to take an alternate rank while ranking up to the rank it replaces", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => ({
        userId: "player-1",
        isEditableByPlayer: true,
        header: { career: "Cleric", rank: "Priest" },
        experience: { total: 3000, spent: 1000, ranks: [] },
      }),
    });

    const experience = {
      total: 3000,
      spent: 1000,
      ranks: [],
      alternateRanks: [
        {
          alternateRankId: "black-priest-of-maccabeus",
          replacedRankId: "preacher",
          takenAtTier: 4,
        },
      ],
    };
    await patchCharacterField(
      { campaignId: "c1", characterId: "char-1", field: "experience", value: experience },
      "player-1"
    );

    expect(mockTransactionUpdate).toHaveBeenCalledWith(mockCharacterRef, { experience });
  });

  it("rejects a player taking an alternate rank they are not ranking up to", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => ({
        userId: "player-1",
        isEditableByPlayer: true,
        header: { career: "Cleric", rank: "Novice" },
        experience: { total: 3000, spent: 1000, ranks: [] },
      }),
    });

    await expect(
      patchCharacterField(
        {
          campaignId: "c1",
          characterId: "char-1",
          field: "experience",
          value: {
            total: 3000,
            spent: 1000,
            ranks: [],
            alternateRanks: [
              {
                alternateRankId: "black-priest-of-maccabeus",
                replacedRankId: "preacher",
                takenAtTier: 4,
              },
            ],
          },
        },
        "player-1"
      )
    ).rejects.toThrow(expect.objectContaining({ code: "invalid-argument" }));
    expect(mockTransactionUpdate).not.toHaveBeenCalled();
  });
});
