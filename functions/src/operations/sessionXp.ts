import { getFirestore, type DocumentSnapshot } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { callerIsPrimaryOrLinked } from "../shared/linkedIdentity.js";
import { runOperationTransaction, type IdempotencyExecution } from "../shared/idempotency.js";
import {
  CHARACTER_XP_TOTAL_MAX,
  readExperience,
  resolveXpHistoryActor,
  stageOpeningBalance,
  stageXpHistoryEntry,
} from "../shared/xpHistory.js";
import { calculateCharacterSpentXp } from "../shared/spentXp.js";

const SESSION_ATTENDEES_MAX = 100;
const SESSION_XP_AWARD_MAX = 100_000;

export interface ApplySessionXpInput {
  campaignId: string;
  sessionId: string;
  operationId?: string;
}

export interface DeleteSessionInput extends ApplySessionXpInput {
  reverseXp: boolean;
}

function sessionValues(data: Record<string, unknown>) {
  const attendees = data.attendees;
  const xpAwarded = data.xpAwarded;
  if (!Array.isArray(attendees) || attendees.some((id) => typeof id !== "string" || !id)) {
    throw new HttpsError("failed-precondition", "Stored session attendees are invalid.");
  }
  if (attendees.length > SESSION_ATTENDEES_MAX || new Set(attendees).size !== attendees.length) {
    throw new HttpsError("failed-precondition", "Stored session attendees are invalid.");
  }
  if (
    !Number.isSafeInteger(xpAwarded) ||
    (xpAwarded as number) < 0 ||
    (xpAwarded as number) > SESSION_XP_AWARD_MAX
  ) {
    throw new HttpsError("failed-precondition", "Stored session XP is invalid.");
  }
  const summary =
    typeof data.summary === "string" && data.summary.trim() ? data.summary.trim() : null;
  return { attendees: attendees as string[], xpAwarded: xpAwarded as number, summary };
}

async function authorisedCampaign(campaignId: string, callerUid: string) {
  const db = getFirestore();
  const campaignRef = db.collection("campaigns").doc(campaignId);
  const campaignSnapshot = await campaignRef.get();
  if (!campaignSnapshot.exists) throw new HttpsError("not-found", "Campaign not found.");
  const dmId = campaignSnapshot.data()?.dmId;
  if (!(await callerIsPrimaryOrLinked(db, callerUid, dmId))) {
    throw new HttpsError("permission-denied", "Only the campaign DM can manage session XP.");
  }
  return { db, campaignRef, dmId };
}

export async function applySessionXp(
  input: ApplySessionXpInput,
  callerUid: string,
  idempotency: IdempotencyExecution<void> | null = null
): Promise<void> {
  const { db, campaignRef, dmId } = await authorisedCampaign(input.campaignId, callerUid);
  const actor = await resolveXpHistoryActor(db, callerUid, dmId);
  const sessionRef = campaignRef.collection("sessions").doc(input.sessionId);
  const summaryRef = campaignRef.collection("sessionSummaries").doc(input.sessionId);

  await runOperationTransaction(db, idempotency, async (transaction) => {
    const sessionSnapshot = await transaction.get(sessionRef);
    if (!sessionSnapshot.exists) throw new HttpsError("not-found", "Session does not exist.");
    const sessionData = sessionSnapshot.data() ?? {};
    if (sessionData.xpApplied === true) {
      throw new HttpsError("already-exists", "XP has already been applied for this session.");
    }
    const { attendees, xpAwarded, summary } = sessionValues(sessionData);
    const characterRefs = attendees.map((id) => campaignRef.collection("characters").doc(id));
    const characterSnapshots: DocumentSnapshot[] = [];
    const openingSnapshots: DocumentSnapshot[] = [];
    for (const characterRef of characterRefs)
      characterSnapshots.push(await transaction.get(characterRef));
    for (const characterRef of characterRefs) {
      openingSnapshots.push(
        await transaction.get(characterRef.collection("xpHistory").doc("opening-balance"))
      );
    }

    characterSnapshots.forEach((snapshot) => {
      if (!snapshot.exists) throw new HttpsError("not-found", "A session attendee was not found.");
    });

    characterRefs.forEach((characterRef, index) => {
      const characterData = characterSnapshots[index].data() ?? {};
      const { experience, totalXp } = readExperience(characterData);
      const spentXp = calculateCharacterSpentXp(characterData);
      const balanceXp = totalXp + xpAwarded;
      if (balanceXp > CHARACTER_XP_TOTAL_MAX) {
        throw new HttpsError(
          "failed-precondition",
          `Total XP cannot exceed ${CHARACTER_XP_TOTAL_MAX}.`
        );
      }
      const history = characterRef.collection("xpHistory");
      stageOpeningBalance(
        transaction,
        history.doc("opening-balance"),
        openingSnapshots[index].exists,
        totalXp,
        actor
      );
      stageXpHistoryEntry(
        transaction,
        history.doc(`session-award-${input.sessionId}`),
        {
          amountXp: xpAwarded,
          balanceXp,
          reason: summary ?? "Session award",
          source: "session-award",
          sessionId: input.sessionId,
        },
        actor
      );
      transaction.update(characterRef, {
        experience: { ...experience, total: balanceXp, spent: spentXp },
      });
    });
    transaction.update(sessionRef, { xpApplied: true });
    transaction.update(summaryRef, { xpApplied: true });
  });
}

