import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { resolvePrimaryUid } from "../shared/linkedIdentity.js";

/** The caller chooses no account id. Only its own linked identity is read. */
export async function revealIdentityCode(callerUid: string): Promise<{ code: string | null }> {
  const db = getFirestore();
  const accountId = await resolvePrimaryUid(db, callerUid);
  const snapshot = await db.collection("identitySecret").doc(accountId).get();
  if (!snapshot.exists) return { code: null };
  const code = snapshot.data()?.code;
  if (typeof code !== "string" || !code.trim()) {
    throw new HttpsError("internal", "The account recovery code is unavailable.");
  }
  return { code };
}
