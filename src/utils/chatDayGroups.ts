// src/utils/chatDayGroups.ts

import type { ChatMessage } from "../types/Firestore";

export type ChatListItem =
  | { kind: "divider"; key: string; label: string }
  | { kind: "message"; key: string; message: ChatMessage };

export function startOfLocalDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function dayLabel(date: Date, now: Date): string {
  const day = startOfLocalDay(date);
  if (day === startOfLocalDay(now)) return "Today";
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime();
  if (day === yesterday) return "Yesterday";
  return date.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
}

export function buildChatListItems(
  messages: ChatMessage[],
  now: Date = new Date()
): ChatListItem[] {
  const items: ChatListItem[] = [];
  let currentDay: number | null = null;

  for (const message of messages) {
    const date = message.timestamp ? message.timestamp.toDate() : now;
    const day = startOfLocalDay(date);
    if (day !== currentDay) {
      currentDay = day;
      items.push({ kind: "divider", key: `day-${day}`, label: dayLabel(date, now) });
    }
    items.push({ kind: "message", key: message.id, message });
  }

  return items;
}
