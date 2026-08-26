import { afterEach, describe, expect, it } from "vitest";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { getTestEnv } from "../setup";
import { createCampaign, createCharacter, createClaimLog, dbAs } from "../helpers";

const campaignId = "camp1";
const characterId = "char1";
const characterPath = `campaigns/${campaignId}/characters/${characterId}`;
const logPath = `${characterPath}/claimLog`;

function logPayload(
  action: "claim" | "release" | "force-assign" | "force-release",
  actorUid: string,
  previousOwnerUid: string | null,
  newOwnerUid: string | null
) {
  return { action, actorUid, previousOwnerUid, newOwnerUid, timestamp: new Date() };
}

describe("Firestore Rules: ClaimLog Rules", () => {
  afterEach(async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await env.clearFirestore();
  });

  it("allows only the DM to get and bounded-list claim history", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, characterId, { userId: "player-1" });
    await createClaimLog(
      env,
      campaignId,
      characterId,
      "log1",
      logPayload("claim", "player-1", null, "player-1")
    );

    const dmDb = dbAs(env, "dm-1");
    const playerDb = dbAs(env, "player-1");
    await expect(dmDb.collection(logPath).doc("log1").get()).resolves.toBeDefined();
    await expect(dmDb.collection(logPath).limit(440).get()).resolves.toBeDefined();
    await expect(dmDb.collection(logPath).get()).rejects.toThrow();
    await expect(playerDb.collection(logPath).doc("log1").get()).rejects.toThrow();
  });

  it("rejects any claimLog create — writes are server-side only now", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, characterId, { userId: null });

    await expect(
      dbAs(env, "player-1")
        .collection(logPath)
        .doc("claim")
        .set(logPayload("claim", "player-1", null, "player-1"))
    ).rejects.toThrow();

    await expect(
      dbAs(env, "dm-1")
        .collection(logPath)
        .doc("force-assign")
        .set(logPayload("force-assign", "dm-1", "player-1", "player-2"))
    ).rejects.toThrow();
  });

  it("keeps logs immutable and permits deletion only with character deletion", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, characterId, { userId: "player-1" });
    await createClaimLog(
      env,
      campaignId,
      characterId,
      "log1",
      logPayload("claim", "player-1", null, "player-1")
    );

    const dmDb = dbAs(env, "dm-1");
    await expect(
      dmDb.collection(logPath).doc("log1").update({ action: "release" })
    ).rejects.toThrow();
    await expect(dmDb.collection(logPath).doc("log1").delete()).rejects.toThrow();

    const batch = dmDb.batch();
    batch.delete(dmDb.collection(logPath).doc("log1"));
    batch.delete(dmDb.doc(characterPath));
    await expect(batch.commit()).resolves.toBeUndefined();
  });
});
