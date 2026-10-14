import { createContext, useContext } from "react";
import type { ChatSummaryWithId } from "../types/Firestore";

export interface ChatsContextValue {
  chats: ChatSummaryWithId[];
  activeChats: ChatSummaryWithId[];
  clearedChats: ChatSummaryWithId[];
  loading: boolean;
  error: Error | null;
  unreadTotal: number;
}

export const ChatsContext = createContext<ChatsContextValue>({
  chats: [],
  activeChats: [],
  clearedChats: [],
  loading: true,
  error: null,
  unreadTotal: 0,
});

export function useChatsContext() {
  return useContext(ChatsContext);
}
