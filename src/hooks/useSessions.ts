// src/hooks/useSessions.ts

import { useCallback } from "react";
import { collection, limit, orderBy, query } from "firebase/firestore";
import { FIRESTORE_QUERY_LIMITS } from "../constants/firestoreLimits";
import { db } from "../firebase";
import type { SessionListDocument } from "../types/Firestore";
import { useQuerySubscription } from "./useFirestoreSubscription";
import {
  deleteSession as deleteSessionDocument,
  updateSession as updateSessionDocument,
  type SessionUpdateData,
} from "../services/sessionService";

type SessionWithId = SessionListDocument & { id: string };

export function useSessions(campaignId: string | undefined, isDM: boolean | null): {
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
      await updateSessionDocument(campaignId, sessionId, data);
    },
    [campaignId]
  );

  return { sessions, loading, error, deleteSession, updateSession };
}
