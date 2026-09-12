import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { hashRecoveryCode } from "../shared/recoveryCode.js";

/**
 * Removes only the provisional identity data belonging to unfinished
 * onboarding. Account creation gives this device its own link record before
 * the account's name and identity data exist, so the data to remove lives
 * under the resolved account id, not under this device's own uid, and the
 * link record itself has to go too, or the device would stay connected to
 * an account with nothing left in it.
 */
export async function discardOnboardingSetup(callerUid: string, hmacSecret: string): Promise<void> {
  const db = getFirestore();
  const userRef = db.collection("users").doc(callerUid);
  const linkRef = db.collection("userLinks").doc(callerUid);
  await db.runTransaction(
    async (transaction) => {
      const [userSnapshot, linkSnapshot] = await Promise.all([
        transaction.get(userRef),
        transaction.get(linkRef),
      ]);

      if (!userSnapshot.exists || userSnapshot.data()?.onboarded !== false) {
        throw new HttpsError(
          "failed-precondition",
          "Only an unfinished account setup can be discarded."
        );
      }

      const accountId = linkSnapshot.data()?.primaryUid;
      if (!linkSnapshot.exists || typeof accountId !== "string" || accountId.length === 0) {
        return;
      }

      const accountRef = db.collection("accounts").doc(accountId);
      const secretRef = db.collection("identitySecret").doc(accountId);
      const profileRef = db.collection("userProfiles").doc(accountId);
      const [accountSnapshot, secretSnapshot] = await Promise.all([
        transaction.get(accountRef),
        transaction.get(secretRef),
      ]);

      if (
        !accountSnapshot.exists ||
        accountSnapshot.data()?.status !== "provisional" ||
        accountSnapshot.data()?.createdByDeviceUid !== callerUid
      ) {
        throw new HttpsError(
          "failed-precondition",
          "Only the account created by this unfinished setup can be discarded."
        );
      }

      const code = secretSnapshot.exists ? secretSnapshot.data()?.code : undefined;
      if (typeof code === "string" && code.length > 0) {
        transaction.delete(
          db.collection("identityRecoveryIndex").doc(hashRecoveryCode(code, hmacSecret))
        );
      }

      transaction.delete(secretRef);
      transaction.delete(profileRef);
      transaction.delete(accountRef);
      transaction.delete(linkRef);
    },
    { maxAttempts: 5 }
  );
}
