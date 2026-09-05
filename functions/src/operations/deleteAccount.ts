import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { buildClaimLogPayload } from "../shared/claimLog.js";
import { hashRecoveryCode } from "../shared/recoveryCode.js";

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
  const ownedCampaignsQuery = db.collection("campaigns").where("dmId", "==", callerUid).limit(1);
  const claimedCharactersQuery = db.collectionGroup("characters").where("userId", "==", callerUid);
  const inboundLinksQuery = db.collection("userLinks").where("primaryUid", "==", callerUid);
  const ownLinkRef = db.collection("userLinks").doc(callerUid);
  const secretRef = db.collection("identitySecret").doc(callerUid);

  const result = await db.runTransaction(
    async (transaction) => {
      const [ownedCampaigns, claimedCharacters, inboundLinks, ownLinkSnapshot, secretSnapshot] =
        await Promise.all([
          transaction.get(ownedCampaignsQuery),
          transaction.get(claimedCharactersQuery),
          transaction.get(inboundLinksQuery),
          transaction.get(ownLinkRef),
          transaction.get(secretRef),
        ]);

      if (ownLinkSnapshot.exists) {
        throw new HttpsError(
          "failed-precondition",
          "Unlink this secondary device before deleting an account."
        );
      }

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
        claimedCharacters.size * 2 + campaignRefs.size + linkRefs.size + 3 + identityIndexWrite;

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
          buildClaimLogPayload("release", callerUid, callerUid, null)
        );
      }
      for (const campaignRef of campaignRefs.values()) {
        transaction.update(campaignRef, { memberIds: FieldValue.arrayRemove(callerUid) });
      }

      if (typeof identityCode === "string" && identityCode.length > 0) {
        transaction.delete(
          db.collection("identityRecoveryIndex").doc(hashRecoveryCode(identityCode, hmacSecret))
        );
      }
      transaction.delete(secretRef);
      transaction.delete(db.collection("users").doc(callerUid));
      transaction.delete(db.collection("userProfiles").doc(callerUid));
      for (const linkRef of linkRefs.values()) transaction.delete(linkRef);

      return {
        releasedCharacters: claimedCharacters.size,
        removedLinkedDevices: linkRefs.size,
      };
    },
    { maxAttempts: 5 }
  );

  try {
    await getAuth().deleteUser(callerUid);
  } catch (error) {
    if ((error as { code?: string } | null)?.code !== "auth/user-not-found") throw error;
  }

  return result;
}
