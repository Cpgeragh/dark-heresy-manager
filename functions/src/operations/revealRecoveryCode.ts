// functions/src/operations/revealRecoveryCode.ts
//
// Reveals a single character's Recovery Code to its DM or owning player,
// on demand, mirroring revealIdentityCode's shape for the account-level
// code. The client never needs the code inline in a bulk character read,
// only through this single-character reveal.

import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { callerIsPrimaryOrLinked } from "../shared/linkedIdentity.js";

export interface RevealRecoveryCodeInput {
  campaignId: string;
  characterId: string;
}

export async function revealRecoveryCode(
  input: RevealRecoveryCodeInput,
  callerUid: string
): Promise<{ code: string }> {
  const db = getFirestore();
  const campaignRef = db.collection("campaigns").doc(input.campaignId);
  const characterRef = campaignRef.collection("characters").doc(input.characterId);

  const [campaignSnapshot, characterSnapshot] = await Promise.all([
    campaignRef.get(),
    characterRef.get(),
  ]);
  if (!campaignSnapshot.exists || !characterSnapshot.exists) {
    throw new HttpsError("not-found", "Character not found.");
  }

  const character = characterSnapshot.data();
  const isDM = await callerIsPrimaryOrLinked(db, callerUid, campaignSnapshot.data()?.dmId);
  const isOwner = !isDM && (await callerIsPrimaryOrLinked(db, callerUid, character?.userId));
  if (!isDM && !isOwner) {
    throw new HttpsError("permission-denied", "You do not have access to this character.");
  }

  const code = character?.recoveryCode;
  if (typeof code !== "string" || !code.trim()) {
    throw new HttpsError("internal", "This character's recovery code is unavailable.");
  }
  return { code };
}
