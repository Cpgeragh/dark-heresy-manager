// functions/tests/shared/identityMigration.test.ts
import { describe, it, expect, vi } from "vitest";
import {
  computeOwnershipMigrationPlan,
  applyOwnershipMigrationPlan,
} from "../../src/shared/identityMigration";

function makeCampaignsCollection(
  dmGet: ReturnType<typeof vi.fn>,
  playerGet: ReturnType<typeof vi.fn>
) {
  return {
    where: vi.fn((field: string) => {
      const get = field === "dmId" ? dmGet : playerGet;
      return { limit: vi.fn(() => ({ get })) };
    }),
  };
}

function makeCampaignDoc(
  id: string,
  data: Record<string, unknown>,
  charactersGet?: ReturnType<typeof vi.fn>
) {
  return {
    id,
    data: () => data,
    ref: {
      id,
      collection: vi.fn(() => ({
        where: vi.fn(() => ({ limit: vi.fn(() => ({ get: charactersGet })) })),
      })),
    },
  };
}

function makeDb(dmGet: ReturnType<typeof vi.fn>, playerGet: ReturnType<typeof vi.fn>) {
  return {
    collection: vi.fn(() => makeCampaignsCollection(dmGet, playerGet)),
  } as never;
}

describe("computeOwnershipMigrationPlan", () => {
  it("migrates dmId for campaigns where the old identity was DM", async () => {
    const dmGet = vi.fn().mockResolvedValue({ docs: [makeCampaignDoc("c1", {})] });
    const playerGet = vi.fn().mockResolvedValue({ docs: [] });

    const plan = await computeOwnershipMigrationPlan(makeDb(dmGet, playerGet), "old-uid", "new-uid");

    expect(plan.campaignMigrations).toEqual([
      {
        campaignRef: expect.objectContaining({ id: "c1" }),
        changes: { dmId: "new-uid" },
        characterRefs: [],
      },
    ]);
    expect(plan.writeCount).toBe(1);
  });

  it("migrates memberIds and owned characters for campaigns where the old identity was a member", async () => {
    const charactersGet = vi
      .fn()
      .mockResolvedValue({ docs: [{ id: "char-1" }, { id: "char-2" }] });
    const dmGet = vi.fn().mockResolvedValue({ docs: [] });
    const playerGet = vi.fn().mockResolvedValue({
      docs: [makeCampaignDoc("c1", { memberIds: ["old-uid", "other-uid"] }, charactersGet)],
    });

    const plan = await computeOwnershipMigrationPlan(makeDb(dmGet, playerGet), "old-uid", "new-uid");

    expect(plan.campaignMigrations[0].changes.memberIds).toEqual(["other-uid", "new-uid"]);
    expect(plan.campaignMigrations[0].characterRefs).toHaveLength(2);
    expect(plan.writeCount).toBe(3);
  });

  it("merges DM and member changes when the same campaign appears in both results", async () => {
    const charactersGet = vi.fn().mockResolvedValue({ docs: [] });
    const dmGet = vi.fn().mockResolvedValue({ docs: [makeCampaignDoc("c1", {})] });
    const playerGet = vi
      .fn()
      .mockResolvedValue({ docs: [makeCampaignDoc("c1", { memberIds: ["old-uid"] }, charactersGet)] });

    const plan = await computeOwnershipMigrationPlan(makeDb(dmGet, playerGet), "old-uid", "new-uid");

    expect(plan.campaignMigrations).toHaveLength(1);
    expect(plan.campaignMigrations[0].changes).toEqual({ dmId: "new-uid", memberIds: ["new-uid"] });
  });

  it("throws when DM campaigns exceed the 50-campaign limit", async () => {
    const dmGet = vi.fn().mockResolvedValue({
      docs: Array.from({ length: 51 }, (_, i) => makeCampaignDoc(`c${i}`, {})),
    });
    const playerGet = vi.fn().mockResolvedValue({ docs: [] });

    await expect(
      computeOwnershipMigrationPlan(makeDb(dmGet, playerGet), "old-uid", "new-uid")
    ).rejects.toThrow(expect.objectContaining({ code: "resource-exhausted" }));
  });

  it("throws when characters in one campaign exceed the 20-character limit", async () => {
    const charactersGet = vi
      .fn()
      .mockResolvedValue({ docs: Array.from({ length: 21 }, (_, i) => ({ id: `char${i}` })) });
    const dmGet = vi.fn().mockResolvedValue({ docs: [] });
    const playerGet = vi.fn().mockResolvedValue({
      docs: [makeCampaignDoc("c1", { memberIds: ["old-uid"] }, charactersGet)],
    });

    await expect(
      computeOwnershipMigrationPlan(makeDb(dmGet, playerGet), "old-uid", "new-uid")
    ).rejects.toThrow(expect.objectContaining({ code: "resource-exhausted" }));
  });

  it("throws when the total write count exceeds 440, even though each per-dimension limit is individually satisfied", async () => {
    const charactersGet = vi
      .fn()
      .mockResolvedValue({ docs: Array.from({ length: 20 }, (_, i) => ({ id: `char${i}` })) });
    const dmGet = vi.fn().mockResolvedValue({ docs: [] });
    const playerGet = vi.fn().mockResolvedValue({
      docs: Array.from({ length: 25 }, (_, i) =>
        makeCampaignDoc(`c${i}`, { memberIds: ["old-uid"] }, charactersGet)
      ),
    });

    await expect(
      computeOwnershipMigrationPlan(makeDb(dmGet, playerGet), "old-uid", "new-uid")
    ).rejects.toThrow(expect.objectContaining({ code: "resource-exhausted" }));
  });
});

describe("applyOwnershipMigrationPlan", () => {
  it("adds one batch update per campaign and per migrated character", () => {
    const batchUpdate = vi.fn();
    const batch = { update: batchUpdate } as never;
    const campaignRef = { id: "c1" } as never;
    const characterRef = { id: "char-1" } as never;

    applyOwnershipMigrationPlan(
      batch,
      {
        campaignMigrations: [
          { campaignRef, changes: { dmId: "new-uid" }, characterRefs: [characterRef] },
        ],
        writeCount: 2,
      },
      "new-uid"
    );

    expect(batchUpdate).toHaveBeenCalledWith(campaignRef, { dmId: "new-uid" });
    expect(batchUpdate).toHaveBeenCalledWith(characterRef, { userId: "new-uid" });
  });
});
