// src/pages/CharacterSheet/useCharacterSheet.ts

import { useMemo } from "react";
import { useCampaign } from "../../hooks/useCampaign";
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
  const {
    campaign,
    loading: campaignLoading,
    error: campaignError,
  } = useCampaign(path?.campaignId ?? null);
  const isDM = campaign?.dmId === userId;
  const { dmReadOnly, toggleDmReadOnly } = useDMOverride();

  // ================================================================
  // DATA LOADING
  // ================================================================
  const {
    character,
    loading: characterLoading,
    error: characterError,
  } = useCharacterData({
    campaignId: path?.campaignId,
    characterId: path?.characterId,
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
  const { getCharField, getCharTotal, getEffectiveCharTotal, getCharBonus } = useCharacterHelpers({
    character,
  });

  // ================================================================
  // PUBLIC API
  // ================================================================
  return {
    // Path & data
    path,
    character,
    characterLoading: characterLoading || campaignLoading,
    characterError: characterError ?? campaignError,

    // Role & permissions
    isDM,
    isDMLoading: campaignLoading,
    memberIds: campaign?.memberIds ?? [],
    dmReadOnly,
    toggleDmReadOnly,
    allowedToEdit,
    isOwner,
    canPlayerRelease,

    // Helpers
    getCharField,
    getCharTotal,
    getEffectiveCharTotal,
    getCharBonus,

    // Mutations
    updateField: mutations.updateField,
    patchField: mutations.patchField,
    patchFields: mutations.patchFields,
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
