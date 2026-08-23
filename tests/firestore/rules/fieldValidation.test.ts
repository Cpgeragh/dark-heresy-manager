import { afterEach, describe, expect, it } from "vitest";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { getTestEnv } from "../setup";
import { createCampaign, dbAs, validCampaignDocument, validCharacterDocument } from "../helpers";

describe("Firestore Rules: bounded field validation", () => {
  afterEach(async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await env.clearFirestore();
  });

  it("accepts the exact campaign create shape", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await expect(
      dbAs(env, "dm-1")
        .collection("campaigns")
        .doc("valid")
        .set(validCampaignDocument("dm-1", "Valid Campaign"))
    ).resolves.toBeUndefined();
  });

  it("accepts campaign and character collection fields at their exact maxima", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
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

    const code = "DH-MAXX-0001";
    const batch = dmDb.batch();
    batch.set(
      dmDb.collection("campaigns/maximum/characters").doc("maximum-character"),
      validCharacterDocument("maximum", code, {
        skills: Array.from({ length: 200 }, (_, index) => ({ id: `skill-${index}` })),
      })
    );
    batch.set(dmDb.collection("recoveryIndex").doc(code), {
      campaignId: "maximum",
      characterId: "maximum-character",
    });
    await expect(batch.commit()).resolves.toBeUndefined();
  });

  it("rejects campaign names, member arrays, types, and unexpected fields outside bounds", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
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

  it("accepts a complete character only with its matching Recovery Index", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    const dmDb = dbAs(env, "dm-1");
    const code = "DH-CHAR-0001";
    const batch = dmDb.batch();
    batch.set(
      dmDb.collection("campaigns/c1/characters").doc("char1"),
      validCharacterDocument("c1", code)
    );
    batch.set(dmDb.collection("recoveryIndex").doc(code), {
      campaignId: "c1",
      characterId: "char1",
    });
    await expect(batch.commit()).resolves.toBeUndefined();
  });

  it("rejects malformed, oversized, and unexpected character data", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    const dmDb = dbAs(env, "dm-1");

    for (const [id, code, overrides] of [
      ["bad-code", "not-a-code", {}],
      ["too-many-skills", "DH-SKIL-0001", { skills: Array.from({ length: 201 }, () => ({})) }],
      ["unexpected", "DH-FILD-0001", { unexpected: true }],
    ] as const) {
      const batch = dmDb.batch();
      batch.set(
        dmDb.collection("campaigns/c1/characters").doc(id),
        validCharacterDocument("c1", code, overrides)
      );
      batch.set(dmDb.collection("recoveryIndex").doc(code), {
        campaignId: "c1",
        characterId: id,
      });
      await expect(batch.commit()).rejects.toThrow();
    }
  });
});
