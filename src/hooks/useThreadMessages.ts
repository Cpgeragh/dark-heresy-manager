// src/hooks/useThreadMessages.ts
// Real-time listener for messages in a single character-DM thread.

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import type { ThreadMessage } from "../types/Firestore";

export function useThreadMessages(campaignId: string | null, characterId: string | null) {
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!campaignId || !characterId) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      query(
        collection(db, "campaigns", campaignId, "threads", characterId, "messages"),
        orderBy("timestamp", "asc")
      ),
      (snap) => {
        setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ThreadMessage)));
        setLoading(false);
      },
      (err) => {
        console.error("useThreadMessages error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [campaignId, characterId]);

  return { messages, loading };
}
