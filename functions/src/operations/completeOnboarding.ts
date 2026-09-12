import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";

/** Activates a newly created account, or completes setup on a newly linked device. */
export async function completeOnboarding(callerUid: string): Promise<void> {
  const db = getFirestore();
  const userRef = db.collection("users").doc(callerUid);
  const linkRef = db.collection("userLinks").doc(callerUid);

  await db.runTransaction(async (transaction) => {
    const linkSnapshot = await transaction.get(linkRef);
    const accountId = linkSnapshot.data()?.primaryUid;
    if (!linkSnapshot.exists || typeof accountId !== "string" || accountId.length === 0) {
      throw new HttpsError("failed-precondition", "This device is not connected to an account.");
    }

    const accountRef = db.collection("accounts").doc(accountId);
    const profileRef = db.collection("userProfiles").doc(accountId);
    const [accountSnapshot, profileSnapshot] = await Promise.all([
      transaction.get(accountRef),
      transaction.get(profileRef),
    ]);
    const firstName = profileSnapshot.data()?.firstName;
    if (
      !profileSnapshot.exists ||
      typeof firstName !== "string" ||
      firstName.trim().length === 0 ||
      firstName.length > 50
    ) {
      throw new HttpsError("failed-precondition", "This account does not have a valid profile.");
    }

    if (accountSnapshot.exists) {
      const account = accountSnapshot.data();
      if (account?.status === "provisional" && account?.createdByDeviceUid !== callerUid) {
        throw new HttpsError(
          "permission-denied",
          "Only the creating device can finish this setup."
        );
      }
      if (account?.status !== "provisional" && account?.status !== "active") {
        throw new HttpsError("failed-precondition", "This account is not available.");
      }
      if (account.status === "provisional") {
        transaction.update(accountRef, {
          status: "active",
          activatedAt: FieldValue.serverTimestamp(),
        });
      }
    }

    // A missing account record is a legacy account. It remains usable until
    // the one-off migration adds the explicit active record.
    transaction.set(userRef, { onboarded: true, recoveryBackedUp: true }, { merge: true });
  });
}
