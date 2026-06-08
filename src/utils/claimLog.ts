// src/utils/claimLog.ts

import { serverTimestamp, type FieldValue, type Timestamp } from "firebase/firestore";

export type ClaimLogAction = "claim" | "release" | "force-assign" | "force-release";

export type ClaimLogEntry = {
  id?: string;
  action: ClaimLogAction;
  actorUid: string;
  previousOwnerUid: string | null;
  newOwnerUid: string | null;
  timestamp?: FieldValue | Timestamp;
};

export function validateClaimLogPayload(data: unknown): data is ClaimLogEntry {
  if (typeof data !== "object" || data === null) return false;
  const record = data as Record<string, unknown>;
  if (typeof record.action !== "string") return false;
  if (!["claim", "release", "force-assign", "force-release"].includes(record.action)) return false;
  if (typeof record.actorUid !== "string") return false;
  return true;
}

export function buildClaimLogPayload(
  action: ClaimLogAction,
  actorUid: string,
  previousOwnerUid: string | null,
  newOwnerUid: string | null
): Omit<ClaimLogEntry, "id"> {
  return {
    action,
    actorUid,
    previousOwnerUid,
    newOwnerUid,
    timestamp: serverTimestamp(),
  };
}
