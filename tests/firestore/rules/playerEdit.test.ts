// tests/firestore/rules/playerEdit.test.ts

import { describe, it, expect, afterEach } from "vitest";
import { getTestEnv } from "../setup";

describe("Firestore Rules: Player Editing Permissions", () => {

  afterEach(async () => {
    const env = await getTestEnv();
    await env.clearFirestore();
  });

  it("player cannot edit another player's character", async () => {
    const env = await getTestEnv();

    // Admin context: create campaign first with dmId
    await env.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await db.collection("campaigns").doc("test").set({
        dmId: "dm-123",
        name: "Example Campaign"
      });
    });

    const p2 = env.authenticatedContext("player-2");

    // Create character owned by player-1
    await env.withSecurityRulesDisabled(async (context) => {
      await context.firestore()
        .collection("campaigns/test/characters")
        .doc("char1")
        .set({
          userId: "player-1",
          isEditableByPlayer: true,
          name: "Test Character"
        });
    });

    // Player-2 tries to update — MUST FAIL
    await expect(
      p2.firestore()
        .collection("campaigns/test/characters")
        .doc("char1")
        .update({ name: "Hacked Name" })
    ).rejects.toThrow();
  });


  it("DM can edit any character", async () => {
    const env = await getTestEnv();

    // Admin context: create campaign first with dmId
    await env.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await db.collection("campaigns").doc("test").set({
        dmId: "dm-123",
        name: "Example Campaign"
      });
    });

    const dm = env.authenticatedContext("dm-123");

    // Create a character owned by someone else
    await env.withSecurityRulesDisabled(async (context) => {
      await context.firestore()
        .collection("campaigns/test/characters")
        .doc("char2")
        .set({
          userId: "player-5",
          isEditableByPlayer: false,
          name: "Player Character"
        });
    });

    // DM edits successfully
    await expect(
      dm.firestore()
        .collection("campaigns/test/characters")
        .doc("char2")
        .update({ name: "Updated By DM" })
    ).resolves.toBeUndefined();
  });

});
