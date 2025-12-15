// src/pages/ClaimCharacter/hooks/useRecoveryLookup.ts

import { useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../../firebase";
import type {
  RecoveryIndexDocument,
  CampaignDocument,
  CharacterDocument,
} from "../../../types/Firestore";

export type OwnershipState =
  | "unclaimed"
  | "claimed-by-you"
  | "claimed-by-other"
  | "locked";

export interface RecoveryLookupResult {
  campaignId: string;
  characterId: string;
  character: CharacterDocument & { id: string };
  campaign: CampaignDocument;
  ownership: OwnershipState;
}

export function useRecoveryLookup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RecoveryLookupResult | null>(null);

  async function lookup(code: string) {
    setError(null);
    setLoading(true);
    setData(null);

    try {
      const indexRef = doc(db, "recoveryIndex", code);
      const indexSnap = await getDoc(indexRef);

      if (!indexSnap.exists()) {
        setError("No character found with this recovery code.");
        return;
      }

      const { campaignId, characterId } =
        indexSnap.data() as RecoveryIndexDocument;

      const campSnap = await getDoc(doc(db, "campaigns", campaignId));
      const charSnap = await getDoc(
        doc(db, "campaigns", campaignId, "characters", characterId)
      );

      if (!campSnap.exists() || !charSnap.exists()) {
        setError("Recovery code points to missing data.");
        return;
      }

      const characterData = charSnap.data() as CharacterDocument;
      const campaignData = campSnap.data() as CampaignDocument;

      const currentUser = auth.currentUser;
      const uid = currentUser?.uid ?? null;

      // ---------------------------------------
      // Ownership derivation (single source of truth)
      // ---------------------------------------
      let ownership: OwnershipState;

      if (!characterData.userId) {
        ownership = "unclaimed";
      } else if (uid && characterData.userId === uid) {
        ownership = "claimed-by-you";
      } else if (characterData.isEditableByPlayer === false) {
        ownership = "locked";
      } else {
        ownership = "claimed-by-other";
      }

      setData({
        campaignId,
        characterId,
        character: { ...characterData, id: characterId },
        campaign: campaignData,
        ownership,
      });
    } catch (err) {
      console.error(err);
      setError("Unexpected error during lookup.");
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, data, lookup };
}