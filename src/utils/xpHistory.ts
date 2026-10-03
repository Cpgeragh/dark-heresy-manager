import type { Timestamp } from "firebase/firestore";
import type { XpHistoryDocument, XpHistorySource } from "../types/Firestore";

export type XpHistoryEntry = XpHistoryDocument & { id: string };

const SOURCES: readonly XpHistorySource[] = [
  "opening-balance",
  "manual-adjustment",
  "session-award",
  "session-reversal",
];

export function validateXpHistoryPayload(data: unknown): data is XpHistoryDocument {
  if (typeof data !== "object" || data === null || Array.isArray(data)) return false;
  const record = data as Record<string, unknown>;
  return (
    Number.isSafeInteger(record.amountXp) &&
    Number.isSafeInteger(record.balanceXp) &&
    (record.balanceXp as number) >= 0 &&
    typeof record.reason === "string" &&
    SOURCES.includes(record.source as XpHistorySource) &&
    typeof record.actorUid === "string" &&
    (record.actorRole === "dm" || record.actorRole === "player") &&
    record.createdAt !== undefined
  );
}

export function xpHistoryDate(createdAt: XpHistoryDocument["createdAt"]): Date | null {
  if (createdAt instanceof Date) return createdAt;
  const timestamp = createdAt as Timestamp;
  return typeof timestamp?.toDate === "function" ? timestamp.toDate() : null;
}
