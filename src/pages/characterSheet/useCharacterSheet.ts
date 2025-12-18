// src/pages/characterSheet/useCharacterSheet.ts

import { useMemo } from "react";
import { auth } from "../../firebase";
import { useIsDM } from "../../hooks/useIsDM";
import { useDMOverride } from "../../hooks/useDMOverride";
import { useCharacterData } from "../../hooks/useCharacterData";
import { useCharacterPermissions } from "../../hooks/useCharacterPermissions";
import { useCharacterMutations } from "../../hooks/useCharacterMutations";
import { useCharacterHelpers } from "../../hooks/useCharacterHelpers";

interface UseCharacterSheetProps {
  campaignIdParam: string | undefined;
  characterIdParam: string | undefined;
}

/**
 * Domain hook that orchestrates all character sheet functionality.
 * 
 * Composes multiple focused hooks to provide:
 * - Character data (live subscriptions)
 * - Permission checking (DM/player, editable state)
 * - Mutation operations (updates, releases, DM overrides)
 * - Helper functions (characteristic calculations)
 * 
 * @param campaignIdParam - Campaign ID from route params
 * @param characterIdParam - Character ID from route params
 */
export function useCharacterSheet({
  campaignIdParam,
  characterIdParam,
}: UseCharacterSheetProps) {
  // ================================================================
  // PATH VALIDATION
  // ================================================================
  const path = useMemo(() => {
    if (!campaignIdParam || !characterIdParam) return null;
    return { campaignId: campaignIdParam, characterId: characterIdParam };
  }, [campaignIdParam, characterIdParam]);

  // ================================================================
  // USER & ROLE
  // ================================================================
  const userId = auth.currentUser?.uid ?? null;
  const isDM = useIsDM(path?.campaignId);
  const { dmReadOnly, toggleDmReadOnly } = useDMOverride();

  // ================================================================
  // DATA LOADING
  // ================================================================
  const { character, claimLog } = useCharacterData({
    campaignId: path?.campaignId,
    characterId: path?.characterId,
    isDM,
  });

  // ================================================================
  // PERMISSIONS
  // ================================================================
  const { allowedToEdit } = useCharacterPermissions({
    character,
    userId,
    isDM,
    dmReadOnly,
  });

  // ================================================================
  // MUTATIONS
  // ================================================================
  const mutations = useCharacterMutations({
    campaignId: path?.campaignId ?? "",
    characterId: path?.characterId ?? "",
    character,
    allowedToEdit,
  });

  // ================================================================
  // HELPERS
  // ================================================================
  const { getCharField, getCharTotal } = useCharacterHelpers({ character });

  // ================================================================
  // PUBLIC API
  // ================================================================
  return {
    // Path & data
    path,
    character,
    claimLog,

    // Role & permissions
    isDM,
    dmReadOnly,
    toggleDmReadOnly,
    allowedToEdit,

    // Helpers
    getCharField,
    getCharTotal,

    // Mutations
    updateField: mutations.updateField,
    updateCharacteristic: mutations.updateCharacteristic,
    releaseCharacter: mutations.releaseCharacter,
    dmForceRelease: mutations.dmForceRelease,
    dmForceAssign: mutations.dmForceAssign,
    dmToggleEdit: mutations.dmToggleEdit,

    // Loading states
    isUpdating: mutations.isUpdating,
    isReleasing: mutations.isReleasing,
    isDmForceReleasing: mutations.isDmForceReleasing,
    isDmForceAssigning: mutations.isDmForceAssigning,
    isDmTogglingEdit: mutations.isDmTogglingEdit,

    // Error handling
    error: mutations.error,
    clearError: mutations.clearError,
  };
}