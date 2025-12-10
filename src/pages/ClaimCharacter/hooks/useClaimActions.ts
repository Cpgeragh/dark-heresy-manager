// src/pages/ClaimCharacter/hooks/useClaimActions.ts

import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../../firebase";
import { buildClaimLogPayload } from "../../../utils/claimLog";

export function useClaimActions() {
  async function claimCharacter(campaignId: string, character: any) {
    const user = auth.currentUser;
    if (!user) throw new Error("Not signed in.");

    const charRef = doc(
      db,
      "campaigns",
      campaignId,
      "characters",
      character.id
    );

    await updateDoc(charRef, {
      userId: user.uid,
    });

    const logRef = collection(
      db,
      "campaigns",
      campaignId,
      "characters",
      character.id,
      "claimLog"
    );

    await addDoc(
      logRef,
      buildClaimLogPayload("claim", user.uid, character.userId ?? null, user.uid)
    );
  }

  return { claimCharacter };
}