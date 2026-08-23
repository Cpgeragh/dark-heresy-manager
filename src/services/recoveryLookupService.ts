import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { campaignDocRef, characterDocRef } from "../firebase/converters";
import type { RecoveryIndexDocument } from "../types/Firestore";
import type { OwnershipState, RecoveryLookupResult } from "../types/Recovery";
import { assertFirestoreDocumentId, assertRecoveryCode } from "../utils/firebaseValidation";

export type RecoveryLookupOutcome =
  | { status: "found"; result: RecoveryLookupResult }
  | { status: "not-found" }
  | { status: "missing-data" };

/** Loads and classifies a character addressed by its recovery code. */
export async function lookupRecoveryCharacter(
  code: string,
  currentUserId: string | null
): Promise<RecoveryLookupOutcome> {
  assertRecoveryCode(code);
  if (currentUserId !== null) assertFirestoreDocumentId(currentUserId, "Current user ID");
  const normalisedCode = code.trim();
  const indexSnapshot = await getDoc(doc(db, "recoveryIndex", normalisedCode));
  if (!indexSnapshot.exists()) return { status: "not-found" };

  const { campaignId, characterId } = indexSnapshot.data() as RecoveryIndexDocument;
  assertFirestoreDocumentId(campaignId, "Recovered campaign ID");
  assertFirestoreDocumentId(characterId, "Recovered character ID");
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
