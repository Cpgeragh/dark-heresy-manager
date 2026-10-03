import { afterEach, describe, expect, it } from "vitest";
import type { RulesTestContext } from "@firebase/rules-unit-testing";
import { createCampaign, createCharacter, dbAs } from "../helpers";
import { getTestEnv } from "../setup";

const campaignId = "camp1";
const characterId = "char1";
const historyPath = `campaigns/${campaignId}/characters/${characterId}/xpHistory`;

const entry = {
  amountXp: 200,
  balanceXp: 1_200,
  reason: "Recovered the relic",
  source: "session-award",
  actorUid: "dm-1",
  actorRole: "dm",
  createdAt: new Date(),
};

async function seedHistory() {
  const env = await getTestEnv();
  await env.withSecurityRulesDisabled(async (context: RulesTestContext) => {
    await context.firestore().collection(historyPath).doc("entry-1").set(entry);
  });
}

describe("Firestore Rules: XP History", () => {
  afterEach(async () => {
    const env = await getTestEnv();
    await env.clearFirestore();
  });

  it("allows the owning player and DM to read bounded history", async () => {
    const env = await getTestEnv();
    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, characterId, { userId: "player-1" });
    await seedHistory();

    const dmDb = dbAs(env, "dm-1");
    const playerDb = dbAs(env, "player-1");
    await expect(dmDb.collection(historyPath).doc("entry-1").get()).resolves.toBeDefined();
    await expect(playerDb.collection(historyPath).doc("entry-1").get()).resolves.toBeDefined();
    await expect(playerDb.collection(historyPath).limit(100).get()).resolves.toBeDefined();
  });

  it("rejects outsiders and unbounded or oversized history queries", async () => {
    const env = await getTestEnv();
    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, characterId, { userId: "player-1" });
    await seedHistory();

    await expect(
      dbAs(env, "outsider").collection(historyPath).doc("entry-1").get()
    ).rejects.toThrow();
    await expect(dbAs(env, "player-1").collection(historyPath).get()).rejects.toThrow();
    await expect(dbAs(env, "player-1").collection(historyPath).limit(101).get()).rejects.toThrow();
  });

  it("rejects direct history creation, editing and deletion for players and DMs", async () => {
    const env = await getTestEnv();
    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, characterId, { userId: "player-1" });
    await seedHistory();

    const playerDb = dbAs(env, "player-1");
    const dmDb = dbAs(env, "dm-1");
    await expect(playerDb.collection(historyPath).doc("new-entry").set(entry)).rejects.toThrow();
    await expect(
      dmDb.collection(historyPath).doc("entry-1").update({ reason: "Changed" })
    ).rejects.toThrow();
    await expect(dmDb.collection(historyPath).doc("entry-1").delete()).rejects.toThrow();
  });
});
