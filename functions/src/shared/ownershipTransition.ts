// functions/src/shared/ownershipTransition.ts
//
// Stage 3.3: the character-ownership + claim-log writes shared by release,
// force-assign, and force-release. Each caller does its own permission
// check and its own fresh-inside-transaction precondition check; this only
// bundles the write shape once that's verified.
//
// Stage 5.3: also removes the previous owner from the campaign's memberIds
// when this transition takes away their last character in the campaign,
// covering release and force-release, since either can leave someone with
// no characters left here. Force-assign now accepts only unclaimed characters.

import { FieldValue } from "firebase-admin/firestore";
import type { Transaction, DocumentReference } from "firebase-admin/firestore";
import { buildClaimLogPayload, type ClaimLogAction } from "./claimLog.js";

export async function applyOwnershipTransition(
  transaction: Transaction,
  campaignRef: DocumentReference,
  characterRef: DocumentReference,
  action: ClaimLogAction,
  actorUid: string,
  previousOwnerUid: string | null,
  newOwnerUid: string | null,
  options: { newOwnerAlreadyMember?: boolean } = {}
): Promise<void> {
  const losingOwner = previousOwnerUid !== null && previousOwnerUid !== newOwnerUid;

  let removeFromMembership = false;
  if (losingOwner) {
    const remainingSnapshot = await transaction.get(
      campaignRef.collection("characters").where("userId", "==", previousOwnerUid)
    );
    removeFromMembership = !remainingSnapshot.docs.some((doc) => doc.id !== characterRef.id);
  }

  let membershipUpdate: { memberIds: unknown } | null = null;
  if (newOwnerUid !== null && removeFromMembership) {
    // Firestore can't apply arrayUnion and arrayRemove to the same field in
    // one write, so a direct ownership replacement reads the current list
    // and writes the replacement directly instead.
    const campaignSnapshot = await transaction.get(campaignRef);
    const currentMemberIds = (campaignSnapshot.data()?.memberIds as string[] | undefined) ?? [];
    const nextMemberIds = currentMemberIds.filter((id) => id !== previousOwnerUid);
    if (!nextMemberIds.includes(newOwnerUid)) nextMemberIds.push(newOwnerUid);
    membershipUpdate = { memberIds: nextMemberIds };
  } else if (newOwnerUid !== null && !options.newOwnerAlreadyMember) {
    membershipUpdate = { memberIds: FieldValue.arrayUnion(newOwnerUid) };
  } else if (removeFromMembership) {
    membershipUpdate = { memberIds: FieldValue.arrayRemove(previousOwnerUid) };
  }

  transaction.update(characterRef, {
    userId: newOwnerUid,
    isEditableByPlayer: newOwnerUid !== null,
  });
  if (membershipUpdate) {
    transaction.update(campaignRef, membershipUpdate);
  }
  transaction.set(
    characterRef.collection("claimLog").doc(),
    buildClaimLogPayload(action, actorUid, previousOwnerUid, newOwnerUid)
  );
}
