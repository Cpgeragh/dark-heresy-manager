import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { hashRecoveryCode } from "../shared/recoveryCode.js";

/** Removes only the provisional identity data belonging to unfinished onboarding. */
export async function discardOnboardingSetup(callerUid: string, hmacSecret: string): Promise<void> {
  const db = getFirestore();
  const userRef = db.collection("users").doc(callerUid);
  const secretRef = db.collection("identitySecret").doc(callerUid);
  const profileRef = db.collection("userProfiles").doc(callerUid);

  await db.runTransaction(
    async (transaction) => {
      const [userSnapshot, secretSnapshot] = await Promise.all([
        transaction.get(userRef),
        transaction.get(secretRef),
      ]);

      if (!userSnapshot.exists || userSnapshot.data()?.onboarded !== false) {
        throw new HttpsError(
          "failed-precondition",
          "Only an unfinished account setup can be discarded."
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
    },
    { maxAttempts: 5 }
  );
}
