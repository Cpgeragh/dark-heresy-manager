import { afterEach, describe, expect, it } from "vitest";
import { getTestEnv } from "../setup";
import { createRecoveryIndexEntry, dbAnon, dbAs } from "../helpers";

const indexId = "hmac-derived-index-id";
const indexData = { campaignId: "c1", characterId: "char1" };

describe("Firestore Rules: Recovery Index", () => {
  afterEach(async () => {
    const env = await getTestEnv();
    await env.clearFirestore();
  });

  it("denies exact reads and collection queries to every client", async () => {
    const env = await getTestEnv();
    await createRecoveryIndexEntry(env, indexId, indexData);

    await expect(
      dbAs(env, "dm-1").collection("recoveryIndex").doc(indexId).get()
    ).rejects.toThrow();
    await expect(
      dbAs(env, "user-1").collection("recoveryIndex").doc(indexId).get()
    ).rejects.toThrow();
    await expect(dbAs(env, "user-1").collection("recoveryIndex").get()).rejects.toThrow();
    await expect(dbAnon(env).collection("recoveryIndex").doc(indexId).get()).rejects.toThrow();
  });

  it("denies index creation to authenticated and anonymous clients", async () => {
    const env = await getTestEnv();

    await expect(
      dbAs(env, "dm-1").collection("recoveryIndex").doc(indexId).set(indexData)
    ).rejects.toThrow();
    await expect(
      dbAs(env, "player-1").collection("recoveryIndex").doc(indexId).set(indexData)
    ).rejects.toThrow();
    await expect(
      dbAnon(env).collection("recoveryIndex").doc(indexId).set(indexData)
    ).rejects.toThrow();
  });

  it("denies index updates and deletions to every client", async () => {
    const env = await getTestEnv();
    await createRecoveryIndexEntry(env, indexId, indexData);

    await expect(
      dbAs(env, "dm-1").collection("recoveryIndex").doc(indexId).update({
        characterId: "other",
      })
    ).rejects.toThrow();
    await expect(
      dbAs(env, "dm-1").collection("recoveryIndex").doc(indexId).delete()
    ).rejects.toThrow();
    await expect(
      dbAs(env, "player-1").collection("recoveryIndex").doc(indexId).delete()
    ).rejects.toThrow();
  });
});
