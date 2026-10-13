// src/context/ChatInboxProvider.tsx
//
// Holds which part of the Messages modal is showing. The header button, the Message buttons and
// the character sheet open it through this context.

import { useCallback, useMemo, useState, type ReactNode } from "react";
import type { ChatTarget } from "../components/chat/chatTarget";
import { ChatInboxContext, type ChatInboxView } from "./useChatInbox";

export function ChatInboxProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<ChatInboxView>({ kind: "closed" });

  const openInbox = useCallback(() => setView({ kind: "list" }), []);
  const openChat = useCallback((target: ChatTarget) => setView({ kind: "chat", target }), []);
  const close = useCallback(() => setView({ kind: "closed" }), []);

  const value = useMemo(
    () => ({ view, openInbox, openChat, close }),
    [view, openInbox, openChat, close]
  );

  return <ChatInboxContext.Provider value={value}>{children}</ChatInboxContext.Provider>;
}
