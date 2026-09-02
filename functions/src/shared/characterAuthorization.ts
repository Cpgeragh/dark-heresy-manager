// functions/src/shared/characterAuthorization.ts
//
// Server-side mirror of firestore.rules' character `allow update`
// authorization: the campaign's DM (or a linked device), or the character's
// own owning player (or a linked device) while the DM has left the character
// editable. Used by patchCharacterField and every later Stage 12
// character-patch operation.

import type { Firestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { callerIsPrimaryOrLinked } from "./linkedIdentity.js";

export async function assertCanEditCharacter(
  db: Firestore,
  callerUid: string,
  dmId: unknown,
  characterData: Record<string, unknown>
): Promise<void> {
  if (await callerIsPrimaryOrLinked(db, callerUid, dmId)) {
    return;
  }
  const isEditableByPlayer = characterData.isEditableByPlayer === true;
  if (isEditableByPlayer && (await callerIsPrimaryOrLinked(db, callerUid, characterData.userId))) {
    return;
  }
  throw new HttpsError("permission-denied", "You do not have permission to edit this character.");
}
