import { afterEach, describe, expect, it } from "vitest";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { getTestEnv } from "../setup";
import { createCampaign, createCharacter, createRecoveryIndexEntry, dbAs } from "../helpers";

describe("Firestore Rules: Recovery Index abuse resistance", () => {
  afterEach(async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await env.clearFirestore();
  });

  it("does not allow a second code to be attached to the same character", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createCharacter(env, "c1", "char1", { recoveryCode: "DH-ONEE-0001" });

    const index = dbAs(env, "dm-1").collection("recoveryIndex");
    await expect(index.doc("DH-ONEE-0001").set({ campaignId: "c1", characterId: "char1" })).resolves.toBeUndefined();
    await expect(index.doc("DH-TWOO-0002").set({ campaignId: "c1", characterId: "char1" })).rejects.toThrow();
  });

  it("does not allow one DM to repoint another campaign's code", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createCharacter(env, "c1", "char1", { recoveryCode: "DH-LOCK-0001" });
    await createRecoveryIndexEntry(env, "DH-LOCK-0001", { campaignId: "c1", characterId: "char1" });

    await expect(
      dbAs(env, "dm-2").collection("recoveryIndex").doc("DH-LOCK-0001").set({
        campaignId: "c2",
        characterId: "char2",
      })
    ).rejects.toThrow();
  });

  it("denies all Recovery Index queries, including filtered or bounded queries", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createRecoveryIndexEntry(env, "DH-LIST-0001", { campaignId: "c1", characterId: "char1" });

    await expect(
      dbAs(env, "user-1")
        .collection("recoveryIndex")
        .where("campaignId", "==", "c1")
        .limit(1)
        .get()
    ).rejects.toThrow();
  });
});
