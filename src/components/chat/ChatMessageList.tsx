// src/components/chat/ChatMessageList.tsx

import { useEffect, useRef } from "react";
import type { ChatMessage } from "../../types/Firestore";
import { buildChatListItems } from "../../utils/chatDayGroups";
import { isPendingMessage } from "../../utils/chatPending";
import { recordComponentRender } from "../../performance/performanceMetrics";
import { LoadingDots } from "../../ui/LoadingDots";
import {
  uiInactiveItem,
  uiInlineRow,
  uiTextError,
  uiTextMeta,
  uiTextPlaceholder,
} from "../../ui/styles/editableStyles";
import {
  colourAmberFill,
  colourAmberPlain,
  colourDivider,
  colourFillRaised,
  colourMetadataLabelText,
  colourOnAmberDim,
  colourTextPrimary,
} from "../../ui/styles/colourTokens";
import { uiFocusRing, uiPressFeedback } from "../../ui/styles/buttonStyles";

interface ChatMessageListProps {
  messages: ChatMessage[];
  currentAccountId: string;
  onLoadOlder: () => void;
  loadingOlder: boolean;
  hasOlderMessages: boolean;
  olderError: Error | null;
}

export function ChatMessageList({
  messages,
  currentAccountId,
  onLoadOlder,
  loadingOlder,
  hasOlderMessages,
  olderError,
}: ChatMessageListProps) {
  recordComponentRender("ChatMessageList");
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
    <div className="flex flex-col gap-2 py-2 pr-1">
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
      {buildChatListItems(messages).map((item) => {
        if (item.kind === "divider") {
          return (
            <div key={item.key} className={`${uiInlineRow} py-1`}>
              <span aria-hidden="true" className={`flex-1 border-t ${colourDivider}`} />
              <span className={uiTextMeta}>{item.label}</span>
              <span aria-hidden="true" className={`flex-1 border-t ${colourDivider}`} />
            </div>
          );
        }

        const { message } = item;
        const isOwn = message.fromAccountId === currentAccountId;
        const isPending = isPendingMessage(message);
        return (
          <div
            key={item.key}
            aria-busy={isPending || undefined}
            className={`flex ${isOwn ? "justify-end" : "justify-start"} ${isPending ? uiInactiveItem : ""}`}
          >
            <div
              className={`max-w-[75%] px-3 lg:px-4 py-2 lg:py-2.5 rounded-lg text-sm lg:text-base ${
                isOwn ? colourAmberFill : `${colourFillRaised} ${colourTextPrimary}`
              }`}
            >
              <p className="break-words">{message.text}</p>
              {message.timestamp && !isPending && (
                <p
                  className={`text-xs lg:text-sm mt-1 ${isOwn ? colourOnAmberDim : colourMetadataLabelText}`}
                >
                  {message.timestamp.toDate().toLocaleTimeString([], {
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
