import { afterEach, describe, expect, it } from "vitest";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { getTestEnv } from "../setup";
import {
  createCampaign,
  createCharacter,
  dbAs,
  validCampaignDocument,
  validCharacterDocument,
} from "../helpers";

describe("Firestore Rules: Batch Operations", () => {
  afterEach(async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await env.clearFirestore();
  });

  it("allows a DM to create multiple valid campaigns in one batch", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    const dmDb = dbAs(env, "dm-1");
    const batch = dmDb.batch();
    for (const id of ["c1", "c2", "c3"]) {
      batch.set(dmDb.collection("campaigns").doc(id), validCampaignDocument("dm-1", id));
    }
    await expect(batch.commit()).resolves.toBeUndefined();
  });

  it("rejects the whole batch when one campaign has an invalid shape", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    const dmDb = dbAs(env, "dm-1");
    const batch = dmDb.batch();
    batch.set(dmDb.collection("campaigns").doc("valid"), validCampaignDocument("dm-1"));
    batch.set(dmDb.collection("campaigns").doc("invalid"), { name: "Missing owner" });
    await expect(batch.commit()).rejects.toThrow();
  });

  it("allows a DM to update multiple valid campaigns in one batch", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createCampaign(env, "c2", "dm-1");
    const dmDb = dbAs(env, "dm-1");
    const batch = dmDb.batch();
    batch.update(dmDb.collection("campaigns").doc("c1"), { name: "Updated 1" });
    batch.update(dmDb.collection("campaigns").doc("c2"), { name: "Updated 2" });
    await expect(batch.commit()).resolves.toBeUndefined();
  });

  it("allows multiple code-less characters to be created in one batch", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    const dmDb = dbAs(env, "dm-1");
    const batch = dmDb.batch();

    for (const id of ["char1", "char2"]) {
      batch.set(
        dmDb.collection("campaigns/c1/characters").doc(id),
        validCharacterDocument("c1", "")
      );
    }
    await expect(batch.commit()).resolves.toBeUndefined();
  });

  it("rejects a player batch containing another player's character update", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createCharacter(env, "c1", "char1", { userId: "player-1", isEditableByPlayer: true });
    await createCharacter(env, "c1", "char2", { userId: "player-2", isEditableByPlayer: true });

    const playerDb = dbAs(env, "player-1");
    const batch = playerDb.batch();
    batch.update(playerDb.collection("campaigns/c1/characters").doc("char1"), {
      armour: [],
    });
    batch.update(playerDb.collection("campaigns/c1/characters").doc("char2"), {
      armour: [],
    });
    await expect(batch.commit()).rejects.toThrow();
  });
});
