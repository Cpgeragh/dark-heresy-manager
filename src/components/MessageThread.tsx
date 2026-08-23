// src/components/MessageThread.tsx

import { useEffect, useRef } from "react";
import type { ThreadMessage } from "../types/Firestore";

export function MessageThread({
  messages,
  currentUid,
  loading,
  onLoadOlder,
  loadingOlder,
  hasOlderMessages,
  olderError,
}: {
  messages: ThreadMessage[];
  currentUid: string;
  loading: boolean;
  onLoadOlder: () => void;
  loadingOlder: boolean;
  hasOlderMessages: boolean;
  olderError: Error | null;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const newestMessageId = messages.at(-1)?.id;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [newestMessageId]);

  if (loading) {
    return <p className="text-xs lg:text-sm text-slate-500 py-2">Loading messages…</p>;
  }

  if (messages.length === 0) {
    return <p className="text-xs lg:text-sm text-slate-500 py-2 text-center">No messages yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2 max-h-72 overflow-y-auto py-2 pr-1">
      {hasOlderMessages && (
        <button
          type="button"
          className="self-center text-xs lg:text-sm text-amber-400 hover:text-amber-300 disabled:text-slate-500"
          onClick={onLoadOlder}
          disabled={loadingOlder}
        >
          {loadingOlder ? "Loading older messages…" : "Load older messages"}
        </button>
      )}
      {olderError && (
        <p className="text-xs lg:text-sm text-red-400 text-center">
          Older messages could not be loaded. Try again.
        </p>
      )}
      {messages.map((msg) => {
        const isOwn = msg.fromUid === currentUid;
        return (
          <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] px-3 lg:px-4 py-2 lg:py-2.5 rounded-lg text-sm lg:text-base ${
                isOwn ? "bg-amber-500 text-slate-900" : "bg-slate-700 text-slate-100"
              }`}
            >
              <p className="break-words">{msg.text}</p>
              {msg.timestamp && (
                <p
                  className={`text-xs lg:text-sm mt-1 ${isOwn ? "text-amber-900/70" : "text-slate-400"}`}
                >
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
