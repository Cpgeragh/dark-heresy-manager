import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { buildClaimLogPayload } from "../shared/claimLog.js";
import { hashRecoveryCode } from "../shared/recoveryCode.js";
import { resolvePrimaryUid } from "../shared/linkedIdentity.js";

// Leaves room below Firestore's 500-write transaction limit for SDK or
// schema changes without turning an account deletion into a partial write.
const MAX_ACCOUNT_DELETION_WRITES = 440;

export interface DeleteAccountResult {
  releasedCharacters: number;
  removedLinkedDevices: number;
}

export async function deleteAccount(
  callerUid: string,
  hmacSecret: string
): Promise<DeleteAccountResult> {
  const db = getFirestore();
  const accountId = await resolvePrimaryUid(db, callerUid);
  const ownedCampaignsQuery = db.collection("campaigns").where("dmId", "==", accountId).limit(1);
  const claimedCharactersQuery = db.collectionGroup("characters").where("userId", "==", accountId);
  const inboundLinksQuery = db.collection("userLinks").where("primaryUid", "==", accountId);
  const secretRef = db.collection("identitySecret").doc(accountId);

  const result = await db.runTransaction(
    async (transaction) => {
      const [ownedCampaigns, claimedCharacters, inboundLinks, secretSnapshot] = await Promise.all([
        transaction.get(ownedCampaignsQuery),
        transaction.get(claimedCharactersQuery),
        transaction.get(inboundLinksQuery),
        transaction.get(secretRef),
      ]);

      if (!ownedCampaigns.empty) {
        throw new HttpsError(
          "failed-precondition",
          "Delete or transfer every campaign you own before deleting your account."
        );
      }

      const linkRefs = new Map<string, FirebaseFirestore.DocumentReference>();
      for (const link of inboundLinks.docs) linkRefs.set(link.ref.path, link.ref);

      const campaignRefs = new Map<string, FirebaseFirestore.DocumentReference>();
      for (const character of claimedCharacters.docs) {
        const campaignRef = character.ref.parent.parent;
        if (!campaignRef) {
          throw new HttpsError("internal", "A claimed character has an invalid campaign path.");
        }
        campaignRefs.set(campaignRef.path, campaignRef);
      }

      const identityCode = secretSnapshot.exists ? secretSnapshot.data()?.code : undefined;
      const identityIndexWrite =
        typeof identityCode === "string" && identityCode.length > 0 ? 1 : 0;
      const writeCount =
        claimedCharacters.size * 2 + campaignRefs.size + linkRefs.size * 2 + 3 + identityIndexWrite;

      if (writeCount > MAX_ACCOUNT_DELETION_WRITES) {
        throw new HttpsError(
          "resource-exhausted",
          "This account owns too many records to delete safely in one operation. Release some characters and try again."
        );
      }

      for (const character of claimedCharacters.docs) {
        transaction.update(character.ref, { userId: null, isEditableByPlayer: false });
        transaction.set(
          character.ref.collection("claimLog").doc(),
          buildClaimLogPayload("release", callerUid, accountId, null)
        );
      }
      for (const campaignRef of campaignRefs.values()) {
        transaction.update(campaignRef, { memberIds: FieldValue.arrayRemove(accountId) });
      }

      if (typeof identityCode === "string" && identityCode.length > 0) {
        transaction.delete(
          db.collection("identityRecoveryIndex").doc(hashRecoveryCode(identityCode, hmacSecret))
        );
      }
      transaction.delete(secretRef);
      transaction.delete(db.collection("userProfiles").doc(accountId));
      transaction.delete(db.collection("accounts").doc(accountId));
      for (const linkRef of linkRefs.values()) {
        transaction.delete(linkRef);
        transaction.set(
          db.collection("users").doc(linkRef.id),
          { onboarded: false, recoveryBackedUp: false },
          { merge: true }
        );
      }

      return {
        releasedCharacters: claimedCharacters.size,
        removedLinkedDevices: linkRefs.size,
        deviceUids: [...linkRefs.values()].map((reference) => reference.id),
      };
    },
    { maxAttempts: 5 }
  );

  try {
    const deviceUids = result.deviceUids.length > 0 ? result.deviceUids : [callerUid];
    const deletion = await getAuth().deleteUsers(deviceUids);
    if (deletion.failureCount > 0) {
      throw new HttpsError(
        "internal",
        "The account was deleted, but a device session could not be cleared."
      );
    }
  } catch (error) {
    if ((error as { code?: string } | null)?.code !== "auth/user-not-found") throw error;
  }

  return {
    releasedCharacters: result.releasedCharacters,
    removedLinkedDevices: result.removedLinkedDevices,
  };
}
