// src/components/MessageThread.tsx

import { useEffect, useRef } from "react";
import type { ThreadMessage } from "../types/Firestore";
import { recordComponentRender } from "../performance/performanceMetrics";
import { LoadingDots } from "../ui/LoadingDots";
import { uiTextError, uiTextPlaceholder } from "../ui/styles/editableStyles";
import {
  colourMetadataLabelText,
  colourTextPrimary,
  colourAmberPlain,
  colourAmberFill,
  colourOnAmberDim,
  colourFillRaised,
} from "../ui/styles/colourTokens";
import { uiFocusRing, uiPressFeedback } from "../ui/styles/buttonStyles";

export function MessageThread({
  messages,
  currentUid,
  onLoadOlder,
  loadingOlder,
  hasOlderMessages,
  olderError,
}: {
  messages: ThreadMessage[];
  currentUid: string;
  onLoadOlder: () => void;
  loadingOlder: boolean;
  hasOlderMessages: boolean;
  olderError: Error | null;
}) {
  recordComponentRender("MessageThread");
  const bottomRef = useRef<HTMLDivElement>(null);
  const newestMessageId = messages.at(-1)?.id;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [newestMessageId]);

  if (messages.length === 0) {
    return (
      <p className={`text-xs lg:text-sm ${uiTextPlaceholder} py-2 text-center`}>No messages yet.</p>
    );
  }

  return (
    <div className="flex flex-col gap-2 max-h-72 overflow-y-auto py-2 pr-1">
      {hasOlderMessages && (
        <button
          type="button"
          className={`self-center text-xs lg:text-sm ${colourAmberPlain} ${uiPressFeedback(
            !loadingOlder
          )} ${uiFocusRing} ${loadingOlder ? "cursor-wait" : ""}`}
          onClick={onLoadOlder}
          disabled={loadingOlder}
        >
          {loadingOlder ? (
            <span>
              Loading older messages
              <LoadingDots />
            </span>
          ) : (
            "Load older messages"
          )}
        </button>
      )}
      {olderError && (
        <p className={`text-xs lg:text-sm ${uiTextError} text-center`}>
          Older messages could not be loaded. Try again.
        </p>
      )}
      {messages.map((msg) => {
        const isOwn = msg.fromUid === currentUid;
        return (
          <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] px-3 lg:px-4 py-2 lg:py-2.5 rounded-lg text-sm lg:text-base ${
                isOwn ? colourAmberFill : `${colourFillRaised} ${colourTextPrimary}`
              }`}
            >
              <p className="break-words">{msg.text}</p>
              {msg.timestamp && (
                <p
                  className={`text-xs lg:text-sm mt-1 ${isOwn ? colourOnAmberDim : colourMetadataLabelText}`}
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
