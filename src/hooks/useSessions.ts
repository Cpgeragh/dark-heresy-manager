// src/hooks/useSessions.ts

import { useCallback } from "react";
import { collection, deleteDoc, doc, orderBy, query, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { SessionDocument } from "../types/Firestore";
import { useQuerySubscription } from "./useFirestoreSubscription";

type SessionWithId = SessionDocument & { id: string };
type SessionUpdateData = Partial<
  Pick<SessionDocument, "date" | "summary" | "dmNotes" | "xpAwarded" | "attendees">
>;

export function useSessions(campaignId: string | undefined): {
  sessions: SessionWithId[];
  loading: boolean;
  error: Error | null;
  deleteSession: (sessionId: string) => Promise<void>;
  updateSession: (sessionId: string, data: SessionUpdateData) => Promise<void>;
} {
  const {
    data: sessions,
    loading,
    error,
  } = useQuerySubscription(
    campaignId
      ? query(collection(db, "campaigns", campaignId, "sessions"), orderBy("date", "desc"))
      : null,
    campaignId ? `sessions:${campaignId}` : null,
    (snapshot) =>
      snapshot.docs.map((sessionDocument) => ({
        id: sessionDocument.id,
        ...(sessionDocument.data() as Omit<SessionDocument, "id">),
      }))
  );

  const deleteSession = useCallback(
    async (sessionId: string) => {
      if (!campaignId) return;
      try {
        await deleteDoc(doc(db, "campaigns", campaignId, "sessions", sessionId));
      } catch (err) {
        console.error("Failed to delete session:", err);
        throw err;
      }
    },
    [campaignId]
  );

  const updateSession = useCallback(
    async (sessionId: string, data: SessionUpdateData) => {
      if (!campaignId) return;
      try {
        await updateDoc(
          doc(db, "campaigns", campaignId, "sessions", sessionId),
          data as Record<string, unknown>
        );
      } catch (err) {
        console.error("Failed to update session:", err);
        throw err;
      }
    },
    [campaignId]
  );

  return { sessions, loading, error, deleteSession, updateSession };
}
