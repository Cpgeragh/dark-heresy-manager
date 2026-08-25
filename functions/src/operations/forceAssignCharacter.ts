// functions/src/operations/forceAssignCharacter.ts
//
// Stage 3.3: a DM force-assigns a character directly to a target player,
// bypassing the Recovery Code flow entirely. Existence is checked fresh
// inside the transaction; the DM permission check happens before opening
// it.

import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { applyOwnershipTransition } from "../shared/ownershipTransition.js";

export interface ForceAssignCharacterInput {
  campaignId: string;
  characterId: string;
  targetUid: string;
}

export async function forceAssignCharacter(
  input: ForceAssignCharacterInput,
  callerUid: string
): Promise<void> {
  const db = getFirestore();
  const campaignRef = db.collection("campaigns").doc(input.campaignId);
  const characterRef = campaignRef.collection("characters").doc(input.characterId);

  const campaignSnapshot = await campaignRef.get();
  if (!campaignSnapshot.exists) {
    throw new HttpsError("not-found", "Campaign not found.");
  }
  if (campaignSnapshot.data()?.dmId !== callerUid) {
    throw new HttpsError("permission-denied", "Only the campaign DM can force-assign a character.");
  }

  await db.runTransaction(async (transaction) => {
    const characterSnapshot = await transaction.get(characterRef);
    if (!characterSnapshot.exists) {
      throw new HttpsError("not-found", "Character not found.");
    }
    const currentOwner = (characterSnapshot.data()?.userId as string | null | undefined) ?? null;

    await applyOwnershipTransition(
      transaction,
      campaignRef,
      characterRef,
      "force-assign",
      callerUid,
      currentOwner,
      input.targetUid
    );
  // See releaseCharacter.ts: Stage 5.3's membership-removal check widens this
  // transaction's read set, so it gets the same extra retry headroom.
  }, { maxAttempts: 10 });
}
