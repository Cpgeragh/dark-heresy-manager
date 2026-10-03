import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { assertCanEditCharacter } from "../shared/characterAuthorization.js";
import { runOperationTransaction, type IdempotencyExecution } from "../shared/idempotency.js";
import {
  assertValidXpAmount,
  assertValidXpReason,
  CHARACTER_XP_TOTAL_MAX,
  readExperience,
  resolveXpHistoryActor,
  stageOpeningBalance,
  stageXpHistoryEntry,
} from "../shared/xpHistory.js";

export interface AdjustCharacterXpInput {
  campaignId: string;
  characterId: string;
  amountXp: number;
  reason: string;
  operationId?: string;
}

export async function adjustCharacterXp(
  input: AdjustCharacterXpInput,
  callerUid: string,
  idempotency: IdempotencyExecution<void> | null = null
): Promise<void> {
  assertValidXpAmount(input.amountXp);
  assertValidXpReason(input.reason);

  const db = getFirestore();
  const campaignRef = db.collection("campaigns").doc(input.campaignId);
  const characterRef = campaignRef.collection("characters").doc(input.characterId);
  const historyCollection = characterRef.collection("xpHistory");
  const openingRef = historyCollection.doc("opening-balance");
  const historyRef = historyCollection.doc();
  const campaignSnapshot = await campaignRef.get();
  if (!campaignSnapshot.exists) throw new HttpsError("not-found", "Campaign not found.");
  const dmId = campaignSnapshot.data()?.dmId;
  const actor = await resolveXpHistoryActor(db, callerUid, dmId);

  await runOperationTransaction(
    db,
    idempotency,
    async (transaction) => {
      const characterSnapshot = await transaction.get(characterRef);
      const openingSnapshot = await transaction.get(openingRef);
      if (!characterSnapshot.exists) throw new HttpsError("not-found", "Character not found.");
      const characterData = characterSnapshot.data() ?? {};
      await assertCanEditCharacter(db, callerUid, dmId, characterData);
      const { experience, totalXp, spentXp } = readExperience(characterData);
      const balanceXp = totalXp + input.amountXp;
      if (balanceXp < spentXp) {
        throw new HttpsError(
          "failed-precondition",
          "The XP adjustment cannot reduce Total XP below Spent XP."
        );
      }
      if (balanceXp > CHARACTER_XP_TOTAL_MAX) {
        throw new HttpsError(
          "failed-precondition",
          `Total XP cannot exceed ${CHARACTER_XP_TOTAL_MAX}.`
        );
      }

      stageOpeningBalance(transaction, openingRef, openingSnapshot.exists, totalXp, actor);
      stageXpHistoryEntry(
        transaction,
        historyRef,
        {
          amountXp: input.amountXp,
          balanceXp,
          reason: input.reason.trim(),
          source: "manual-adjustment",
        },
        actor
      );
      transaction.update(characterRef, { experience: { ...experience, total: balanceXp } });
    },
    { maxAttempts: 5 }
  );
}
