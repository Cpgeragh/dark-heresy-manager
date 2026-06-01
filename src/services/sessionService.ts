// src/services/sessionService.ts
// Firestore operations for campaign session documents.

import { collection, doc, increment, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "../firebase";

interface SessionData {
  date: Date;
  summary: string;
  dmNotes: string;
  xpAwarded: number;
  attendees: string[];
}

/**
 * Creates a new session document and distributes XP to all attendees atomically.
 * If xpAwarded is 0, no character documents are updated.
 */
export async function createSession(
  campaignId: string,
  session: SessionData
): Promise<void> {
  const batch = writeBatch(db);
  const sessionRef = doc(collection(db, "campaigns", campaignId, "sessions"));

  batch.set(sessionRef, {
    date: session.date,
    summary: session.summary,
    dmNotes: session.dmNotes,
    xpAwarded: session.xpAwarded,
    attendees: session.attendees,
    createdAt: serverTimestamp(),
    xpApplied: session.xpAwarded > 0,
  });

  if (session.xpAwarded > 0) {
    for (const charId of session.attendees) {
      batch.update(
        doc(db, "campaigns", campaignId, "characters", charId),
        { "experience.total": increment(session.xpAwarded) }
      );
    }
  }

  await batch.commit();
}

/**
 * Manually applies XP from a session to all attendee characters.
 * Marks the session xpApplied: true to prevent double-application.
 * Use for sessions created before automatic XP distribution was added.
 */
export async function applySessionXp(
  campaignId: string,
  sessionId: string,
  attendeeIds: string[],
  xpAmount: number
): Promise<void> {
  if (xpAmount <= 0 || attendeeIds.length === 0) return;

  const batch = writeBatch(db);

  batch.update(doc(db, "campaigns", campaignId, "sessions", sessionId), {
    xpApplied: true,
  });

  for (const characterId of attendeeIds) {
    batch.update(
      doc(db, "campaigns", campaignId, "characters", characterId),
      { "experience.total": increment(xpAmount) }
    );
  }

  await batch.commit();
}
