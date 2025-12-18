// src/pages/characterSheet/useCharacterSheet.ts

import { useState, useMemo, useCallback, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";
import { useCharacterData } from "../../hooks/useCharacterData";
import { useCharacterPermissions } from "../../hooks/useCharacterPermissions";
import { useCharacterMutations } from "../../hooks/useCharacterMutations";
import type { CharField } from "../../utils/characterFactory";
import type { Characteristics } from "../../types/Character";

interface UseCharacterSheetProps {
  campaignIdParam: string | undefined;
  characterIdParam: string | undefined;
}

export function useCharacterSheet({
  campaignIdParam,
  characterIdParam,
}: UseCharacterSheetProps) {
  const [dmReadOnly, setDmReadOnly] = useState(true);
  const [isDM, setIsDM] = useState(false);

  // Validate params
  const path = useMemo(() => {
    if (!campaignIdParam || !characterIdParam) return null;
    return { campaignId: campaignIdParam, characterId: characterIdParam };
  }, [campaignIdParam, characterIdParam]);

  // Check if current user is DM of this campaign
  useEffect(() => {
    if (!path?.campaignId) {
      setIsDM(false);
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setIsDM(false);
      return;
    }

    // Capture uid to avoid null issues in async closure
    const userUid = user.uid;
    let isMounted = true;

    async function checkDM() {
      try {
        const campRef = doc(db, "campaigns", path!.campaignId);
        const campSnap = await getDoc(campRef);
        
        if (campSnap.exists() && isMounted) {
          const data = campSnap.data();
          setIsDM(data.dmId === userUid); // FIX: Use captured uid
        }
      } catch (error) {
        console.error("Failed to check DM status:", error);
        if (isMounted) {
          setIsDM(false);
        }
      }
    }

    checkDM();

    return () => {
      isMounted = false;
    };
  }, [path?.campaignId]);

  // Get current user ID
  const userId = auth.currentUser?.uid ?? null;

  // Load character + claim log
  const { character, claimLog } = useCharacterData({
    campaignId: path?.campaignId,
    characterId: path?.characterId,
    isDM,
  });

  // Permissions
  const { allowedToEdit } = useCharacterPermissions({
    character,
    userId,
    isDM,
    dmReadOnly,
  });

  // Toggle DM read-only mode
  const toggleDmReadOnly = useCallback(() => {
    setDmReadOnly((prev) => !prev);
  }, []);

  // Mutations
  const {
    updateField,
    updateCharacteristic,
    releaseCharacter,
    dmForceRelease,
    dmForceAssign,
    dmToggleEdit,
    isUpdating,
    isReleasing,
    isDmForceReleasing,
    isDmForceAssigning,
    isDmTogglingEdit,
  } = useCharacterMutations({
    campaignId: path?.campaignId ?? "",
    characterId: path?.characterId ?? "",
    character,
    allowedToEdit,
  });

  // ================================================================
  // DERIVED HELPERS
  // ================================================================

  /**
   * Get a characteristic field (base + advances)
   */
  const getCharField = useCallback(
    (statKey: keyof Characteristics): CharField => {
      if (!character) return { base: 0, advances: 0 };
      return character.characteristics[statKey] ?? { base: 0, advances: 0 };
    },
    [character]
  );

  /**
   * Get computed total for a characteristic
   */
  const getCharTotal = useCallback(
    (statKey: keyof Characteristics): number => {
      const field = getCharField(statKey);
      return field.base + field.advances * 5;
    },
    [getCharField]
  );

  return {
    path,
    character,
    allowedToEdit,
    claimLog,
    isDM,

    dmReadOnly,
    toggleDmReadOnly,

    getCharField,
    getCharTotal,
    updateCharacteristic,
    updateField,
    releaseCharacter,
    dmForceRelease,
    dmForceAssign,
    dmToggleEdit,

    // Loading states
    isUpdating,
    isReleasing,
    isDmForceReleasing,
    isDmForceAssigning,
    isDmTogglingEdit,
  };
}