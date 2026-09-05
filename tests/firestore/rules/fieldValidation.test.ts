import { afterEach, describe, expect, it } from "vitest";
import { getTestEnv } from "../setup";
import { createCampaign, dbAs, validCampaignDocument, validCharacterDocument } from "../helpers";

describe("Firestore Rules: bounded field validation", () => {
  afterEach(async () => {
    const env = await getTestEnv();
    await env.clearFirestore();
  });

  it("accepts the exact campaign create shape", async () => {
    const env = await getTestEnv();
    await expect(
      dbAs(env, "dm-1")
        .collection("campaigns")
        .doc("valid")
        .set(validCampaignDocument("dm-1", "Valid Campaign"))
    ).resolves.toBeUndefined();
  });

  it("accepts campaign and character collection fields at their exact maxima", async () => {
    const env = await getTestEnv();
    const dmDb = dbAs(env, "dm-1");
    await dmDb
      .collection("campaigns")
      .doc("maximum")
      .set(validCampaignDocument("dm-1", "c".repeat(100)));
    await expect(
      dmDb
        .collection("campaigns")
        .doc("maximum")
        .update({ memberIds: Array.from({ length: 100 }, (_, index) => `player-${index}`) })
    ).resolves.toBeUndefined();

    await expect(
      dmDb
        .collection("campaigns/maximum/characters")
        .doc("maximum-character")
        .set(
          validCharacterDocument("maximum", "", {
            skills: Array.from({ length: 200 }, (_, index) => ({ id: `skill-${index}` })),
          })
        )
    ).resolves.toBeUndefined();
  });

  it("rejects campaign names, member arrays, types, and unexpected fields outside bounds", async () => {
    const env = await getTestEnv();
    const dmDb = dbAs(env, "dm-1");

    await expect(
      dmDb
        .collection("campaigns")
        .doc("long")
        .set(validCampaignDocument("dm-1", "x".repeat(101)))
    ).rejects.toThrow();
    await expect(
      dmDb
        .collection("campaigns")
        .doc("members")
        .set(
          validCampaignDocument("dm-1", "Members", {
            memberIds: Array.from({ length: 101 }, (_, index) => `p-${index}`),
          })
        )
    ).rejects.toThrow();
    await expect(
      dmDb
        .collection("campaigns")
        .doc("type")
        .set(validCampaignDocument("dm-1", "Type", { dmId: 42 }))
    ).rejects.toThrow();
    await expect(
      dmDb
        .collection("campaigns")
        .doc("extra")
        .set(validCampaignDocument("dm-1", "Extra", { unexpected: true }))
    ).rejects.toThrow();
  });

  it("accepts a complete character with no client-supplied Recovery Code", async () => {
    const env = await getTestEnv();
    await createCampaign(env, "c1", "dm-1");
    const dmDb = dbAs(env, "dm-1");
    await expect(
      dmDb.collection("campaigns/c1/characters").doc("char1").set(validCharacterDocument("c1", ""))
    ).resolves.toBeUndefined();
  });

  it("rejects malformed, oversized, and unexpected character data", async () => {
    const env = await getTestEnv();
    await createCampaign(env, "c1", "dm-1");
    const dmDb = dbAs(env, "dm-1");

    for (const [id, code, overrides] of [
      ["bad-code", "not-a-code", {}],
      ["too-many-skills", "", { skills: Array.from({ length: 201 }, () => ({})) }],
      ["unexpected", "", { unexpected: true }],
    ] as const) {
      await expect(
        dmDb
          .collection("campaigns/c1/characters")
          .doc(id)
          .set(validCharacterDocument("c1", code, overrides))
      ).rejects.toThrow();
    }
  });
});
