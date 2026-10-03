import {
  FieldValue,
  type DocumentReference,
  type Firestore,
  type Transaction,
} from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { callerIsPrimaryOrLinked, resolvePrimaryUid } from "./linkedIdentity.js";

export const CHARACTER_XP_TOTAL_MAX = 10_000_000;
export const XP_HISTORY_REASON_CHARACTERS_MAX = 4_000;

export type XpHistorySource =
  | "opening-balance"
  | "manual-adjustment"
  | "session-award"
  | "session-reversal";

export interface XpHistoryActor {
  uid: string;
  name?: string;
  role: "dm" | "player";
}

export interface XpHistoryEntryInput {
  amountXp: number;
  balanceXp: number;
  reason: string;
  source: XpHistorySource;
  sessionId?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readExperience(characterData: Record<string, unknown>): {
  experience: Record<string, unknown>;
  totalXp: number;
  spentXp: number;
} {
  const experience = characterData.experience;
  if (!isRecord(experience)) {
    throw new HttpsError("failed-precondition", "Stored character Experience is invalid.");
  }
  const totalXp = experience.total;
  const spentXp = experience.spent;
  if (
    !Number.isSafeInteger(totalXp) ||
    (totalXp as number) < 0 ||
    (totalXp as number) > CHARACTER_XP_TOTAL_MAX ||
    !Number.isSafeInteger(spentXp) ||
    (spentXp as number) < 0
  ) {
    throw new HttpsError("failed-precondition", "Stored character Experience is invalid.");
  }
  return { experience, totalXp: totalXp as number, spentXp: spentXp as number };
}

export function assertValidXpReason(reason: unknown): asserts reason is string {
  if (typeof reason !== "string" || reason.trim().length === 0) {
    throw new HttpsError("invalid-argument", "An XP adjustment reason is required.");
  }
  if (reason.length > XP_HISTORY_REASON_CHARACTERS_MAX) {
    throw new HttpsError(
      "invalid-argument",
      `An XP adjustment reason cannot exceed ${XP_HISTORY_REASON_CHARACTERS_MAX} characters.`
    );
  }
}

export function assertValidXpAmount(amountXp: unknown): asserts amountXp is number {
  if (!Number.isSafeInteger(amountXp) || amountXp === 0) {
    throw new HttpsError("invalid-argument", "The XP adjustment must be a non-zero whole number.");
  }
}

export async function resolveXpHistoryActor(
  db: Firestore,
  callerUid: string,
  dmId: unknown
): Promise<XpHistoryActor> {
  const uid = await resolvePrimaryUid(db, callerUid);
  const isDm = await callerIsPrimaryOrLinked(db, callerUid, dmId);
  const profile = await db.collection("userProfiles").doc(uid).get();
  const firstName = profile.data()?.firstName;
  return {
    uid,
    ...(typeof firstName === "string" && firstName.trim().length > 0
      ? { name: firstName.trim() }
      : {}),
    role: isDm ? "dm" : "player",
  };
}

function entryData(entry: XpHistoryEntryInput, actor: XpHistoryActor) {
  return {
    ...entry,
    actorUid: actor.uid,
    ...(actor.name ? { actorName: actor.name } : {}),
    actorRole: actor.role,
    createdAt: FieldValue.serverTimestamp(),
  };
}

export function stageOpeningBalance(
  transaction: Transaction,
  openingRef: DocumentReference,
  openingExists: boolean,
  totalXp: number,
  actor: XpHistoryActor
): void {
  if (openingExists) return;
  transaction.set(
    openingRef,
    entryData(
      {
        amountXp: totalXp,
        balanceXp: totalXp,
        reason: "Opening balance",
        source: "opening-balance",
      },
      actor
    )
  );
}

export function stageXpHistoryEntry(
  transaction: Transaction,
  historyRef: DocumentReference,
  entry: XpHistoryEntryInput,
  actor: XpHistoryActor
): void {
  transaction.set(historyRef, entryData(entry, actor));
}
