import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { runOperationTransaction, type IdempotencyExecution } from "../shared/idempotency.js";
import { resolveXpHistoryActor } from "../shared/xpHistory.js";
import { authorisedCampaign, stageSessionAward } from "./sessionXp.js";

const SESSION_ATTENDEES_MAX = 100;
const SESSION_XP_AWARD_MAX = 100_000;

export interface StartSessionInput {
  campaignId: string;
  date: string;
  attendees: string[];
  operationId?: string;
}

export interface CloseSessionInput {
  campaignId: string;
  sessionId: string;
  xpAwarded: number;
  attendees: string[];
  operationId?: string;
}

function assertValidId(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || !value || value.length > 1_500 || value.includes("/")) {
    throw new HttpsError("invalid-argument", `${label} is invalid.`);
  }
}

function assertValidAttendees(attendees: unknown): asserts attendees is string[] {
  if (
    !Array.isArray(attendees) ||
    attendees.length > SESSION_ATTENDEES_MAX ||
    attendees.some(
      (id) => typeof id !== "string" || !id || id.length > 1_500 || id.includes("/")
    ) ||
    new Set(attendees).size !== attendees.length
  ) {
    throw new HttpsError("invalid-argument", "Session attendees are invalid.");
  }
}

function assertAtLeastOneAttendee(attendees: string[]): void {
  if (attendees.length === 0) {
    throw new HttpsError("invalid-argument", "At least one attendee is required.");
  }
}

function assertValidSessionDate(date: unknown): asserts date is string {
  if (
    typeof date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(new Date(date).getTime())
  ) {
    throw new HttpsError("invalid-argument", "A valid session date is required.");
  }
}

/** Starts a session that stays open for notes until it is closed. Only one can be open. */
export async function startSession(
  input: StartSessionInput,
  callerUid: string,
  idempotency: IdempotencyExecution<void> | null = null
): Promise<void> {
  assertValidId(input.campaignId, "Campaign ID");
  assertValidSessionDate(input.date);
  assertValidAttendees(input.attendees);
  assertAtLeastOneAttendee(input.attendees);

  const { db, campaignRef } = await authorisedCampaign(input.campaignId, callerUid);
  const sessionRef = campaignRef.collection("sessions").doc();
  const summaryRef = campaignRef.collection("sessionSummaries").doc(sessionRef.id);

  await runOperationTransaction(db, idempotency, async (transaction) => {
    const open = await transaction.get(
      campaignRef.collection("sessions").where("status", "==", "open").limit(1)
    );
    if (!open.empty) {
      throw new HttpsError(
        "failed-precondition",
        "A session is already open. Close it before starting another."
      );
    }
    const summaryData = {
      date: Timestamp.fromDate(new Date(input.date)),
      summary: "",
      xpAwarded: 0,
      attendees: input.attendees,
      createdAt: FieldValue.serverTimestamp(),
      status: "open",
    };
    transaction.set(sessionRef, { ...summaryData, dmNotes: "" });
    transaction.set(summaryRef, summaryData);
  });
}

/** Closes an open session and gives the XP to the attendees in the same transaction. */
export async function closeSession(
  input: CloseSessionInput,
  callerUid: string,
  idempotency: IdempotencyExecution<void> | null = null
): Promise<void> {
  assertValidId(input.campaignId, "Campaign ID");
  assertValidId(input.sessionId, "Session ID");
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
  assertValidAttendees(input.attendees);
  assertAtLeastOneAttendee(input.attendees);

  const { db, campaignRef, dmId } = await authorisedCampaign(input.campaignId, callerUid);
  const actor = await resolveXpHistoryActor(db, callerUid, dmId);
  const sessionRef = campaignRef.collection("sessions").doc(input.sessionId);
  const summaryRef = campaignRef.collection("sessionSummaries").doc(input.sessionId);

  await runOperationTransaction(db, idempotency, async (transaction) => {
    const sessionSnapshot = await transaction.get(sessionRef);
    if (!sessionSnapshot.exists) throw new HttpsError("not-found", "Session does not exist.");
    if (sessionSnapshot.data()?.status !== "open") {
      throw new HttpsError("failed-precondition", "This session is not open.");
    }
    const storedSummary =
      typeof sessionSnapshot.data()?.summary === "string"
        ? sessionSnapshot.data()?.summary.trim()
        : "";
    if (!storedSummary) {
      throw new HttpsError(
        "failed-precondition",
        "Save the session notes before closing the session."
      );
    }

    if (input.xpAwarded > 0 && input.attendees.length > 0) {
      await stageSessionAward(
        transaction,
        campaignRef,
        {
          sessionId: input.sessionId,
          attendees: input.attendees,
          xpAwarded: input.xpAwarded,
          summary: storedSummary,
        },
        actor
      );
    }

    const closed = {
      xpAwarded: input.xpAwarded,
      attendees: input.attendees,
      status: "closed",
      xpApplied: true,
    };
    transaction.update(sessionRef, closed);
    transaction.update(summaryRef, closed);
  });
}
