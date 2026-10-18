import {
  getFirestore,
  type DocumentReference,
  type DocumentSnapshot,
  type Transaction,
} from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { callerIsPrimaryOrLinked } from "../shared/linkedIdentity.js";
import { runOperationTransaction, type IdempotencyExecution } from "../shared/idempotency.js";
import {
  CHARACTER_XP_TOTAL_MAX,
  readExperience,
  resolveXpHistoryActor,
  stageOpeningBalance,
  stageXpHistoryEntry,
  type XpHistoryActor,
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

export function sessionValues(data: Record<string, unknown>) {
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

export async function authorisedCampaign(campaignId: string, callerUid: string) {
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

export interface SessionAward {
  sessionId: string;
  attendees: string[];
  xpAwarded: number;
  summary: string | null;
}

/**
 * Gives every attendee the session's XP inside an open transaction: all reads first, then the
 * opening balance, history entry and new total for each attendee.
 */
export async function stageSessionAward(
  transaction: Transaction,
  campaignRef: DocumentReference,
  award: SessionAward,
  actor: XpHistoryActor
): Promise<void> {
  const { sessionId, attendees, xpAwarded, summary } = award;
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
      history.doc(`session-award-${sessionId}`),
      {
        amountXp: xpAwarded,
        balanceXp,
        reason: summary ?? "Session award",
        source: "session-award",
        sessionId,
      },
      actor
    );
    transaction.update(characterRef, {
      experience: { ...experience, total: balanceXp, spent: spentXp },
    });
  });
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
    await stageSessionAward(
      transaction,
      campaignRef,
      { sessionId: input.sessionId, attendees, xpAwarded, summary },
      actor
    );
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

export interface AdjustSessionXpInput extends ApplySessionXpInput {
  xpAwarded: number;
  attendees: string[];
}

function assertValidSessionXpEdit(input: AdjustSessionXpInput): void {
  if (
    !Number.isSafeInteger(input.xpAwarded) ||
    input.xpAwarded < 0 ||
    input.xpAwarded > SESSION_XP_AWARD_MAX
  ) {
    throw new HttpsError(
      "invalid-argument",
      `XP awarded must be a whole number from 0 to ${SESSION_XP_AWARD_MAX}.`
    );
  }
  if (
    !Array.isArray(input.attendees) ||
    input.attendees.length > SESSION_ATTENDEES_MAX ||
    input.attendees.some((id) => typeof id !== "string" || !id || id.includes("/")) ||
    new Set(input.attendees).size !== input.attendees.length
  ) {
    throw new HttpsError("invalid-argument", "Session attendees are invalid.");
  }
  if (typeof input.operationId !== "string" || !input.operationId) {
    throw new HttpsError("invalid-argument", "An operation id is required.");
  }
}

function characterLabel(characterData: Record<string, unknown>, id: string): string {
  const header = characterData.header;
  const name =
    typeof header === "object" && header !== null
      ? (header as Record<string, unknown>).characterName
      : undefined;
  return typeof name === "string" && name.trim() ? name.trim() : id;
}

/**
 * Changes the XP amount or the attendees of a session whose XP was already applied. Each
 * character is given or loses the difference, in the same transaction that updates the session.
 */
export async function adjustSessionXp(
  input: AdjustSessionXpInput,
  callerUid: string,
  idempotency: IdempotencyExecution<void> | null = null
): Promise<void> {
  assertValidSessionXpEdit(input);
  const { db, campaignRef, dmId } = await authorisedCampaign(input.campaignId, callerUid);
  const actor = await resolveXpHistoryActor(db, callerUid, dmId);
  const sessionRef = campaignRef.collection("sessions").doc(input.sessionId);
  const summaryRef = campaignRef.collection("sessionSummaries").doc(input.sessionId);

  await runOperationTransaction(db, idempotency, async (transaction) => {
    const sessionSnapshot = await transaction.get(sessionRef);
    if (!sessionSnapshot.exists) throw new HttpsError("not-found", "Session does not exist.");
    const sessionData = sessionSnapshot.data() ?? {};
    if (sessionData.xpApplied !== true) {
      throw new HttpsError(
        "failed-precondition",
        "XP has not been applied for this session yet, so it can be edited directly."
      );
    }
    const previous = sessionValues(sessionData);

    const changes: { id: string; deltaXp: number }[] = [];
    for (const id of new Set([...previous.attendees, ...input.attendees])) {
      const before = previous.attendees.includes(id) ? previous.xpAwarded : 0;
      const after = input.attendees.includes(id) ? input.xpAwarded : 0;
      if (after !== before) changes.push({ id, deltaXp: after - before });
    }

    const characterRefs = changes.map(({ id }) => campaignRef.collection("characters").doc(id));
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
      const balanceXp = totalXp + changes[index].deltaXp;
      const label = characterLabel(characterData, changes[index].id);
      if (balanceXp > CHARACTER_XP_TOTAL_MAX) {
        throw new HttpsError(
          "failed-precondition",
          `Total XP for ${label} cannot exceed ${CHARACTER_XP_TOTAL_MAX}.`
        );
      }
      if (balanceXp < spentXp) {
        throw new HttpsError(
          "failed-precondition",
          `Session XP cannot be adjusted below the Spent XP of ${label}.`
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
        history.doc(`session-adjustment-${input.sessionId}-${input.operationId}`),
        {
          amountXp: changes[index].deltaXp,
          balanceXp,
          reason: previous.summary ?? "Session adjustment",
          source: "session-adjustment",
          sessionId: input.sessionId,
        },
        actor
      );
      transaction.update(characterRef, {
        experience: { ...experience, total: balanceXp, spent: spentXp },
      });
    });

    const edited = { xpAwarded: input.xpAwarded, attendees: input.attendees };
    transaction.update(sessionRef, edited);
    transaction.update(summaryRef, edited);
  });
}
