import { afterEach, describe, expect, it } from "vitest";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { getTestEnv } from "../setup";
import { createCampaign, createCharacter, dbAs } from "../helpers";

describe("Firestore Rules: Player Editing Permissions", () => {
  afterEach(async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await env.clearFirestore();
  });

  it("player cannot edit another player's character", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, "test", "dm-123");
    await createCharacter(env, "test", "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    await expect(
      dbAs(env, "player-2")
        .collection("campaigns/test/characters")
        .doc("char1")
        .update({ backgroundComplete: true })
    ).rejects.toThrow();
  });

  it("DM can edit a structurally valid character", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, "test", "dm-123");
    await createCharacter(env, "test", "char2", {
      userId: "player-5",
      isEditableByPlayer: false,
    });

    await expect(
      dbAs(env, "dm-123")
        .collection("campaigns/test/characters")
        .doc("char2")
        .update({ backgroundComplete: true })
    ).resolves.toBeUndefined();
  });
});
