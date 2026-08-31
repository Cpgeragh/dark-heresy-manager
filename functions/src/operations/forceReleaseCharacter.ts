// functions/src/operations/forceReleaseCharacter.ts
//
// Stage 3.3: a DM force-releases a character from its current owner
// (whoever that is, or nobody). Existence is checked fresh inside the
// transaction; the DM permission check happens before opening it.

import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { callerIsPrimaryOrLinked } from "../shared/linkedIdentity.js";
import { applyOwnershipTransition } from "../shared/ownershipTransition.js";

export interface ForceReleaseCharacterInput {
  campaignId: string;
  characterId: string;
  operationId?: string;
}

export async function forceReleaseCharacter(
  input: ForceReleaseCharacterInput,
  callerUid: string
): Promise<void> {
  const db = getFirestore();
  const campaignRef = db.collection("campaigns").doc(input.campaignId);
  const characterRef = campaignRef.collection("characters").doc(input.characterId);

  const campaignSnapshot = await campaignRef.get();
  if (!campaignSnapshot.exists) {
    throw new HttpsError("not-found", "Campaign not found.");
  }
  if (!(await callerIsPrimaryOrLinked(db, callerUid, campaignSnapshot.data()?.dmId))) {
    throw new HttpsError("permission-denied", "Only the campaign DM can force-release a character.");
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
      "force-release",
      callerUid,
      currentOwner,
      null
    );
  // See releaseCharacter.ts: Stage 5.3's membership-removal check widens this
  // transaction's read set, so it gets the same extra retry headroom.
  }, { maxAttempts: 10 });
}
