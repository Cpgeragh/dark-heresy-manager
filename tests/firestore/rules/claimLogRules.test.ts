// tests/firestore/rules/claimLogRules.test.ts

import { describe, it, expect, afterEach } from "vitest";
import { getTestEnv } from "../setup";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import {
  dbAs,
  dbAnon,
  createCampaign,
  createCharacter,
  createClaimLog,
} from "../helpers";

describe("Firestore Rules: ClaimLog Rules", () => {
  const campaignId = "camp1";
  const characterId = "char1";

  // Keep cleanup ONLY in this file
  afterEach(async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await env.clearFirestore();
  });

  async function setupCampaignAndCharacter(env: RulesTestEnvironment) {
    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, characterId, {
      userId: "player-1",
      isEditableByPlayer: true,
    });
  }

  it("DM may read claim logs", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await setupCampaignAndCharacter(env);

    await createClaimLog(env, campaignId, characterId, "log1", {
      action: "claim",
      actorUid: "player-1",
    });

    const dmDb = dbAs(env, "dm-1");

    await expect(
      dmDb
        .collection(
          `campaigns/${campaignId}/characters/${characterId}/claimLog`
        )
        .doc("log1")
        .get()
    ).resolves.toBeDefined();
  });

  it("DM may list all claim logs", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await setupCampaignAndCharacter(env);

    await createClaimLog(env, campaignId, characterId, "log1", {
      action: "claim",
      actorUid: "player-1",
    });
    await createClaimLog(env, campaignId, characterId, "log2", {
      action: "release",
      actorUid: "player-1",
    });

    const dmDb = dbAs(env, "dm-1");

    await expect(
      dmDb
        .collection(
          `campaigns/${campaignId}/characters/${characterId}/claimLog`
        )
        .get()
    ).resolves.toBeDefined();
  });

  it("player cannot read claim logs", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await setupCampaignAndCharacter(env);

    await createClaimLog(env, campaignId, characterId, "log1", {
      action: "claim",
      actorUid: "player-1",
    });

    const playerDb = dbAs(env, "player-1");

    await expect(
      playerDb
        .collection(
          `campaigns/${campaignId}/characters/${characterId}/claimLog`
        )
        .doc("log1")
        .get()
    ).rejects.toThrow();
  });

  it("player cannot list claim logs", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await setupCampaignAndCharacter(env);

    await createClaimLog(env, campaignId, characterId, "log1", {
      action: "claim",
      actorUid: "player-1",
    });

    const playerDb = dbAs(env, "player-1");

    await expect(
      playerDb
        .collection(
          `campaigns/${campaignId}/characters/${characterId}/claimLog`
        )
        .get()
    ).rejects.toThrow();
  });

  it("unauthenticated users cannot read claim logs", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await setupCampaignAndCharacter(env);

    await createClaimLog(env, campaignId, characterId, "log1", {
      action: "claim",
      actorUid: "player-1",
    });

    const anonDb = dbAnon(env);

    await expect(
      anonDb
        .collection(
          `campaigns/${campaignId}/characters/${characterId}/claimLog`
        )
        .doc("log1")
        .get()
    ).rejects.toThrow();
  });

  it("player may create claim logs for themselves (claim)", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await setupCampaignAndCharacter(env);

    const playerDb = dbAs(env, "player-1");

    await expect(
      playerDb
        .collection(
          `campaigns/${campaignId}/characters/${characterId}/claimLog`
        )
        .doc("log2")
        .set({
          action: "claim",
          actorUid: "player-1",
        })
    ).resolves.toBeUndefined();
  });

  it("player may create claim logs for themselves (release)", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await setupCampaignAndCharacter(env);

    const playerDb = dbAs(env, "player-1");

    await expect(
      playerDb
        .collection(
          `campaigns/${campaignId}/characters/${characterId}/claimLog`
        )
        .doc("log3")
        .set({
          action: "release",
          actorUid: "player-1",
        })
    ).resolves.toBeUndefined();
  });

  it("player cannot create logs for OTHER users", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await setupCampaignAndCharacter(env);

    const playerDb = dbAs(env, "player-2");

    await expect(
      playerDb
        .collection(
          `campaigns/${campaignId}/characters/${characterId}/claimLog`
        )
        .doc("log4")
        .set({
          action: "claim",
          actorUid: "player-1", // mismatched
        })
    ).rejects.toThrow();
  });

  it("player cannot create force-assign or force-release logs", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await setupCampaignAndCharacter(env);

    const playerDb = dbAs(env, "player-1");

    await expect(
      playerDb
        .collection(
          `campaigns/${campaignId}/characters/${characterId}/claimLog`
        )
        .doc("log5")
        .set({
          action: "force-assign",
          actorUid: "player-1",
        })
    ).rejects.toThrow();

    await expect(
      playerDb
        .collection(
          `campaigns/${campaignId}/characters/${characterId}/claimLog`
        )
        .doc("log6")
        .set({
          action: "force-release",
          actorUid: "player-1",
        })
    ).rejects.toThrow();
  });

  it("DM can create logs with any valid action", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await setupCampaignAndCharacter(env);

    const dmDb = dbAs(env, "dm-1");
    const col = dmDb.collection(
      `campaigns/${campaignId}/characters/${characterId}/claimLog`
    );

    for (const action of ["claim", "release", "force-assign", "force-release"]) {
      // eslint-disable-next-line no-await-in-loop
      await expect(
        col.doc(`dm-${action}`).set({
          action,
          actorUid: "dm-1",
        })
      ).resolves.toBeUndefined();
    }
  });

  it("DM cannot create a log without an action field (invalidAction)", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await setupCampaignAndCharacter(env);

    const dmDb = dbAs(env, "dm-1");

    // No "action" key; validAction() will fail or be false → rules deny
    await expect(
      dmDb
        .collection(
          `campaigns/${campaignId}/characters/${characterId}/claimLog`
        )
        .doc("no-action")
        .set({
          actorUid: "dm-1",
        })
    ).rejects.toThrow();
  });

  it("invalid actions are rejected even for DM", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await setupCampaignAndCharacter(env);

    const dmDb = dbAs(env, "dm-1");

    await expect(
      dmDb
        .collection(
          `campaigns/${campaignId}/characters/${characterId}/claimLog`
        )
        .doc("invalid-log")
        .set({
          action: "invalid-action",
          actorUid: "dm-1",
        })
    ).rejects.toThrow();
  });

  it("claim logs are immutable: no one can update or delete logs", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await setupCampaignAndCharacter(env);

    await createClaimLog(env, campaignId, characterId, "immutable-log", {
      action: "claim",
      actorUid: "player-1",
    });

    const dmDb = dbAs(env, "dm-1");
    const playerDb = dbAs(env, "player-1");

    const dmDoc = dmDb
      .collection(
        `campaigns/${campaignId}/characters/${characterId}/claimLog`
      )
      .doc("immutable-log");
    const playerDoc = playerDb
      .collection(
        `campaigns/${campaignId}/characters/${characterId}/claimLog`
      )
      .doc("immutable-log");

    // DM cannot update or delete
    await expect(dmDoc.update({ action: "release" })).rejects.toThrow();
    await expect(dmDoc.delete()).rejects.toThrow();

    // Player cannot update or delete
    await expect(playerDoc.update({ action: "release" })).rejects.toThrow();
    await expect(playerDoc.delete()).rejects.toThrow();
  });
});