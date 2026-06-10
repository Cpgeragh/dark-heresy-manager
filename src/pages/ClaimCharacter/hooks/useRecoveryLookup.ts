// src/pages/ClaimCharacter/hooks/useRecoveryLookup.ts

import { useState, useCallback } from "react";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../../firebase";
import { characterDocRef } from "../../../firebase/converters";
import type { RecoveryIndexDocument, CampaignDocument } from "../../../types/Firestore";
import type { Character } from "../../../types/Character";

export type OwnershipState = "unclaimed" | "claimed-by-you" | "claimed-by-other" | "locked" | "linkable";

export interface RecoveryLookupResult {
  campaignId: string;
  characterId: string;
  character: Character;
  campaign: CampaignDocument;
  ownership: OwnershipState;
}

export function useRecoveryLookup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RecoveryLookupResult | null>(null);

  const lookup = useCallback(async (code: string) => {
    setError(null);
    setLoading(true);
    setData(null);

    try {
      const indexRef = doc(db, "recoveryIndex", code);
      const indexSnap = await getDoc(indexRef);

      if (!indexSnap.exists()) {
        setError("No character found with this recovery code.");
        setLoading(false);
        return;
      }

      const { campaignId, characterId } = indexSnap.data() as RecoveryIndexDocument;

      const campSnap = await getDoc(doc(db, "campaigns", campaignId));
      const charSnap = await getDoc(characterDocRef(campaignId, characterId));

      if (!campSnap.exists() || !charSnap.exists()) {
        setError("Recovery code points to missing data.");
        setLoading(false);
        return;
      }

      // characterDocRef uses a converter — fromFirestore injects id, no unsafe cast needed
      const characterData = charSnap.data()!;
      const campaignData = campSnap.data() as CampaignDocument;

      const currentUser = auth.currentUser;
      const uid = currentUser?.uid ?? null;

      let ownership: OwnershipState;

      if (!characterData.userId) {
        ownership = "unclaimed";
      } else if (uid && characterData.userId === uid) {
        ownership = "claimed-by-you";
      } else if (uid) {
        const linkSnap = await getDoc(doc(db, "userLinks", uid));
        if (linkSnap.exists() && (linkSnap.data().primaryUid as string) === characterData.userId) {
          ownership = "claimed-by-you"; // already linked — this device has access
        } else if (characterData.isEditableByPlayer === false) {
          ownership = "locked";
        } else {
          ownership = "linkable";
        }
      } else {
        ownership = "claimed-by-other";
      }

      setData({
        campaignId,
        characterId,
        character: characterData, // id already injected by converter's fromFirestore
        campaign: campaignData,
        ownership,
      });
    } catch (err) {
      console.error(err);
      setError("Unexpected error during lookup.");
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, data, lookup };
}
