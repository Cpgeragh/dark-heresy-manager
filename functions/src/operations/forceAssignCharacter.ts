// functions/src/operations/forceAssignCharacter.ts
//
// A DM assigns an unclaimed character to an existing campaign
// member, bypassing the Recovery Code flow for that additional character.
// Existence and assignment preconditions are checked fresh inside the
// transaction; the DM permission check happens before opening it.

import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { callerIsPrimaryOrLinked } from "../shared/linkedIdentity.js";
import { applyOwnershipTransition } from "../shared/ownershipTransition.js";

export interface ForceAssignCharacterInput {
  campaignId: string;
  characterId: string;
  targetUid: string;
  operationId?: string;
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
  if (!(await callerIsPrimaryOrLinked(db, callerUid, campaignSnapshot.data()?.dmId))) {
    throw new HttpsError("permission-denied", "Only the campaign DM can force-assign a character.");
  }

  await db.runTransaction(async (transaction) => {
    const freshCampaignSnapshot = await transaction.get(campaignRef);
    const memberIds = (freshCampaignSnapshot.data()?.memberIds as string[] | undefined) ?? [];
    if (!memberIds.includes(input.targetUid)) {
      throw new HttpsError(
        "failed-precondition",
        "The selected player is no longer a member of this campaign."
      );
    }

    const characterSnapshot = await transaction.get(characterRef);
    if (!characterSnapshot.exists) {
      throw new HttpsError("not-found", "Character not found.");
    }
    const currentOwner = (characterSnapshot.data()?.userId as string | null | undefined) ?? null;
    if (currentOwner !== null) {
      throw new HttpsError(
        "failed-precondition",
        "This character is already assigned. Release it before assigning another player."
      );
    }

    await applyOwnershipTransition(
      transaction,
      campaignRef,
      characterRef,
      "force-assign",
      callerUid,
      null,
      input.targetUid,
      { newOwnerAlreadyMember: true }
    );
  // See releaseCharacter.ts: Stage 5.3's membership-removal check widens this
  // transaction's read set, so it gets the same extra retry headroom.
  }, { maxAttempts: 10 });
}
