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

  it("rejects a standalone claim-log create even when its fields look valid", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, characterId, { userId: null });

    await expect(
      dbAs(env, "player-1")
        .collection(logPath)
        .doc("standalone")
        .set(logPayload("claim", "player-1", null, "player-1"))
    ).rejects.toThrow();
  });

  it("allows a player claim log only with the matching ownership transition", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, characterId, { userId: null });

    const playerDb = dbAs(env, "player-1");
    const batch = playerDb.batch();
    batch.update(playerDb.doc(characterPath), { userId: "player-1" });
    batch.update(playerDb.doc(`campaigns/${campaignId}`), { memberIds: ["player-1"] });
    batch.set(
      playerDb.collection(logPath).doc("claim"),
      logPayload("claim", "player-1", null, "player-1")
    );

    await expect(batch.commit()).resolves.toBeUndefined();
  });

  it("allows a player release log only with the matching ownership transition", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, campaignId, "dm-1", { memberIds: ["player-1"] });
    await createCharacter(env, campaignId, characterId, {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    const playerDb = dbAs(env, "player-1");
    const batch = playerDb.batch();
    batch.update(playerDb.doc(characterPath), { userId: null, isEditableByPlayer: false });
    batch.set(
      playerDb.collection(logPath).doc("release"),
      logPayload("release", "player-1", "player-1", null)
    );

    await expect(batch.commit()).resolves.toBeUndefined();
  });

  it("allows DM force ownership logs only with matching transitions", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, campaignId, "dm-1", { memberIds: ["player-1"] });
    await createCharacter(env, campaignId, characterId, {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    const dmDb = dbAs(env, "dm-1");
    const assign = dmDb.batch();
    assign.update(dmDb.doc(characterPath), { userId: "player-2", isEditableByPlayer: true });
    assign.update(dmDb.doc(`campaigns/${campaignId}`), {
      memberIds: ["player-1", "player-2"],
    });
    assign.set(
      dmDb.collection(logPath).doc("assign"),
      logPayload("force-assign", "dm-1", "player-1", "player-2")
    );
    await expect(assign.commit()).resolves.toBeUndefined();

    const release = dmDb.batch();
    release.update(dmDb.doc(characterPath), { userId: null, isEditableByPlayer: false });
    release.set(
      dmDb.collection(logPath).doc("force-release"),
      logPayload("force-release", "dm-1", "player-2", null)
    );
    await expect(release.commit()).resolves.toBeUndefined();
  });

  it("rejects spoofed actors, unexpected fields, and mismatched transitions", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, characterId, { userId: null });

    const playerDb = dbAs(env, "player-1");
    const batch = playerDb.batch();
    batch.update(playerDb.doc(characterPath), { userId: "player-1" });
    batch.set(playerDb.collection(logPath).doc("bad"), {
      ...logPayload("claim", "player-2", null, "player-1"),
      unexpected: true,
    });
    await expect(batch.commit()).rejects.toThrow();
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
