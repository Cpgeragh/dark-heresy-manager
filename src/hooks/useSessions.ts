// src/hooks/useSessions.ts

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import type { SessionDocument } from "../types/Firestore";

type SessionWithId = SessionDocument & { id: string };

export function useSessions(campaignId: string | undefined): {
  sessions: SessionWithId[];
  loading: boolean;
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

    const q = query(
      collection(db, "campaigns", campaignId, "sessions"),
      orderBy("date", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: SessionWithId[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<SessionDocument, "id">),
      }));
      setSessions(list);
      setLoading(false);
    });

    return () => unsub();
  }, [campaignId]);

  return { sessions, loading };
}
