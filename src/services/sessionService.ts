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
