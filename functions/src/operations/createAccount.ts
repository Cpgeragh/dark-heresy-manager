// functions/src/operations/createAccount.ts
//
// Gives a brand-new device its own account: a fresh id that was never any
// device's login, this device's own link record pointing at it, and the
// account's first recovery code. Every device an account ever has, this one
// included, only ever gets in through a link record.

import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { generateRecoveryCode, hashRecoveryCode } from "../shared/recoveryCode.js";
import { validateDeviceName } from "../shared/deviceLinks.js";

export interface CreateAccountInput {
  deviceName: string;
}

export interface CreateAccountResult {
  accountId: string;
  code: string;
}

export async function createAccount(
  input: CreateAccountInput,
  callerUid: string,
  hmacSecret: string
): Promise<CreateAccountResult> {
  const db = getFirestore();
  const deviceName = validateDeviceName(input.deviceName);

  const linkRef = db.collection("userLinks").doc(callerUid);
  const userRef = db.collection("users").doc(callerUid);
  const newAccountId = db.collection("accounts").doc().id;
  const newCode = generateRecoveryCode();
  const newHash = hashRecoveryCode(newCode, hmacSecret);

  return db.runTransaction(async (transaction) => {
    const [existingLink, userSnapshot] = await Promise.all([
      transaction.get(linkRef),
      transaction.get(userRef),
    ]);
    if (!userSnapshot.exists || userSnapshot.data()?.onboarded !== false) {
      throw new HttpsError("failed-precondition", "This device has already completed setup.");
    }

    // A response can be lost after a successful transaction. Returning the
    // same provisional account makes retrying account creation safe.
    if (existingLink.exists) {
      const accountId = existingLink.data()?.primaryUid;
      if (typeof accountId !== "string" || accountId.length === 0) {
        throw new HttpsError("failed-precondition", "This device has an invalid account link.");
      }
      const [accountSnapshot, secretSnapshot] = await Promise.all([
        transaction.get(db.collection("accounts").doc(accountId)),
        transaction.get(db.collection("identitySecret").doc(accountId)),
      ]);
      const code = secretSnapshot.data()?.code;
      if (
        accountSnapshot.exists &&
        accountSnapshot.data()?.status === "provisional" &&
        accountSnapshot.data()?.createdByDeviceUid === callerUid &&
        typeof code === "string" &&
        code.length > 0
      ) {
        if (existingLink.data()?.name !== deviceName) {
          transaction.update(linkRef, { name: deviceName });
        }
        return { accountId, code };
      }
      throw new HttpsError(
        "failed-precondition",
        "This device is already connected to an account."
      );
    }

    const accountRef = db.collection("accounts").doc(newAccountId);
    const secretRef = db.collection("identitySecret").doc(newAccountId);
    const indexRef = db.collection("identityRecoveryIndex").doc(newHash);
    const indexSnapshot = await transaction.get(indexRef);
    if (indexSnapshot.exists) {
      throw new HttpsError("already-exists", "Please try creating the account again.");
    }

    transaction.create(accountRef, {
      status: "provisional",
      createdByDeviceUid: callerUid,
      createdAt: FieldValue.serverTimestamp(),
    });
    transaction.create(linkRef, {
      primaryUid: newAccountId,
      name: deviceName,
      linkedAt: FieldValue.serverTimestamp(),
    });
    transaction.create(secretRef, { code: newCode });
    transaction.create(indexRef, { uid: newAccountId });

    return { accountId: newAccountId, code: newCode };
  });
}
