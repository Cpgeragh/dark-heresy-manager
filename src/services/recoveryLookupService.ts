import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { campaignDocRef, characterDocRef } from "../firebase/converters";
import type { RecoveryIndexDocument } from "../types/Firestore";
import type { OwnershipState, RecoveryLookupResult } from "../types/Recovery";

export type RecoveryLookupOutcome =
  | { status: "found"; result: RecoveryLookupResult }
  | { status: "not-found" }
  | { status: "missing-data" };

/** Loads and classifies a character addressed by its recovery code. */
export async function lookupRecoveryCharacter(
  code: string,
  currentUserId: string | null
): Promise<RecoveryLookupOutcome> {
  const indexSnapshot = await getDoc(doc(db, "recoveryIndex", code));
  if (!indexSnapshot.exists()) return { status: "not-found" };

  const { campaignId, characterId } = indexSnapshot.data() as RecoveryIndexDocument;
  const [campaignSnapshot, characterSnapshot] = await Promise.all([
    getDoc(campaignDocRef(campaignId)),
    getDoc(characterDocRef(campaignId, characterId)),
  ]);

  if (!campaignSnapshot.exists() || !characterSnapshot.exists()) {
    return { status: "missing-data" };
  }

  const character = characterSnapshot.data();
  let ownership: OwnershipState;

  if (!character.userId) {
    ownership = "unclaimed";
  } else if (currentUserId && character.userId === currentUserId) {
    ownership = "claimed-by-you";
  } else if (character.isEditableByPlayer === false) {
    ownership = "locked";
  } else {
    ownership = "claimed-by-other";
  }

  return {
    status: "found",
    result: {
      campaignId,
      characterId,
      character,
      campaign: campaignSnapshot.data(),
      ownership,
    },
  };
}
