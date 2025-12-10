// src/pages/ClaimCharacter/hooks/useRecoveryLookup.ts

import { useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase";

export function useRecoveryLookup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    campaignId: string;
    characterId: string;
    character: any;
    campaign: any;
  } | null>(null);

  async function lookup(code: string) {
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

      const { campaignId, characterId } = indexSnap.data() as any;

      const campSnap = await getDoc(doc(db, "campaigns", campaignId));
      const charSnap = await getDoc(
        doc(db, "campaigns", campaignId, "characters", characterId)
      );

      if (!campSnap.exists() || !charSnap.exists()) {
        setError("Recovery index points to missing data.");
        setLoading(false);
        return;
      }

      setData({
        campaignId,
        characterId,
        character: { id: characterId, ...charSnap.data() },
        campaign: campSnap.data(),
      });
    } catch (_) {
      setError("Unexpected error during lookup.");
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, data, lookup };
}