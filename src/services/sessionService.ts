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
    xpApplied: session.xpAwarded > 0 ? false : undefined,
  });

  await batch.commit();
}

/** Updates the editable fields on an existing campaign session. */
export async function updateSession(
  campaignId: string,
  sessionId: string,
  data: SessionUpdateData
): Promise<void> {
  await updateDoc(
    doc(db, "campaigns", campaignId, "sessions", sessionId),
    data as Record<string, unknown>
  );
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
  if (xpAmount <= 0 || attendeeIds.length === 0) return;

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
