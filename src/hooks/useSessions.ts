// src/hooks/useSessions.ts

import { useCallback, useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import type { SessionDocument } from "../types/Firestore";

type SessionWithId = SessionDocument & { id: string };
type SessionUpdateData = Partial<
  Pick<SessionDocument, "date" | "summary" | "dmNotes" | "xpAwarded" | "attendees">
>;

export function useSessions(campaignId: string | undefined): {
  sessions: SessionWithId[];
  loading: boolean;
  deleteSession: (sessionId: string) => Promise<void>;
  updateSession: (sessionId: string, data: SessionUpdateData) => Promise<void>;
} {
  const [sessions, setSessions] = useState<SessionWithId[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!campaignId) {
      setSessions([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const sessionsQuery = query(
      collection(db, "campaigns", campaignId, "sessions"),
      orderBy("date", "desc")
    );

    const unsub = onSnapshot(
      sessionsQuery,
      (snap) => {
        const list: SessionWithId[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<SessionDocument, "id">),
        }));
        setSessions(list);
        setLoading(false);
      },
      (err) => {
        console.error("Sessions snapshot error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [campaignId]);

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

  return { sessions, loading, deleteSession, updateSession };
}
