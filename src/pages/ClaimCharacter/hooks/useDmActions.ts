// src/pages/ClaimCharacter/hooks/useDmActions.ts

import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../../firebase";
import { buildClaimLogPayload } from "../../../utils/claimLog";

export function useDmActions() {
  const user = auth.currentUser;

  async function forceAssign(campaignId: string, character: any, uid: string) {
    const charRef = doc(
      db,
      "campaigns",
      campaignId,
      "characters",
      character.id
    );

    const previous = character.userId;

    await updateDoc(charRef, {
      userId: uid,
      isEditableByPlayer: true,
    });

    await addDoc(
      collection(db, "campaigns", campaignId, "characters", character.id, "claimLog"),
      buildClaimLogPayload("force-assign", user!.uid, previous, uid)
    );
  }

  async function forceRelease(campaignId: string, character: any) {
    const charRef = doc(
      db,
      "campaigns",
      campaignId,
      "characters",
      character.id
    );

    const previous = character.userId;

    await updateDoc(charRef, {
      userId: null,
      isEditableByPlayer: false,
    });

    await addDoc(
      collection(db, "campaigns", campaignId, "characters", character.id, "claimLog"),
      buildClaimLogPayload("force-release", user!.uid, previous, null)
    );
  }

  return { forceAssign, forceRelease };
}