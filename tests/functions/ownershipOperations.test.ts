// tests/functions/ownershipOperations.test.ts
import { describe, it, expect, afterAll } from "vitest";
import { httpsCallable } from "firebase/functions";
import { deleteApp } from "firebase/app";
import { initializeApp as initializeAdminApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import {
  getTestFunctions,
  signInTestUser,
  teardownTestFunctions,
  createIndependentClient,
} from "./setup";

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
if (!getApps().length) {
  initializeAdminApp({ projectId: "dh-test" });
}
const adminDb = getFirestore();

describe("Functions: ownership operations", () => {
  afterAll(async () => {
    await teardownTestFunctions();
  });

  it("releaseCharacter: the owning player releases their own character", async () => {
    const playerUid = await signInTestUser();
    const campaignRef = adminDb.collection("campaigns").doc();
    const characterRef = campaignRef.collection("characters").doc();
    await campaignRef.set({ dmId: "some-dm", name: "Test Campaign", memberIds: [playerUid] });
    await characterRef.set({ campaignId: campaignRef.id, userId: playerUid });

    const releaseCharacter = httpsCallable<{ campaignId: string; characterId: string }, void>(
      getTestFunctions(),
      "releaseCharacter"
    );
    await releaseCharacter({ campaignId: campaignRef.id, characterId: characterRef.id });

    const characterSnapshot = await characterRef.get();
    expect(characterSnapshot.data()?.userId).toBeNull();

    const campaignSnapshot = await campaignRef.get();
    expect(campaignSnapshot.data()?.memberIds).not.toContain(playerUid);
  }, 15000);

  it("releaseCharacter: keeps membership when the player still owns another character in the campaign", async () => {
    const playerUid = await signInTestUser();
    const campaignRef = adminDb.collection("campaigns").doc();
    const releasedCharacterRef = campaignRef.collection("characters").doc();
    const otherCharacterRef = campaignRef.collection("characters").doc();
    await campaignRef.set({ dmId: "some-dm", name: "Test Campaign", memberIds: [playerUid] });
    await releasedCharacterRef.set({ campaignId: campaignRef.id, userId: playerUid });
    await otherCharacterRef.set({ campaignId: campaignRef.id, userId: playerUid });

    const releaseCharacter = httpsCallable<{ campaignId: string; characterId: string }, void>(
      getTestFunctions(),
      "releaseCharacter"
    );
    await releaseCharacter({ campaignId: campaignRef.id, characterId: releasedCharacterRef.id });

    const campaignSnapshot = await campaignRef.get();
    expect(campaignSnapshot.data()?.memberIds).toContain(playerUid);
  }, 15000);

  it("releaseCharacter: a later release after the character is claimed again is not replayed as stale success", async () => {
    const playerUid = await signInTestUser();
    const campaignRef = adminDb.collection("campaigns").doc();
    const characterRef = campaignRef.collection("characters").doc();
    await campaignRef.set({ dmId: "some-dm", name: "Test Campaign", memberIds: [playerUid] });
    await characterRef.set({ campaignId: campaignRef.id, userId: playerUid });

    const releaseCharacter = httpsCallable<
      { campaignId: string; characterId: string; operationId: string },
      void
    >(getTestFunctions(), "releaseCharacter");

    await releaseCharacter({
      campaignId: campaignRef.id,
      characterId: characterRef.id,
      operationId: "first-release",
    });

    await characterRef.update({ userId: playerUid, isEditableByPlayer: true });
    await campaignRef.update({ memberIds: [playerUid] });

    await releaseCharacter({
      campaignId: campaignRef.id,
      characterId: characterRef.id,
      operationId: "second-release",
    });

    expect((await characterRef.get()).data()?.userId).toBeNull();
    expect((await campaignRef.get()).data()?.memberIds).not.toContain(playerUid);
  }, 20000);

  it("forceReleaseCharacter: the DM releases a player's character", async () => {
    const dmUid = await signInTestUser();
    const campaignRef = adminDb.collection("campaigns").doc();
    const characterRef = campaignRef.collection("characters").doc();
    await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: ["some-player"] });
    await characterRef.set({ campaignId: campaignRef.id, userId: "some-player" });

    const forceReleaseCharacter = httpsCallable<{ campaignId: string; characterId: string }, void>(
      getTestFunctions(),
      "forceReleaseCharacter"
    );
    await forceReleaseCharacter({ campaignId: campaignRef.id, characterId: characterRef.id });

    const characterSnapshot = await characterRef.get();
    expect(characterSnapshot.data()?.userId).toBeNull();

    const campaignSnapshot = await campaignRef.get();
    expect(campaignSnapshot.data()?.memberIds).not.toContain("some-player");
  }, 15000);

  it("forceAssignCharacter: the DM assigns a character to a target player and adds them to membership", async () => {
    const dmUid = await signInTestUser();
    const campaignRef = adminDb.collection("campaigns").doc();
    const characterRef = campaignRef.collection("characters").doc();
    await campaignRef.set({
      dmId: dmUid,
      name: "Test Campaign",
      memberIds: ["target-player"],
    });
    await characterRef.set({ campaignId: campaignRef.id, userId: null });

    const forceAssignCharacter = httpsCallable<
      { campaignId: string; characterId: string; targetUid: string },
      void
    >(getTestFunctions(), "forceAssignCharacter");
    await forceAssignCharacter({
      campaignId: campaignRef.id,
      characterId: characterRef.id,
      targetUid: "target-player",
    });

    const characterSnapshot = await characterRef.get();
    expect(characterSnapshot.data()?.userId).toBe("target-player");

    const campaignSnapshot = await campaignRef.get();
    expect(campaignSnapshot.data()?.memberIds).toContain("target-player");
  }, 15000);

  it("forceAssignCharacter: an already claimed character must be released before assignment", async () => {
    const dmUid = await signInTestUser();
    const campaignRef = adminDb.collection("campaigns").doc();
    const characterRef = campaignRef.collection("characters").doc();
    await campaignRef.set({
      dmId: dmUid,
      name: "Test Campaign",
      memberIds: ["old-player", "new-player"],
    });
    await characterRef.set({ campaignId: campaignRef.id, userId: "old-player" });

    const forceAssignCharacter = httpsCallable<
      { campaignId: string; characterId: string; targetUid: string },
      void
    >(getTestFunctions(), "forceAssignCharacter");
    await expect(
      forceAssignCharacter({
        campaignId: campaignRef.id,
        characterId: characterRef.id,
        targetUid: "new-player",
      })
    ).rejects.toMatchObject({ code: "functions/failed-precondition" });

    const campaignSnapshot = await campaignRef.get();
    expect((await characterRef.get()).data()?.userId).toBe("old-player");
    expect(campaignSnapshot.data()?.memberIds).toContain("old-player");
    expect(campaignSnapshot.data()?.memberIds).toContain("new-player");
  }, 15000);

  it("a player's release and a DM's force-assign racing on the same character both resolve safely to one consistent final state", async () => {
    const player = await createIndependentClient("release-race-player");
    const dm = await createIndependentClient("release-race-dm");
    const campaignRef = adminDb.collection("campaigns").doc();
    const characterRef = campaignRef.collection("characters").doc();
    await campaignRef.set({
      dmId: dm.uid,
      name: "Test Campaign",
      memberIds: [player.uid, "target-player"],
    });
    await characterRef.set({ campaignId: campaignRef.id, userId: player.uid });

    try {
      const releaseCharacter = httpsCallable<{ campaignId: string; characterId: string }, void>(
        player.functions,
        "releaseCharacter"
      );
      const forceAssignCharacter = httpsCallable<
        { campaignId: string; characterId: string; targetUid: string },
        void
      >(dm.functions, "forceAssignCharacter");

      const [releaseResult, forceAssignResult] = await Promise.allSettled([
        releaseCharacter({ campaignId: campaignRef.id, characterId: characterRef.id }),
        forceAssignCharacter({
          campaignId: campaignRef.id,
          characterId: characterRef.id,
          targetUid: "target-player",
        }),
      ]);

      const characterSnapshot = await characterRef.get();
      const campaignSnapshot = await campaignRef.get();

      if (forceAssignResult.status === "fulfilled") {
        // The release committed first, leaving the character unclaimed, so
        // the retried assignment could then commit for the existing member.
        expect(characterSnapshot.data()?.userId).toBe("target-player");
        expect(campaignSnapshot.data()?.memberIds).toContain("target-player");
        expect(releaseResult.status).toBe("fulfilled");
      } else {
        // Assignment observed an existing owner and was correctly refused;
        // the player's release still completes normally.
        expect(releaseResult.status).toBe("fulfilled");
        expect(characterSnapshot.data()?.userId).toBeNull();
        expect(campaignSnapshot.data()?.memberIds).not.toContain(player.uid);
      }
    } finally {
      await deleteApp(player.app);
      await deleteApp(dm.app);
    }
  }, 30000);
});
