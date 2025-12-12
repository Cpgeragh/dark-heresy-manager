// src/pages/ClaimCharacter/hooks/useClaimActions.ts

import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../../firebase";
import { buildClaimLogPayload } from "../../../utils/claimLog";

export function useClaimActions() {
  async function claimCharacter(
    campaignId: string,
    character: {
      id: string;
      userId: string | null;
    }
  ) {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Not signed in.");
    }

    // Defensive: character must be unclaimed at call time
    if (character.userId) {
      throw new Error("Character is already claimed.");
    }

    const charRef = doc(
      db,
      "campaigns",
      campaignId,
      "characters",
      character.id
    );

    // Step 1: claim ownership
    await updateDoc(charRef, {
      userId: user.uid,
    });

    // Step 2: write claim log
    await addDoc(
      collection(
        db,
        "campaigns",
        campaignId,
        "characters",
        character.id,
        "claimLog"
      ),
      buildClaimLogPayload(
        "claim",
        user.uid,
        character.userId ?? null,
        user.uid
      )
    );
  }

  return { claimCharacter };
}