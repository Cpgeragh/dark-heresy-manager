// src/pages/characterSheet/useCharacterSheet.ts

import { useEffect, useState, useCallback } from "react";
import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import type { Characteristics } from "../../types/Character";
import type { CharField } from "../../utils/characterFactory";

// Import our new hooks
import { useCharacterData } from "../../hooks/useCharacterData";
import { useCharacterPermissions } from "../../hooks/useCharacterPermissions";
import { useCharacterMutations } from "../../hooks/useCharacterMutations";

interface UseCharacterSheetArgs {
  campaignIdParam?: string;
  characterIdParam?: string;
}

export function useCharacterSheet({
  campaignIdParam,
  characterIdParam,
}: UseCharacterSheetArgs) {
  
  const user = auth.currentUser;
  const userId = user?.uid ?? null;

  // Path state
  const path = campaignIdParam && characterIdParam
    ? { campaignId: campaignIdParam, characterId: characterIdParam }
    : null;

  // DM role state
  const [isDM, setIsDM] = useState(false);

  // DM read-only override state
  const [dmReadOnly, setDmReadOnly] = useState(true);

  // -------------------------------------------------------------
  // Load DM role
  // -------------------------------------------------------------
  useEffect(() => {
    async function loadRole() {
      if (!userId) return;

      const userRef = doc(db, "users", userId);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const role = snap.data().role;
        setIsDM(role === "dm");
      }
    }

    loadRole();
  }, [userId]);

  // -------------------------------------------------------------
  // Auto-enable DM read-only when opening character
  // -------------------------------------------------------------
  useEffect(() => {
    if (isDM) {
      setDmReadOnly(true);
    }
  }, [isDM, characterIdParam]);

  // -------------------------------------------------------------
  // Use our extracted hooks
  // -------------------------------------------------------------
  const { character, claimLog, loading } = useCharacterData({
    campaignId: campaignIdParam,
    characterId: characterIdParam,
    isDM,
  });

  const { allowedToEdit, isOwner, canPlayerRelease } = useCharacterPermissions({
    character,
    userId,
    isDM,
    dmReadOnly,
  });

  const {
    updateField,
    updateCharacteristic,
    releaseCharacter,
    dmForceRelease,
    dmForceAssign,
    dmToggleEdit,
  } = useCharacterMutations({
    campaignId: path?.campaignId ?? null,
    characterId: path?.characterId ?? null,
    userId,
    allowedToEdit,
    character,
  });

  // -------------------------------------------------------------
  // Characteristic helpers (memoized from Fix #1)
  // -------------------------------------------------------------
  const getCharField = useCallback(
    (statKey: keyof Characteristics): CharField => {
      const v = character?.characteristics?.[statKey];
      return {
        base: typeof v?.base === "number" ? v.base : 0,
        advances: typeof v?.advances === "number" ? v.advances : 0,
      };
    },
    [character?.characteristics]
  );

  const getCharTotal = useCallback(
    (statKey: keyof Characteristics): number => {
      const v = getCharField(statKey);
      return v.base + v.advances;
    },
    [getCharField]
  );

  // -------------------------------------------------------------
  // DM override toggle
  // -------------------------------------------------------------
  function toggleDmReadOnly() {
    setDmReadOnly((v) => !v);
  }

  return {
    path,
    character,
    allowedToEdit,
    claimLog,
    isDM,
    loading,
    isOwner,
    canPlayerRelease,

    // DM override controls
    dmReadOnly,
    toggleDmReadOnly,

    // Helpers
    getCharField,
    getCharTotal,

    // Mutations
    updateCharacteristic,
    updateField,
    releaseCharacter,
    dmForceRelease,
    dmForceAssign,
    dmToggleEdit,
  };
}