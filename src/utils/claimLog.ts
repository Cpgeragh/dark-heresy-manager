// src/utils/claimLog.ts

import { serverTimestamp } from "firebase/firestore";

export type ClaimLogAction =
  | "claim"
  | "release"
  | "force-assign"
  | "force-release";

export type ClaimLogEntry = {
  id?: string;
  action: ClaimLogAction;
  actorUid: string;
  previousOwnerUid: string | null;
  newOwnerUid: string | null;
  timestamp?: any;
};

export function validateClaimLogPayload(data: any): data is ClaimLogEntry {
  if (typeof data !== "object" || data === null) return false;
  if (typeof data.action !== "string") return false;
  if (!["claim", "release", "force-assign", "force-release"].includes(data.action))
    return false;
  if (typeof data.actorUid !== "string") return false;

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