// src/hooks/useSessions.ts

import { useCallback } from "react";
import { collection, limit, orderBy, query } from "firebase/firestore";
import { FIRESTORE_QUERY_LIMITS } from "../constants/firestoreLimits";
import { db } from "../firebase";
import type { SessionListDocument } from "../types/Firestore";
import { useQuerySubscription } from "./useFirestoreSubscription";
import {
  adjustSessionXp as adjustSessionXpDocument,
  deleteSession as deleteSessionDocument,
  updateSession as updateSessionDocument,
  type SessionUpdateData,
} from "../services/sessionService";

type SessionWithId = SessionListDocument & { id: string };

export function useSessions(
  campaignId: string | undefined,
  isDM: boolean | null
): {
  sessions: SessionWithId[];
  loading: boolean;
  error: Error | null;
  deleteSession: (sessionId: string, reverseXp?: boolean) => Promise<void>;
  updateSession: (sessionId: string, data: SessionUpdateData) => Promise<void>;
} {
  const {
    data: sessions,
    loading,
    error,
  } = useQuerySubscription(
    campaignId && isDM !== null
      ? query(
          collection(db, "campaigns", campaignId, isDM ? "sessions" : "sessionSummaries"),
          orderBy("date", "desc"),
          limit(FIRESTORE_QUERY_LIMITS.sessionsPerCampaign)
        )
      : null,
    campaignId && isDM !== null ? `sessions:${campaignId}:${isDM ? "dm" : "member"}` : null,
    (snapshot) =>
      snapshot.docs.map((sessionDocument) => ({
        id: sessionDocument.id,
        ...(sessionDocument.data() as SessionListDocument),
      }))
  );

  const deleteSession = useCallback(
    async (sessionId: string, reverseXp = false) => {
      if (!campaignId) return;
      await deleteSessionDocument(campaignId, sessionId, reverseXp);
    },
    [campaignId]
  );

  const updateSession = useCallback(
    async (sessionId: string, data: SessionUpdateData) => {
      if (!campaignId) return;
      const existing = sessions.find((session) => session.id === sessionId);
      if (existing?.xpApplied !== true) {
        await updateSessionDocument(campaignId, sessionId, data);
        return;
      }

      // The XP of an applied session is already on the characters, so the server adjusts
      // each character by the difference and the rest of the edit is saved as usual.
      const { xpAwarded, attendees, ...rest } = data;
      const nextXp = xpAwarded ?? existing.xpAwarded;
      const nextAttendees = attendees ?? existing.attendees;
      const xpChanged =
        nextXp !== existing.xpAwarded ||
        nextAttendees.length !== existing.attendees.length ||
        nextAttendees.some((id) => !existing.attendees.includes(id));
      if (xpChanged) await adjustSessionXpDocument(campaignId, sessionId, nextXp, nextAttendees);
      if (Object.keys(rest).length > 0) await updateSessionDocument(campaignId, sessionId, rest);
    },
    [campaignId, sessions]
  );

  return { sessions, loading, error, deleteSession, updateSession };
}
