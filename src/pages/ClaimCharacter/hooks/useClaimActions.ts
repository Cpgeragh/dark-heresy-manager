// src/pages/ClaimCharacter/hooks/useClaimActions.ts

import { collection, doc, runTransaction } from "firebase/firestore";
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

    const charRef = doc(
      db,
      "campaigns",
      campaignId,
      "characters",
      character.id
    );

    const logsRef = collection(
      db,
      "campaigns",
      campaignId,
      "characters",
      character.id,
      "claimLog"
    );

    // Use transaction to prevent race conditions
    await runTransaction(db, async (transaction) => {
      // Step 1: Read current state
      const charDoc = await transaction.get(charRef);
      
      if (!charDoc.exists()) {
        throw new Error("Character does not exist.");
      }

      const currentData = charDoc.data();
      
      // Step 2: Check if already claimed (inside transaction = safe)
      if (currentData.userId) {
        throw new Error("Character is already claimed.");
      }

      // Step 3: Claim ownership and write audit log atomically
      transaction.update(charRef, { userId: user.uid });
      transaction.set(
        doc(logsRef),
        buildClaimLogPayload("claim", user.uid, null, user.uid)
      );
    });
  }

  return { claimCharacter };
}