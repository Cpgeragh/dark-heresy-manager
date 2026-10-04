// src/utils/claimLog.ts

import type { FieldValue, Timestamp } from "firebase/firestore";
import { CLAIM_LOG_ACTIONS, type ClaimLogAction } from "shared-rules";

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
  if (!(CLAIM_LOG_ACTIONS as readonly string[]).includes(record.action)) return false;
  if (typeof record.actorUid !== "string") return false;
  return true;
}
