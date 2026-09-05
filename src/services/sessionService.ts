// src/services/sessionService.ts
// Firestore operations for campaign session documents.

import {
  collection,
  doc,
  increment,
  runTransaction,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../firebase";
import type { SessionDocument } from "../types/Firestore";
import { PRODUCT_LIMITS } from "../constants/productLimits";
import {
  assertBulkOperationCount,
  assertBoolean,
  assertFirestoreDocumentId,
  assertString,
} from "../firestore/firebaseValidation";
import { runSingleFlight } from "../firestore/singleFlight";

interface SessionData {
  date: Date;
  summary: string;
  dmNotes: string;
  xpAwarded: number;
  attendees: string[];
}

const SESSION_XP_FIXED_DOCUMENTS = 2;
export const SESSION_XP_FAN_OUT_LIMIT = Math.min(
  PRODUCT_LIMITS.sessionAttendees,
  PRODUCT_LIMITS.bulkOperationDocuments - SESSION_XP_FIXED_DOCUMENTS
);

export function getSessionXpAffectedDocumentCount(attendeeCount: number): number {
  return attendeeCount + SESSION_XP_FIXED_DOCUMENTS;
}

export type SessionUpdateData = Partial<
  Pick<SessionDocument, "date" | "summary" | "dmNotes" | "xpAwarded" | "attendees">
>;

const callRepairSessionSummaries = httpsCallable<{ campaignId: string }, { repairedCount: number }>(
  functions,
  "repairSessionSummaries"
);

/** Rebuilds every safe session summary through the protected DM-only operation. */
export async function repairSessionSummaries(campaignId: string): Promise<number> {
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  return runSingleFlight("session:repair-summaries", [campaignId], async () => {
    const response = await callRepairSessionSummaries({ campaignId });
    return response.data.repairedCount;
  });
}

/** Creates the DM-only session and its member-safe summary atomically. */
export async function createSession(campaignId: string, session: SessionData): Promise<void> {
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  validateSessionData(session);

  await runSingleFlight("session:create", [campaignId, session], async () => {
    const batch = writeBatch(db);
    const sessionRef = doc(collection(db, "campaigns", campaignId, "sessions"));
    const summaryRef = doc(db, "campaigns", campaignId, "sessionSummaries", sessionRef.id);
    const createdAt = serverTimestamp();
    const summaryData = {
      date: session.date,
      summary: session.summary,
      xpAwarded: session.xpAwarded,
      attendees: session.attendees,
      createdAt,
      ...(session.xpAwarded > 0 ? { xpApplied: false } : {}),
    };

    batch.set(sessionRef, {
      ...summaryData,
      dmNotes: session.dmNotes,
    });
    batch.set(summaryRef, summaryData);

    await batch.commit();
  });
}

/** Updates the editable fields on an existing campaign session. */
export async function updateSession(
  campaignId: string,
  sessionId: string,
  data: SessionUpdateData
): Promise<void> {
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  assertFirestoreDocumentId(sessionId, "Session ID");
  validateSessionUpdate(data);

  await runSingleFlight("session:update", [campaignId, sessionId, data], async () => {
    const batch = writeBatch(db);
    batch.update(
      doc(db, "campaigns", campaignId, "sessions", sessionId),
      data as Record<string, unknown>
    );

    const { dmNotes: _dmNotes, ...summaryUpdate } = data;
    if (Object.keys(summaryUpdate).length > 0) {
      batch.update(
        doc(db, "campaigns", campaignId, "sessionSummaries", sessionId),
        summaryUpdate as Record<string, unknown>
      );
    }
    await batch.commit();
  });
}

function validateSessionData(session: SessionData): void {
  if (typeof session !== "object" || session === null) {
    throw new Error("Session data must be an object.");
  }
  assertString(session.summary, "Session summary");
  assertString(session.dmNotes, "DM notes");
  if (!Array.isArray(session.attendees)) throw new Error("Session attendees must be an array.");
  if (!(session.date instanceof Date) || Number.isNaN(session.date.getTime())) {
    throw new Error("A valid session date is required.");
  }
  if (session.summary.length > PRODUCT_LIMITS.sessionSummaryCharacters) {
    throw new Error(
      `Session summary cannot exceed ${PRODUCT_LIMITS.sessionSummaryCharacters} characters.`
    );
  }
  if (session.dmNotes.length > PRODUCT_LIMITS.sessionDmNotesCharacters) {
    throw new Error(
      `DM notes cannot exceed ${PRODUCT_LIMITS.sessionDmNotesCharacters} characters.`
    );
  }
  if (
    !Number.isInteger(session.xpAwarded) ||
    session.xpAwarded < 0 ||
    session.xpAwarded > PRODUCT_LIMITS.sessionXpAward
  ) {
    throw new Error(
      `XP awarded must be a whole number from 0 to ${PRODUCT_LIMITS.sessionXpAward}.`
    );
  }
  if (session.attendees.length > SESSION_XP_FAN_OUT_LIMIT) {
    throw new Error(`A session cannot have more than ${SESSION_XP_FAN_OUT_LIMIT} attendees.`);
  }
  if (new Set(session.attendees).size !== session.attendees.length) {
    throw new Error("A character cannot be listed as a session attendee more than once.");
  }
  session.attendees.forEach((attendeeId) =>
    assertFirestoreDocumentId(attendeeId, "Session attendee ID")
  );
}

function validateSessionUpdate(data: SessionUpdateData): void {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new Error("Session update must be an object.");
  }
  if (
    data.date !== undefined &&
    (!(data.date instanceof Date) || Number.isNaN(data.date.getTime()))
  ) {
    throw new Error("A valid session date is required.");
  }
  if (data.summary !== undefined) {
    assertString(data.summary, "Session summary");
    if (data.summary.length > PRODUCT_LIMITS.sessionSummaryCharacters) {
      throw new Error(
        `Session summary cannot exceed ${PRODUCT_LIMITS.sessionSummaryCharacters} characters.`
      );
    }
  }
  if (data.dmNotes !== undefined) {
    assertString(data.dmNotes, "DM notes");
    if (data.dmNotes.length > PRODUCT_LIMITS.sessionDmNotesCharacters) {
      throw new Error(
        `DM notes cannot exceed ${PRODUCT_LIMITS.sessionDmNotesCharacters} characters.`
      );
    }
  }
  if (
    data.xpAwarded !== undefined &&
    (!Number.isInteger(data.xpAwarded) ||
      data.xpAwarded < 0 ||
      data.xpAwarded > PRODUCT_LIMITS.sessionXpAward)
  ) {
    throw new Error(
      `XP awarded must be a whole number from 0 to ${PRODUCT_LIMITS.sessionXpAward}.`
    );
  }
  if (data.attendees !== undefined) {
    if (!Array.isArray(data.attendees)) throw new Error("Session attendees must be an array.");
    if (data.attendees.length > SESSION_XP_FAN_OUT_LIMIT) {
      throw new Error(`A session cannot have more than ${SESSION_XP_FAN_OUT_LIMIT} attendees.`);
    }
    if (new Set(data.attendees).size !== data.attendees.length) {
      throw new Error("A character cannot be listed as a session attendee more than once.");
    }
    data.attendees.forEach((attendeeId) =>
      assertFirestoreDocumentId(attendeeId, "Session attendee ID")
    );
  }
}

