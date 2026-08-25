// tests/functions/ownershipOperations.test.ts
import { describe, it, expect, afterAll } from "vitest";
import { httpsCallable } from "firebase/functions";
import { deleteApp } from "firebase/app";
import { initializeApp as initializeAdminApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getTestFunctions, signInTestUser, teardownTestFunctions, createIndependentClient } from "./setup";

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
if (!getApps().length) {
  initializeAdminApp({ projectId: "dh-test" });
}
const adminDb = getFirestore();

describe("Functions: ownership operations", () => {
  afterAll(async () => {
    await teardownTestFunctions();
  });

  it(
    "releaseCharacter: the owning player releases their own character",
    async () => {
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
    },
    15000
  );

  it(
    "forceReleaseCharacter: the DM releases a player's character",
    async () => {
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
    },
    15000
  );

  it(
    "forceAssignCharacter: the DM assigns a character to a target player and adds them to membership",
    async () => {
      const dmUid = await signInTestUser();
      const campaignRef = adminDb.collection("campaigns").doc();
      const characterRef = campaignRef.collection("characters").doc();
      await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });
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
    },
    15000
  );

  it(
    "a player's release and a DM's force-assign racing on the same character both resolve safely to one consistent final owner",
    async () => {
      const player = await createIndependentClient("release-race-player");
      const dm = await createIndependentClient("release-race-dm");
      const campaignRef = adminDb.collection("campaigns").doc();
      const characterRef = campaignRef.collection("characters").doc();
      await campaignRef.set({ dmId: dm.uid, name: "Test Campaign", memberIds: [player.uid] });
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

        const [releaseResult] = await Promise.allSettled([
          releaseCharacter({ campaignId: campaignRef.id, characterId: characterRef.id }),
          forceAssignCharacter({
            campaignId: campaignRef.id,
            characterId: characterRef.id,
            targetUid: "target-player",
          }),
        ]);

        // force-assign is unconditional, so the character always ends up
        // owned by the target regardless of which call actually commits
        // first — the only thing that varies with timing is whether the
        // player's release call itself succeeds (it won the race) or is
        // correctly rejected for no longer owning the character (it lost).
        const characterSnapshot = await characterRef.get();
        expect(characterSnapshot.data()?.userId).toBe("target-player");

        if (releaseResult.status === "rejected") {
          expect(releaseResult.reason).toMatchObject({ code: "functions/permission-denied" });
        }
      } finally {
        await deleteApp(player.app);
        await deleteApp(dm.app);
      }
    },
    15000
  );
});
