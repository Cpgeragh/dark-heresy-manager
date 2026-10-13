// src/context/useChatInbox.ts

import { createContext, useContext } from "react";
import type { ChatTarget } from "../components/chat/chatTarget";

export type ChatInboxView =
  | { kind: "closed" }
  | { kind: "list" }
  | { kind: "chat"; target: ChatTarget };

export interface ChatInboxContextValue {
  view: ChatInboxView;
  openInbox: () => void;
  openChat: (target: ChatTarget) => void;
  close: () => void;
}

export const ChatInboxContext = createContext<ChatInboxContextValue>({
  view: { kind: "closed" },
  openInbox: () => undefined,
  openChat: () => undefined,
  close: () => undefined,
});

export function useChatInbox() {
  return useContext(ChatInboxContext);
}
