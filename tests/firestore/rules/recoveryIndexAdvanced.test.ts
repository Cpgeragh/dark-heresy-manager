import { afterEach, describe, expect, it } from "vitest";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { getTestEnv } from "../setup";
import { createRecoveryIndexEntry, dbAs } from "../helpers";

describe("Firestore Rules: Recovery Index abuse resistance", () => {
  afterEach(async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await env.clearFirestore();
  });

  it("denies writes even when the index payload looks valid", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    const index = dbAs(env, "dm-1").collection("recoveryIndex");
    await expect(
      index.doc("hmac-derived-index-id").set({ campaignId: "c1", characterId: "char1" })
    ).rejects.toThrow();
  });

  it("denies attempts to overwrite an existing server-created index", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    const indexId = "hmac-derived-index-id";
    await createRecoveryIndexEntry(env, indexId, { campaignId: "c1", characterId: "char1" });

    await expect(
      dbAs(env, "dm-2").collection("recoveryIndex").doc(indexId).set({
        campaignId: "c2",
        characterId: "char2",
      })
    ).rejects.toThrow();
  });

  it("denies all Recovery Index queries, including filtered or bounded queries", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createRecoveryIndexEntry(env, "hmac-derived-index-id", { campaignId: "c1", characterId: "char1" });

    await expect(
      dbAs(env, "user-1")
        .collection("recoveryIndex")
        .where("campaignId", "==", "c1")
        .limit(1)
        .get()
    ).rejects.toThrow();
  });
});
