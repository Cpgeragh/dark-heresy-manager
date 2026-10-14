import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import { HttpsError } from "firebase-functions/v2/https";
import { buildClaimLogPayload } from "../shared/claimLog.js";
import { hashRecoveryCode } from "../shared/recoveryCode.js";
import { resolvePrimaryUid } from "../shared/linkedIdentity.js";
import { purgeAccountChats } from "./purgeBinnedChats.js";

// Leaves room below Firestore's 500-write transaction limit for SDK or
// schema changes without turning an account deletion into a partial write.
const MAX_ACCOUNT_DELETION_WRITES = 440;
// Each chat costs two writes: the account's own copy and the other person's copy.
const MAX_ACCOUNT_DELETION_CHATS = MAX_ACCOUNT_DELETION_WRITES / 2;

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
  const chatsQuery = db
    .collection("users")
    .doc(accountId)
    .collection("chats")
    .limit(MAX_ACCOUNT_DELETION_CHATS + 1);

  const result = await db.runTransaction(
    async (transaction) => {
      const [ownedCampaigns, claimedCharacters, inboundLinks, secretSnapshot, ownChats] =
        await Promise.all([
          transaction.get(ownedCampaignsQuery),
          transaction.get(claimedCharactersQuery),
          transaction.get(inboundLinksQuery),
          transaction.get(secretRef),
          transaction.get(chatsQuery),
        ]);

      if (ownChats.size > MAX_ACCOUNT_DELETION_CHATS) {
        throw new HttpsError(
          "resource-exhausted",
          "This account has too many chats to delete safely in one operation."
        );
      }

      const otherCopyRefs = ownChats.docs.flatMap((chat) => {
        const other = chat.get("otherAccountId");
        return typeof other === "string" && other.length > 0
          ? [db.collection("users").doc(other).collection("chats").doc(chat.id)]
          : [];
      });
      const otherCopies =
        otherCopyRefs.length > 0 ? await transaction.getAll(...otherCopyRefs) : [];
      const copiesToClose = otherCopies.filter((copy) => copy.exists);

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
        claimedCharacters.size * 2 +
        campaignRefs.size +
        linkRefs.size * 2 +
        3 +
        identityIndexWrite +
        ownChats.size +
        copiesToClose.length;

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

      // The account's own copies go to the bin, so the daily purge removes them if the cleanup
      // after this transaction does not finish. The other person's copy only becomes closed.
      for (const chat of ownChats.docs) {
        transaction.update(chat.ref, {
          clearedAt: FieldValue.serverTimestamp(),
          unreadCount: 0,
        });
      }
      for (const copy of copiesToClose) transaction.update(copy.ref, { closed: true });

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
        chatRefs: ownChats.docs.map((chat) => chat.ref),
      };
    },
    { maxAttempts: 5 }
  );

  if (result.chatRefs.length > 0) {
    try {
      await purgeAccountChats(db, result.chatRefs);
    } catch (error) {
      logger.error("Could not remove a deleted account's chats straight away.", {
        code: (error as { code?: unknown } | null)?.code,
      });
    }
  }

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