/**
 * Permanently deletes a campaign session. If reverseXp is true and the
 * session's XP was applied, also removes that XP from every attendee, in
 * the same transaction as the delete so it can't race or double-reverse.
 */
export async function deleteSession(
  campaignId: string,
  sessionId: string,
  reverseXp = false
): Promise<void> {
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  assertFirestoreDocumentId(sessionId, "Session ID");
  assertBoolean(reverseXp, "Reverse-XP flag");
  await runSingleFlight("session:delete", [campaignId, sessionId], async () => {
    const sessionRef = doc(db, "campaigns", campaignId, "sessions", sessionId);
    const summaryRef = doc(db, "campaigns", campaignId, "sessionSummaries", sessionId);

    if (!reverseXp) {
      const batch = writeBatch(db);
      batch.delete(sessionRef);
      batch.delete(summaryRef);
      await batch.commit();
      return;
    }

    await runTransaction(db, async (transaction) => {
      const sessionSnap = await transaction.get(sessionRef);
      if (sessionSnap.exists()) {
        const session = sessionSnap.data() as SessionDocument;
        if (session.xpApplied === true) {
          if (!Array.isArray(session.attendees)) {
            throw new Error("Stored session attendees are invalid; XP reversal was stopped.");
          }
          if (session.attendees.length > SESSION_XP_FAN_OUT_LIMIT) {
            throw new Error(
              `XP reversal has more than ${SESSION_XP_FAN_OUT_LIMIT} attendees and was stopped before any write.`
            );
          }
          if (new Set(session.attendees).size !== session.attendees.length) {
            throw new Error(
              "Stored session attendees contain duplicates; XP reversal was stopped."
            );
          }
          session.attendees.forEach((characterId) =>
            assertFirestoreDocumentId(characterId, "Stored session attendee ID")
          );
          assertBulkOperationCount(
            getSessionXpAffectedDocumentCount(session.attendees.length),
            "Session XP reversal"
          );
          for (const characterId of session.attendees) {
            transaction.update(doc(db, "campaigns", campaignId, "characters", characterId), {
              "experience.total": increment(-session.xpAwarded),
            });
          }
        }
      }
      transaction.delete(sessionRef);
      transaction.delete(summaryRef);
    });
  });
}