export async function deleteSession(
  input: DeleteSessionInput,
  callerUid: string,
  idempotency: IdempotencyExecution<void> | null = null
): Promise<void> {
  if (typeof input.reverseXp !== "boolean") {
    throw new HttpsError("invalid-argument", "The Reverse XP flag must be true or false.");
  }
  const { db, campaignRef, dmId } = await authorisedCampaign(input.campaignId, callerUid);
  const actor = await resolveXpHistoryActor(db, callerUid, dmId);
  const sessionRef = campaignRef.collection("sessions").doc(input.sessionId);
  const summaryRef = campaignRef.collection("sessionSummaries").doc(input.sessionId);

  await runOperationTransaction(db, idempotency, async (transaction) => {
    const sessionSnapshot = await transaction.get(sessionRef);
    if (!sessionSnapshot.exists) {
      transaction.delete(summaryRef);
      return;
    }
    const sessionData = sessionSnapshot.data() ?? {};
    const shouldReverse = input.reverseXp && sessionData.xpApplied === true;
    if (shouldReverse) {
      const { attendees, xpAwarded, summary } = sessionValues(sessionData);
      const characterRefs = attendees.map((id) => campaignRef.collection("characters").doc(id));
      const characterSnapshots: DocumentSnapshot[] = [];
      const openingSnapshots: DocumentSnapshot[] = [];
      for (const characterRef of characterRefs)
        characterSnapshots.push(await transaction.get(characterRef));
      for (const characterRef of characterRefs) {
        openingSnapshots.push(
          await transaction.get(characterRef.collection("xpHistory").doc("opening-balance"))
        );
      }
      characterSnapshots.forEach((snapshot) => {
        if (!snapshot.exists)
          throw new HttpsError("not-found", "A session attendee was not found.");
      });
      characterRefs.forEach((characterRef, index) => {
        const characterData = characterSnapshots[index].data() ?? {};
        const { experience, totalXp } = readExperience(characterData);
        const spentXp = calculateCharacterSpentXp(characterData);
        const balanceXp = totalXp - xpAwarded;
        if (balanceXp < spentXp) {
          throw new HttpsError(
            "failed-precondition",
            "Session XP cannot be reversed below Spent XP."
          );
        }
        const history = characterRef.collection("xpHistory");
        stageOpeningBalance(
          transaction,
          history.doc("opening-balance"),
          openingSnapshots[index].exists,
          totalXp,
          actor
        );
        stageXpHistoryEntry(
          transaction,
          history.doc(`session-reversal-${input.sessionId}`),
          {
            amountXp: -xpAwarded,
            balanceXp,
            reason: summary ?? "Session reversal",
            source: "session-reversal",
            sessionId: input.sessionId,
          },
          actor
        );
        transaction.update(characterRef, {
          experience: { ...experience, total: balanceXp, spent: spentXp },
        });
      });
    }
    transaction.delete(sessionRef);
    transaction.delete(summaryRef);
  });
}
