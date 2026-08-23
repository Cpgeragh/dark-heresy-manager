// src/hooks/useSessions.ts

import { useCallback } from "react";
import { collection, limit, orderBy, query } from "firebase/firestore";
import { FIRESTORE_QUERY_LIMITS } from "../constants/firestoreLimits";
import { db } from "../firebase";
import type { SessionDocument } from "../types/Firestore";
import { useQuerySubscription } from "./useFirestoreSubscription";
import {
  deleteSession as deleteSessionDocument,
  updateSession as updateSessionDocument,
  type SessionUpdateData,
} from "../services/sessionService";

type SessionWithId = SessionDocument & { id: string };

export function useSessions(campaignId: string | undefined): {
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
    campaignId
      ? query(
          collection(db, "campaigns", campaignId, "sessions"),
          orderBy("date", "desc"),
          limit(FIRESTORE_QUERY_LIMITS.sessionsPerCampaign)
        )
      : null,
    campaignId ? `sessions:${campaignId}` : null,
    (snapshot) =>
      snapshot.docs.map((sessionDocument) => ({
        id: sessionDocument.id,
        ...(sessionDocument.data() as Omit<SessionDocument, "id">),
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
