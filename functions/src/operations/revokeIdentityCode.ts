import { getFirestore } from "firebase-admin/firestore";
import { hashRecoveryCode } from "../shared/recoveryCode.js";

export async function revokeIdentityCode(callerUid: string, hmacSecret: string): Promise<void> {
  const db = getFirestore();
  const secretRef = db.collection("identitySecret").doc(callerUid);

  await db.runTransaction(
    async (transaction) => {
      const secretSnapshot = await transaction.get(secretRef);
      if (!secretSnapshot.exists) return;

      const code = secretSnapshot.data()?.code;
      if (typeof code === "string" && code.length > 0) {
        transaction.delete(
          db.collection("identityRecoveryIndex").doc(hashRecoveryCode(code, hmacSecret))
        );
      }
      transaction.delete(secretRef);
    },
    { maxAttempts: 5 }
  );
}
