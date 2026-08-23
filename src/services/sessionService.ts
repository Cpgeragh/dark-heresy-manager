// src/services/sessionService.ts
// Firestore operations for campaign session documents.

import {
  collection,
  deleteDoc,
  doc,
  increment,
  runTransaction,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import type { SessionDocument } from "../types/Firestore";
import { PRODUCT_LIMITS } from "../constants/productLimits";
import {
  assertBoolean,
  assertFirestoreDocumentId,
  assertString,
} from "../utils/firebaseValidation";

interface SessionData {
  date: Date;
  summary: string;
  dmNotes: string;
  xpAwarded: number;
  attendees: string[];
}

export type SessionUpdateData = Partial<
  Pick<SessionDocument, "date" | "summary" | "dmNotes" | "xpAwarded" | "attendees">
>;

/**
 * Creates a new session document and distributes XP to all attendees atomically.
 * If xpAwarded is 0, no character documents are updated.
 */
export async function createSession(campaignId: string, session: SessionData): Promise<void> {
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  validateSessionData(session);

  const batch = writeBatch(db);
  const sessionRef = doc(collection(db, "campaigns", campaignId, "sessions"));

  batch.set(sessionRef, {
    date: session.date,
    summary: session.summary,
    dmNotes: session.dmNotes,
    xpAwarded: session.xpAwarded,
    attendees: session.attendees,
    createdAt: serverTimestamp(),
    // XP is not auto-applied at creation — the DM uses the Apply XP button.
    // xpApplied: false means "ready to apply"; undefined means "created before
    // this tracking existed and XP state is unknown — don't show the button."
    ...(session.xpAwarded > 0 ? { xpApplied: false } : {}),
  });

  await batch.commit();
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

  await updateDoc(
    doc(db, "campaigns", campaignId, "sessions", sessionId),
    data as Record<string, unknown>
  );
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
  if (session.attendees.length > PRODUCT_LIMITS.sessionAttendees) {
    throw new Error(
      `A session cannot have more than ${PRODUCT_LIMITS.sessionAttendees} attendees.`
    );
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
    if (data.attendees.length > PRODUCT_LIMITS.sessionAttendees) {
      throw new Error(
        `A session cannot have more than ${PRODUCT_LIMITS.sessionAttendees} attendees.`
      );
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
  const sessionRef = doc(db, "campaigns", campaignId, "sessions", sessionId);

  if (!reverseXp) {
    await deleteDoc(sessionRef);
    return;
  }

  await runTransaction(db, async (transaction) => {
    const sessionSnap = await transaction.get(sessionRef);
    if (sessionSnap.exists()) {
      const session = sessionSnap.data() as SessionDocument;
      if (session.xpApplied === true) {
        for (const characterId of session.attendees) {
          transaction.update(doc(db, "campaigns", campaignId, "characters", characterId), {
            "experience.total": increment(-session.xpAwarded),
          });
        }
      }
    }
    transaction.delete(sessionRef);
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
  if (attendeeIds.length > PRODUCT_LIMITS.sessionAttendees) {
    throw new Error(
      `A session cannot have more than ${PRODUCT_LIMITS.sessionAttendees} attendees.`
    );
  }
  if (new Set(attendeeIds).size !== attendeeIds.length) {
    throw new Error("A character cannot be listed as a session attendee more than once.");
  }
  attendeeIds.forEach((attendeeId) => assertFirestoreDocumentId(attendeeId, "Session attendee ID"));
  if (xpAmount === 0 || attendeeIds.length === 0) return;

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

    for (const characterId of attendeeIds) {
      transaction.update(doc(db, "campaigns", campaignId, "characters", characterId), {
        "experience.total": increment(xpAmount),
      });
    }
  });
}
