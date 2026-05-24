import { describe, it, expect, afterEach } from "vitest";
import { getTestEnv } from "../setup";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { dbAs, createCampaign, createCharacter } from "../helpers";

async function createProposal(
  env: RulesTestEnvironment,
  campaignId: string,
  characterId: string,
  proposalId: string,
  data: Record<string, unknown> = {}
) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore()
      .collection(`campaigns/${campaignId}/characters/${characterId}/xpProposals`)
      .doc(proposalId)
      .set({
        playerId: "player-1",
        description: "Buy Awareness +10",
        xpCost: 100,
        status: "pending",
        proposedAt: new Date(),
        ...data,
      });
  });
}

describe("Firestore Rules: XP Proposals", () => {
  afterEach(async () => {
    const env = await getTestEnv();
    await env.clearFirestore();
  });

  it("DM can read proposals for a character", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createCharacter(env, "c1", "char-1", { userId: "player-1" });
    await createProposal(env, "c1", "char-1", "prop-1");

    const dmDb = dbAs(env, "dm-1");
    await expect(
      dmDb.collection("campaigns/c1/characters/char-1/xpProposals").doc("prop-1").get()
    ).resolves.toBeDefined();
  });

  it("character owner can read their own proposals", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createCharacter(env, "c1", "char-1", { userId: "player-1" });
    await createProposal(env, "c1", "char-1", "prop-1");

    const playerDb = dbAs(env, "player-1");
    await expect(
      playerDb.collection("campaigns/c1/characters/char-1/xpProposals").doc("prop-1").get()
    ).resolves.toBeDefined();
  });

  it("different player cannot read another character's proposals", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createCharacter(env, "c1", "char-1", { userId: "player-1" });
    await createProposal(env, "c1", "char-1", "prop-1");

    const otherDb = dbAs(env, "player-2");
    await expect(
      otherDb.collection("campaigns/c1/characters/char-1/xpProposals").doc("prop-1").get()
    ).rejects.toThrow();
  });

  it("character owner can create a pending proposal for their own character", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createCharacter(env, "c1", "char-1", { userId: "player-1" });

    const playerDb = dbAs(env, "player-1");
    await expect(
      playerDb.collection("campaigns/c1/characters/char-1/xpProposals").doc("prop-new").set({
        playerId: "player-1",
        description: "Buy Dodge",
        xpCost: 100,
        status: "pending",
        proposedAt: new Date(),
      })
    ).resolves.toBeUndefined();
  });

  it("player cannot create a proposal with status other than pending", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createCharacter(env, "c1", "char-1", { userId: "player-1" });

    const playerDb = dbAs(env, "player-1");
    await expect(
      playerDb.collection("campaigns/c1/characters/char-1/xpProposals").doc("prop-new").set({
        playerId: "player-1",
        description: "Self-approved",
        xpCost: 100,
        status: "approved",
        proposedAt: new Date(),
      })
    ).rejects.toThrow();
  });

  it("player cannot create a proposal for another player's character", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createCharacter(env, "c1", "char-1", { userId: "player-1" });

    const otherDb = dbAs(env, "player-2");
    await expect(
      otherDb.collection("campaigns/c1/characters/char-1/xpProposals").doc("prop-new").set({
        playerId: "player-2",
        description: "Illicit proposal",
        xpCost: 100,
        status: "pending",
        proposedAt: new Date(),
      })
    ).rejects.toThrow();
  });

  it("player cannot create a proposal with mismatched playerId", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createCharacter(env, "c1", "char-1", { userId: "player-1" });

    const playerDb = dbAs(env, "player-1");
    await expect(
      playerDb.collection("campaigns/c1/characters/char-1/xpProposals").doc("prop-new").set({
        playerId: "player-2",
        description: "Spoofed playerId",
        xpCost: 100,
        status: "pending",
        proposedAt: new Date(),
      })
    ).rejects.toThrow();
  });

  it("DM can approve a proposal", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createCharacter(env, "c1", "char-1", { userId: "player-1" });
    await createProposal(env, "c1", "char-1", "prop-1");

    const dmDb = dbAs(env, "dm-1");
    await expect(
      dmDb.collection("campaigns/c1/characters/char-1/xpProposals").doc("prop-1").update({
        status: "approved",
      })
    ).resolves.toBeUndefined();
  });

  it("DM can reject a proposal", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createCharacter(env, "c1", "char-1", { userId: "player-1" });
    await createProposal(env, "c1", "char-1", "prop-1");

    const dmDb = dbAs(env, "dm-1");
    await expect(
      dmDb.collection("campaigns/c1/characters/char-1/xpProposals").doc("prop-1").update({
        status: "rejected",
      })
    ).resolves.toBeUndefined();
  });

  it("player cannot update a proposal", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createCharacter(env, "c1", "char-1", { userId: "player-1" });
    await createProposal(env, "c1", "char-1", "prop-1");

    const playerDb = dbAs(env, "player-1");
    await expect(
      playerDb.collection("campaigns/c1/characters/char-1/xpProposals").doc("prop-1").update({
        status: "approved",
      })
    ).rejects.toThrow();
  });

  it("DM can delete a proposal", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createCharacter(env, "c1", "char-1", { userId: "player-1" });
    await createProposal(env, "c1", "char-1", "prop-1");

    const dmDb = dbAs(env, "dm-1");
    await expect(
      dmDb.collection("campaigns/c1/characters/char-1/xpProposals").doc("prop-1").delete()
    ).resolves.toBeUndefined();
  });

  it("player cannot delete a proposal", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createCharacter(env, "c1", "char-1", { userId: "player-1" });
    await createProposal(env, "c1", "char-1", "prop-1");

    const playerDb = dbAs(env, "player-1");
    await expect(
      playerDb.collection("campaigns/c1/characters/char-1/xpProposals").doc("prop-1").delete()
    ).rejects.toThrow();
  });
});
