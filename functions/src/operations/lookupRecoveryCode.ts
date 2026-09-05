// functions/src/operations/lookupRecoveryCode.ts
//
// Resolves a raw Recovery Code to a minimal, safe claim preview
// server-side. Only the fields ClaimPreview.tsx actually renders are
// returned, never the full character or campaign document, so a claim
// preview can't be used to read data beyond what the UI shows.

import { getFirestore } from "firebase-admin/firestore";
import { hashRecoveryCode } from "../shared/recoveryCode.js";

const RECOVERY_INDEX_COLLECTION = "recoveryIndex";

export interface LookupRecoveryCodeInput {
  code: string;
}

export type OwnershipState = "unclaimed" | "claimed-by-you" | "claimed-by-other" | "locked";

export interface RecoveryPreview {
  campaignId: string;
  characterId: string;
  characterName: string;
  campaignName: string;
  ownership: OwnershipState;
}

export type LookupRecoveryCodeResult =
  | { status: "found"; preview: RecoveryPreview }
  | { status: "not-found" }
  | { status: "missing-data" };

const CODE_FORMAT = /^DH-[0-9A-Z]{4}-[0-9A-Z]{4}$/;

export async function lookupRecoveryCode(
  code: string,
  callerUid: string,
  hmacSecret: string
): Promise<LookupRecoveryCodeResult> {
  if (!CODE_FORMAT.test(code)) {
    return { status: "not-found" };
  }

  const db = getFirestore();
  const hash = hashRecoveryCode(code, hmacSecret);
  const indexSnapshot = await db.collection(RECOVERY_INDEX_COLLECTION).doc(hash).get();
  if (!indexSnapshot.exists) {
    return { status: "not-found" };
  }

  const { campaignId, characterId } = indexSnapshot.data() as {
    campaignId: string;
    characterId: string;
  };

  const campaignRef = db.collection("campaigns").doc(campaignId);
  const characterRef = campaignRef.collection("characters").doc(characterId);
  const [campaignSnapshot, characterSnapshot] = await Promise.all([
    campaignRef.get(),
    characterRef.get(),
  ]);

  if (!campaignSnapshot.exists || !characterSnapshot.exists) {
    return { status: "missing-data" };
  }

  const character = characterSnapshot.data() as {
    userId?: string | null;
    isEditableByPlayer?: boolean;
    header?: { characterName?: string };
  };
  const campaign = campaignSnapshot.data() as { name?: string };

  let ownership: OwnershipState;
  if (!character.userId) {
    ownership = "unclaimed";
  } else if (character.userId === callerUid) {
    ownership = "claimed-by-you";
  } else if (character.isEditableByPlayer === false) {
    ownership = "locked";
  } else {
    ownership = "claimed-by-other";
  }

  return {
    status: "found",
    preview: {
      campaignId,
      characterId,
      characterName: character.header?.characterName ?? "Unnamed Character",
      campaignName: campaign.name ?? "Unnamed Campaign",
      ownership,
    },
  };
}
