import type { Firestore } from "firebase-admin/firestore";

const USER_LINKS_COLLECTION = "userLinks";

/**
 * Returns true when the caller is the stored primary identity or a device
 * explicitly linked to it. Server operations must use this wherever the
 * Firestore rules use dmOwnsOrLinked/playerOwnsOrLinked, otherwise a linked
 * browser can pass the UI/rules checks but be rejected by the callable.
 */
export async function callerIsPrimaryOrLinked(
  db: Firestore,
  callerUid: string,
  primaryUid: unknown
): Promise<boolean> {
  if (typeof primaryUid !== "string" || primaryUid.length === 0) return false;
  if (callerUid === primaryUid) return true;

  const linkSnapshot = await db.collection(USER_LINKS_COLLECTION).doc(callerUid).get();
  return linkSnapshot.exists && linkSnapshot.data()?.primaryUid === primaryUid;
}
