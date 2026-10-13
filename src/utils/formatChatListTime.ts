// src/utils/formatChatListTime.ts

import { startOfLocalDay } from "./chatDayGroups";

export function formatChatListTime(date: Date, now: Date = new Date()): string {
  const day = startOfLocalDay(date);
  if (day === startOfLocalDay(now)) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime();
  if (day === yesterday) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}
