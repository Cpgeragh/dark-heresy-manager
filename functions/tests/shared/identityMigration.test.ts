// functions/tests/shared/identityMigration.test.ts
import { describe, it, expect, vi } from "vitest";
import {
  computeOwnershipMigrationPlan,
  migrateCampaignOwnership,
} from "../../src/shared/identityMigration";

function makeDb(options: {
  dmDocs?: { id: string }[];
  playerDocs?: { id: string }[];
  campaignData?: Record<string, Record<string, unknown>>;
  characterCounts?: Record<string, number>;
  characterDocs?: Record<string, { id: string }[]>;
}) {
  const {
    dmDocs = [],
    playerDocs = [],
    campaignData = {},
    characterCounts = {},
    characterDocs = {},
  } = options;

  const campaignRef = (campaignId: string) => ({
    get: vi.fn().mockResolvedValue({ data: () => campaignData[campaignId] ?? {} }),
    collection: vi.fn((name: string) => {
      if (name !== "characters") throw new Error(`Unexpected subcollection: ${name}`);
      return {
        where: vi.fn(() => ({
          count: vi.fn(() => ({
            get: vi
              .fn()
              .mockResolvedValue({ data: () => ({ count: characterCounts[campaignId] ?? 0 }) }),
          })),
          limit: vi.fn(() => ({
            get: vi.fn().mockResolvedValue({
              docs: (characterDocs[campaignId] ?? []).map((d) => ({ ref: { id: d.id } })),
            }),
          })),
        })),
      };
    }),
  });

  return {
    collection: vi.fn((name: string) => {
      if (name !== "campaigns") throw new Error(`Unexpected collection: ${name}`);
      return {
        where: vi.fn((field: string) => ({
          limit: vi.fn(() => ({
            get: vi.fn().mockResolvedValue({ docs: field === "dmId" ? dmDocs : playerDocs }),
          })),
        })),
        doc: vi.fn((id: string) => campaignRef(id)),
      };
    }),
  } as never;
}

describe("computeOwnershipMigrationPlan", () => {
  it("classifies a campaign as dm-only", async () => {
    const plan = await computeOwnershipMigrationPlan(makeDb({ dmDocs: [{ id: "c1" }] }), "old-uid");

    expect(plan.campaigns).toEqual([{ campaignId: "c1", role: "dm" }]);
    expect(plan.totalWriteCount).toBe(1);
  });

  it("classifies a campaign as member-only and counts its owned characters without reading them", async () => {
    const plan = await computeOwnershipMigrationPlan(
      makeDb({ playerDocs: [{ id: "c1" }], characterCounts: { c1: 3 } }),
      "old-uid"
    );

    expect(plan.campaigns).toEqual([{ campaignId: "c1", role: "member" }]);
    expect(plan.totalWriteCount).toBe(4);
  });

  it("classifies a campaign appearing in both results as both", async () => {
    const plan = await computeOwnershipMigrationPlan(
      makeDb({ dmDocs: [{ id: "c1" }], playerDocs: [{ id: "c1" }], characterCounts: { c1: 2 } }),
      "old-uid"
    );

    expect(plan.campaigns).toEqual([{ campaignId: "c1", role: "both" }]);
    expect(plan.totalWriteCount).toBe(3);
  });

  it("throws when DM campaigns exceed the 200-campaign limit", async () => {
    const dmDocs = Array.from({ length: 201 }, (_, i) => ({ id: `c${i}` }));

    await expect(computeOwnershipMigrationPlan(makeDb({ dmDocs }), "old-uid")).rejects.toThrow(
      expect.objectContaining({ code: "resource-exhausted" })
    );
  });

  it("throws when member campaigns exceed the 200-campaign limit", async () => {
    const playerDocs = Array.from({ length: 201 }, (_, i) => ({ id: `c${i}` }));

    await expect(computeOwnershipMigrationPlan(makeDb({ playerDocs }), "old-uid")).rejects.toThrow(
      expect.objectContaining({ code: "resource-exhausted" })
    );
  });

  it("throws when a single campaign's owned-character count exceeds 100", async () => {
    await expect(
      computeOwnershipMigrationPlan(
        makeDb({ playerDocs: [{ id: "c1" }], characterCounts: { c1: 101 } }),
        "old-uid"
      )
    ).rejects.toThrow(expect.objectContaining({ code: "resource-exhausted" }));
  });
});

describe("migrateCampaignOwnership", () => {
  it("writes a single dmId update for a dm-only campaign, without reading the campaign first", async () => {
    const batchUpdate = vi.fn();
    const batch = { update: batchUpdate } as never;
    const db = makeDb({});
    const campaignGet = vi.mocked((db as ReturnType<typeof makeDb>).collection("campaigns").doc("c1").get);

    const writeCount = await migrateCampaignOwnership(
      db,
      batch,
      { campaignId: "c1", role: "dm" },
      "old-uid",
      "new-uid"
    );

    expect(writeCount).toBe(1);
    expect(batchUpdate).toHaveBeenCalledTimes(1);
    expect(batchUpdate).toHaveBeenCalledWith(expect.anything(), { dmId: "new-uid" });
    expect(campaignGet).not.toHaveBeenCalled();
  });

  it("reads live memberIds and migrates every owned character for a member campaign", async () => {
    const batchUpdate = vi.fn();
    const batch = { update: batchUpdate } as never;
    const db = makeDb({
      campaignData: { c1: { memberIds: ["old-uid", "other-uid"] } },
      characterDocs: { c1: [{ id: "char-1" }, { id: "char-2" }] },
    });

    const writeCount = await migrateCampaignOwnership(
      db,
      batch,
      { campaignId: "c1", role: "member" },
      "old-uid",
      "new-uid"
    );

    expect(writeCount).toBe(3);
    expect(batchUpdate).toHaveBeenCalledWith(expect.anything(), {
      memberIds: ["other-uid", "new-uid"],
    });
    expect(batchUpdate).toHaveBeenCalledWith(expect.objectContaining({ id: "char-1" }), {
      userId: "new-uid",
    });
    expect(batchUpdate).toHaveBeenCalledWith(expect.objectContaining({ id: "char-2" }), {
      userId: "new-uid",
    });
  });

  it("merges dmId and memberIds into a single update for a both-role campaign, never two writes to the same doc", async () => {
    const batchUpdate = vi.fn();
    const batch = { update: batchUpdate } as never;
    const db = makeDb({ campaignData: { c1: { memberIds: ["old-uid"] } } });

    const writeCount = await migrateCampaignOwnership(
      db,
      batch,
      { campaignId: "c1", role: "both" },
      "old-uid",
      "new-uid"
    );

    expect(writeCount).toBe(1);
    expect(batchUpdate).toHaveBeenCalledTimes(1);
    expect(batchUpdate).toHaveBeenCalledWith(expect.anything(), {
      dmId: "new-uid",
      memberIds: ["new-uid"],
    });
  });
});
