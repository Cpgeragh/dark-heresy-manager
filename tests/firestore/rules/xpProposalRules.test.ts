import { afterEach, describe, expect, it } from "vitest";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { getTestEnv } from "../setup";
import { createCampaign, createCharacter, dbAs } from "../helpers";

const characterPath = "campaigns/c1/characters/char-1";
const proposalsPath = `${characterPath}/xpProposals`;

async function setup(env: RulesTestEnvironment) {
  await createCampaign(env, "c1", "dm-1", { memberIds: ["player-1"] });
  await createCharacter(env, "c1", "char-1", { userId: "player-1" });
  await env.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().collection(proposalsPath).doc("prop-1").set({
      playerId: "player-1",
      description: "Legacy proposal",
      xpCost: 100,
      status: "pending",
      proposedAt: new Date(),
    });
  });
}

describe("Firestore Rules: closed XP proposal surface", () => {
  afterEach(async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await env.clearFirestore();
  });

  it("allows the DM and character owner to get legacy proposals", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await setup(env);

    await expect(
      dbAs(env, "dm-1").collection(proposalsPath).doc("prop-1").get()
    ).resolves.toBeDefined();
    await expect(
      dbAs(env, "player-1").collection(proposalsPath).doc("prop-1").get()
    ).resolves.toBeDefined();
    await expect(
      dbAs(env, "player-2").collection(proposalsPath).doc("prop-1").get()
    ).rejects.toThrow();
  });

  it("requires a bounded query for legacy proposal cleanup reads", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await setup(env);

    const dmProposals = dbAs(env, "dm-1").collection(proposalsPath);
    await expect(dmProposals.limit(440).get()).resolves.toBeDefined();
    await expect(dmProposals.get()).rejects.toThrow();
    await expect(dmProposals.limit(441).get()).rejects.toThrow();
  });

  it("rejects all direct proposal creates and updates", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await setup(env);

    const payload = {
      playerId: "player-1",
      description: "Standalone write",
      xpCost: 100,
      status: "pending",
      proposedAt: new Date(),
    };
    await expect(
      dbAs(env, "player-1").collection(proposalsPath).doc("new").set(payload)
    ).rejects.toThrow();
    await expect(
      dbAs(env, "dm-1").collection(proposalsPath).doc("new-dm").set(payload)
    ).rejects.toThrow();
    await expect(
      dbAs(env, "dm-1").collection(proposalsPath).doc("prop-1").update({ status: "approved" })
    ).rejects.toThrow();
  });

  it("allows DM deletion only as part of deleting the character", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await setup(env);

    const dmDb = dbAs(env, "dm-1");
    await expect(dmDb.collection(proposalsPath).doc("prop-1").delete()).rejects.toThrow();

    const batch = dmDb.batch();
    batch.delete(dmDb.collection(proposalsPath).doc("prop-1"));
    batch.delete(dmDb.doc(characterPath));
    await expect(batch.commit()).resolves.toBeUndefined();
  });
});
