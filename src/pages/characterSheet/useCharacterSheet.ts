// src/pages/characterSheet/useCharacterSheet.ts

import { useMemo } from "react";
import { useIsDM } from "../../hooks/useIsDM";
import { useDMOverride } from "../../hooks/useDMOverride";
import { useCharacterData } from "../../hooks/useCharacterData";
import { useCharacterPermissions } from "../../hooks/useCharacterPermissions";
import { useCharacterMutations } from "../../hooks/useCharacterMutations";
import { useCharacterHelpers } from "../../hooks/useCharacterHelpers";

interface UseCharacterSheetProps {
  campaignIdParam: string | undefined;
  characterIdParam: string | undefined;
  effectiveUserId: string | null;
}

export function useCharacterSheet({
  campaignIdParam,
  characterIdParam,
  effectiveUserId,
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
  const userId = effectiveUserId;
  const rawIsDM = useIsDM(path?.campaignId, userId);
  const isDM = rawIsDM ?? false;
  const { dmReadOnly, toggleDmReadOnly } = useDMOverride();

  // ================================================================
  // DATA LOADING
  // ================================================================
  const {
    character,
    claimLog,
    loading: characterLoading,
  } = useCharacterData({
    campaignId: path?.campaignId,
    characterId: path?.characterId,
    isDM,
  });

  // ================================================================
  // PERMISSIONS
  // ================================================================
  const { allowedToEdit, isOwner, canPlayerRelease } = useCharacterPermissions({
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
    characterLoading,

    // Role & permissions
    isDM,
    dmReadOnly,
    toggleDmReadOnly,
    allowedToEdit,
    isOwner,
    canPlayerRelease,

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
  };
}
