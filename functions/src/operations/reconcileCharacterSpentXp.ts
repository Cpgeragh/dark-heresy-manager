// functions/src/operations/reconcileCharacterSpentXp.ts
//
// Corrects the derived experience.spent total from the character's stored
// purchases. It reads the character inside its own transaction and merges
// only experience.spent, so concurrent XP awards and Rank Up changes are not
// overwritten by stale client state.

import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { assertCanEditCharacter } from "../shared/characterAuthorization.js";
import { runOperationTransaction, type IdempotencyExecution } from "../shared/idempotency.js";
import { assertCharacterXpBudget } from "../shared/spentXp.js";

export interface ReconcileCharacterSpentXpInput {
  campaignId: string;
  characterId: string;
  operationId?: string;
}

export async function reconcileCharacterSpentXp(
  input: ReconcileCharacterSpentXpInput,
  callerUid: string,
  idempotency: IdempotencyExecution<{ updated: boolean }> | null = null
): Promise<{ updated: boolean }> {
  const db = getFirestore();
  const campaignRef = db.collection("campaigns").doc(input.campaignId);
  const characterRef = campaignRef.collection("characters").doc(input.characterId);

  const campaignSnapshot = await campaignRef.get();
  if (!campaignSnapshot.exists) {
    throw new HttpsError("not-found", "Campaign not found.");
  }
  const dmId = campaignSnapshot.data()?.dmId;

  return runOperationTransaction(
    db,
    idempotency,
    async (transaction) => {
      const characterSnapshot = await transaction.get(characterRef);
      if (!characterSnapshot.exists) {
        throw new HttpsError("not-found", "Character not found.");
      }
      const characterData = characterSnapshot.data() ?? {};
      await assertCanEditCharacter(db, callerUid, dmId, characterData);

      const experience = (characterData.experience ?? {}) as Record<string, unknown>;
      const spentXp = assertCharacterXpBudget(characterData);
      if (experience.spent === spentXp) {
        return { updated: false };
      }
      transaction.update(characterRef, { "experience.spent": spentXp });
      return { updated: true };
    },
    { maxAttempts: 5 }
  );
}