/**
 * Manually applies XP from a session to all attendee characters.
 * Marks the session xpApplied: true to prevent double-application. Runs as
 * a transaction so two near-simultaneous calls (two DM tabs, a slow click
 * followed by an impatient second one) can't both slip past the
 * already-applied check before either write lands.
 * Use for sessions created before automatic XP distribution was added.
 */
export async function applySessionXp(
  campaignId: string,
  sessionId: string,
  attendeeIds: string[],
  xpAmount: number
): Promise<void> {
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  assertFirestoreDocumentId(sessionId, "Session ID");
  if (!Array.isArray(attendeeIds)) throw new Error("Session attendees must be an array.");
  if (!Number.isInteger(xpAmount) || xpAmount < 0 || xpAmount > PRODUCT_LIMITS.sessionXpAward) {
    throw new Error(
      `XP awarded must be a whole number from 0 to ${PRODUCT_LIMITS.sessionXpAward}.`
    );
  }
  if (attendeeIds.length > SESSION_XP_FAN_OUT_LIMIT) {
    throw new Error(`A session cannot have more than ${SESSION_XP_FAN_OUT_LIMIT} attendees.`);
  }
  if (new Set(attendeeIds).size !== attendeeIds.length) {
    throw new Error("A character cannot be listed as a session attendee more than once.");
  }
  attendeeIds.forEach((attendeeId) => assertFirestoreDocumentId(attendeeId, "Session attendee ID"));
  if (xpAmount === 0 || attendeeIds.length === 0) return;
  assertBulkOperationCount(
    getSessionXpAffectedDocumentCount(attendeeIds.length),
    "Session XP application"
  );

  await runSingleFlight("session:apply-xp", [campaignId, sessionId], async () => {
    const sessionRef = doc(db, "campaigns", campaignId, "sessions", sessionId);

    await runTransaction(db, async (transaction) => {
      const sessionSnap = await transaction.get(sessionRef);
      if (!sessionSnap.exists()) {
        throw new Error("Session does not exist.");
      }
      if (sessionSnap.data().xpApplied === true) {
        throw new Error("XP has already been applied for this session.");
      }

      transaction.update(sessionRef, { xpApplied: true });
      transaction.update(doc(db, "campaigns", campaignId, "sessionSummaries", sessionId), {
        xpApplied: true,
      });

      for (const characterId of attendeeIds) {
        transaction.update(doc(db, "campaigns", campaignId, "characters", characterId), {
          "experience.total": increment(xpAmount),
        });
      }
    });
  });
}
