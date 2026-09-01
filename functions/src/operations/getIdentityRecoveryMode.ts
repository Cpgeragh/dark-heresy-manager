import { getFirestore } from "firebase-admin/firestore";
import { hashRecoveryCode } from "../shared/recoveryCode.js";

export interface GetIdentityRecoveryModeInput {
  code: string;
}

export type GetIdentityRecoveryModeResult =
  | { status: "found"; mode: "link" | "reclaim" }
  | { status: "not-found" }
  | { status: "own-code" }
  | { status: "missing-data" };

/**
 * Chooses the only safe account-access action for a valid identity code.
 * Existing secondary links mean the account remains connected elsewhere, so
 * another device may only link. Reclaim is offered only when no link records
 * remain. The destructive operation repeats this check before changing data.
 * Every negative outcome returns a normal result rather than throwing, so a
 * caller probing for a valid code sees no distinguishable response shape.
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
    return { status: "not-found" };
  }

  const primaryUid = indexSnapshot.data()?.uid;
  if (typeof primaryUid !== "string" || !primaryUid) {
    return { status: "missing-data" };
  }
  if (primaryUid === callerUid) {
    return { status: "own-code" };
  }

  const profileSnapshot = await db.collection("userProfiles").doc(primaryUid).get();
  const firstName = profileSnapshot.exists ? profileSnapshot.data()?.firstName : undefined;
  if (
    !profileSnapshot.exists ||
    typeof firstName !== "string" ||
    firstName.length === 0 ||
    firstName.length > 50
  ) {
    return { status: "missing-data" };
  }

  const linkedDevicesSnapshot = await db
    .collection("userLinks")
    .where("primaryUid", "==", primaryUid)
    .limit(1)
    .get();

  return { status: "found", mode: linkedDevicesSnapshot.empty ? "reclaim" : "link" };
}
