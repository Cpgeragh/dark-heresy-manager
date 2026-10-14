// src/utils/chatBin.ts

import type { Timestamp } from "firebase/firestore";
import { CHAT_LIMITS } from "shared-rules";

const DAY_MS = 24 * 60 * 60 * 1000;

interface BinnableChat {
  clearedAt?: Timestamp | null;
  lastTimestamp?: Timestamp | null;
}

export function isChatBinned(chat: BinnableChat): boolean {
  if (!chat.clearedAt) return false;
  if (!chat.lastTimestamp) return true;
  return chat.lastTimestamp.toMillis() <= chat.clearedAt.toMillis();
}

export function daysLeftInBin(clearedAt: Timestamp, now: Date = new Date()): number {
  const remaining = clearedAt.toMillis() + CHAT_LIMITS.binRetentionDays * DAY_MS - now.getTime();
  return Math.max(0, Math.ceil(remaining / DAY_MS));
}
