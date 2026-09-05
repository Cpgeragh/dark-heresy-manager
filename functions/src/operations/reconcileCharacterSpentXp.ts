// functions/src/operations/reconcileCharacterSpentXp.ts
//
// Corrects the derived experience.spent total from a client-supplied
// recomputation (src/features/experience/xpSpent.ts's getSpentXp — pure
// arithmetic over already-owned purchases). This operation validates the
// value's structure but does not re-evaluate its game-rule correctness. It
// reads the character inside its own transaction and merges only
// experience.spent, leaving experience.total/.ranks/.transactions untouched
// so a concurrent XP award or Rank Up cannot be clobbered by a stale
// reconciliation.

import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { assertCanEditCharacter } from "../shared/characterAuthorization.js";

const MAX_EXPERIENCE = 10_000_000;

export interface ReconcileCharacterSpentXpInput {
  campaignId: string;
  characterId: string;
  spent: number;
  operationId?: string;
}

export async function reconcileCharacterSpentXp(
  input: ReconcileCharacterSpentXpInput,
  callerUid: string
): Promise<{ updated: boolean }> {
  if (!Number.isInteger(input.spent) || input.spent < 0 || input.spent > MAX_EXPERIENCE) {
    throw new HttpsError(
      "invalid-argument",
      `spent must be a whole number between 0 and ${MAX_EXPERIENCE}.`
    );
  }

  const db = getFirestore();
  const campaignRef = db.collection("campaigns").doc(input.campaignId);
  const characterRef = campaignRef.collection("characters").doc(input.characterId);

  const campaignSnapshot = await campaignRef.get();
  if (!campaignSnapshot.exists) {
    throw new HttpsError("not-found", "Campaign not found.");
  }
  const dmId = campaignSnapshot.data()?.dmId;

  return db.runTransaction(
    async (transaction) => {
      const characterSnapshot = await transaction.get(characterRef);
      if (!characterSnapshot.exists) {
        throw new HttpsError("not-found", "Character not found.");
      }
      const characterData = characterSnapshot.data() ?? {};
      await assertCanEditCharacter(db, callerUid, dmId, characterData);

      const experience = (characterData.experience ?? {}) as Record<string, unknown>;
      if (experience.spent === input.spent) {
        return { updated: false };
      }
      transaction.update(characterRef, { "experience.spent": input.spent });
      return { updated: true };
    },
    { maxAttempts: 5 }
  );
}
