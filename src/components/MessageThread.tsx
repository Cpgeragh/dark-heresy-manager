// src/components/MessageThread.tsx

import { useEffect, useRef } from "react";
import type { ThreadMessage } from "../types/Firestore";

export function MessageThread({
  messages,
  currentUid,
  loading,
}: {
  messages: ThreadMessage[];
  currentUid: string;
  loading: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading) {
    return <p className="text-xs text-slate-500 py-2">Loading messages…</p>;
  }

  if (messages.length === 0) {
    return <p className="text-xs text-slate-500 py-2 text-center">No messages yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2 max-h-72 overflow-y-auto py-2 pr-1">
      {messages.map((msg) => {
        const isOwn = msg.fromUid === currentUid;
        return (
          <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] px-3 py-2 rounded-lg text-sm ${
                isOwn
                  ? "bg-amber-500 text-slate-900"
                  : "bg-slate-700 text-slate-100"
              }`}
            >
              <p className="break-words">{msg.text}</p>
              {msg.timestamp && (
                <p className={`text-xs mt-1 ${isOwn ? "text-amber-900/70" : "text-slate-400"}`}>
                  {msg.timestamp.toDate().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
