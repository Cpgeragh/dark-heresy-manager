import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { hashRecoveryCode } from "../shared/recoveryCode.js";

export interface GetIdentityRecoveryModeInput {
  code: string;
}

export interface GetIdentityRecoveryModeResult {
  mode: "link" | "reclaim";
}

/**
 * Chooses the only safe account-access action for a valid identity code.
 * Existing secondary links mean the account remains connected elsewhere, so
 * another device may only link. Reclaim is offered only when no link records
 * remain. The destructive operation repeats this check before changing data.
 */
export async function getIdentityRecoveryMode(
  input: GetIdentityRecoveryModeInput,
  callerUid: string,
  hmacSecret: string
): Promise<GetIdentityRecoveryModeResult> {
  const db = getFirestore();
  const code = input.code.trim();
  const hash = hashRecoveryCode(code, hmacSecret);
  const indexSnapshot = await db.collection("identityRecoveryIndex").doc(hash).get();

  if (!indexSnapshot.exists) {
    throw new HttpsError("not-found", "Recovery code not found.");
  }

  const primaryUid = indexSnapshot.data()?.uid;
  if (typeof primaryUid !== "string" || !primaryUid) {
    throw new HttpsError("failed-precondition", "Recovery identity is invalid.");
  }
  if (primaryUid === callerUid) {
    throw new HttpsError("failed-precondition", "This code belongs to this device.");
  }

  const profileSnapshot = await db.collection("userProfiles").doc(primaryUid).get();
  const firstName = profileSnapshot.exists ? profileSnapshot.data()?.firstName : undefined;
  if (
    !profileSnapshot.exists ||
    typeof firstName !== "string" ||
    firstName.length === 0 ||
    firstName.length > 50
  ) {
    throw new HttpsError("failed-precondition", "Recovery identity has no valid profile.");
  }

  const linkedDevicesSnapshot = await db
    .collection("userLinks")
    .where("primaryUid", "==", primaryUid)
    .limit(1)
    .get();

  return { mode: linkedDevicesSnapshot.empty ? "reclaim" : "link" };
}
