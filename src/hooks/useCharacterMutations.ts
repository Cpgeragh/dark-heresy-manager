// src/hooks/useCharacterMutations.ts

import { useState, useCallback } from "react";
import type { Character, Characteristics } from "../types/Character";
import type { CharField } from "../types/Character";
import { stripUndefined } from "../utils/stripUndefined";
import {
  forceAssignCharacter,
  forceReleaseCharacter,
  patchCharacterField,
  patchCharacterFields,
  releaseCharacter as releaseCharacterInService,
  updateCharacter,
} from "../services/characterService";
import { useToast } from "../components/Toast";

interface UseCharacterMutationsProps {
  campaignId: string;
  characterId: string;
  character: Character | null;
  allowedToEdit: boolean;
}

export function useCharacterMutations({
  campaignId,
  characterId,
  character,
  allowedToEdit,
}: UseCharacterMutationsProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [isDmForceReleasing, setIsDmForceReleasing] = useState(false);
  const [isDmForceAssigning, setIsDmForceAssigning] = useState(false);
  const [isDmTogglingEdit, setIsDmTogglingEdit] = useState(false);

  const toast = useToast();

  // ================================================================
  // UPDATE FIELD (GENERIC)
  // ================================================================
  const updateField = useCallback(
    async <K extends keyof Character>(field: K, value: Character[K]): Promise<void> => {
      if (!allowedToEdit || !character) return;

      setIsUpdating(true);
      try {
        await updateCharacter(campaignId, characterId, {
          [field]: stripUndefined(value),
        } as Partial<Character>);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update field";
        toast.error(`Update failed: ${message}`);
        console.error("Failed to update field:", err);
      } finally {
        setIsUpdating(false);
      }
    },
    [allowedToEdit, character, campaignId, characterId, toast]
  );

  type PatchableCharacterField =
    | "notes"
    | "header"
    | "portraitUrl"
    | "characteristics"
    | "talentsAndTraits"
    | "weaponTraining"
    | "psychic"
    | "cybernetics"
    | "rangedWeapons"
    | "meleeWeapons"
    | "archeotech"
    | "insanity"
    | "gear"
    | "consumables"
    | "drugs"
    | "grenades"
    | "shields"
    | "armour"
    | "companions"
    | "skills"
    | "wounds"
    | "fate"
    | "corruption"
    | "movement"
    | "experience";

  const patchField = useCallback(
    async <K extends PatchableCharacterField>(field: K, value: Character[K]): Promise<void> => {
      if (!allowedToEdit || !character) return;

      setIsUpdating(true);
      try {
        await patchCharacterField(campaignId, characterId, field, stripUndefined(value));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update field";
        toast.error(`Update failed: ${message}`);
        console.error("Failed to update field:", err);
      } finally {
        setIsUpdating(false);
      }
    },
    [allowedToEdit, character, campaignId, characterId, toast]
  );

  const patchFields = useCallback(
    async (partial: Record<string, unknown>): Promise<void> => {
      if (!allowedToEdit || !character) return;
      setIsUpdating(true);
      try {
        await patchCharacterFields(campaignId, characterId, stripUndefined(partial));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update character";
        toast.error(`Update failed: ${message}`);
        console.error("Failed to update character:", err);
      } finally {
        setIsUpdating(false);
      }
    },
    [allowedToEdit, character, campaignId, characterId, toast]
  );

  // ================================================================
  // UPDATE CHARACTERISTIC
  // ================================================================
  const updateCharacteristic = useCallback(
    async (statKey: keyof Characteristics, value: CharField): Promise<void> => {
      if (!allowedToEdit || !character) return;

      setIsUpdating(true);
      try {
        const updated = stripUndefined({
          ...character.characteristics,
          [statKey]: value,
        });

        await patchCharacterField(campaignId, characterId, "characteristics", updated);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update characteristic";
        toast.error(`Update failed: ${message}`);
        console.error("Failed to update characteristic:", err);
      } finally {
        setIsUpdating(false);
      }
    },
    [allowedToEdit, character, campaignId, characterId, toast]
  );

  // ================================================================
  // RELEASE CHARACTER (PLAYER ACTION)
  // ================================================================
  const releaseCharacter = useCallback(async (): Promise<boolean> => {
    if (!character) return false;

    setIsReleasing(true);
    try {
      await releaseCharacterInService(campaignId, characterId);

      toast.success("Character released successfully");
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to release character";
      toast.error(`Release failed: ${message}`);
      console.error("Failed to release character:", err);
      return false;
    } finally {
      setIsReleasing(false);
    }
  }, [character, campaignId, characterId, toast]);

  // ================================================================
  // DM FORCE RELEASE
  // ================================================================
  const dmForceRelease = useCallback(async (): Promise<void> => {
    if (!character) return;

    setIsDmForceReleasing(true);
    try {
      await forceReleaseCharacter(campaignId, characterId);
      toast.success("Character force-released");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to force release";
      toast.error(`Force release failed: ${message}`);
      console.error("Failed to force release:", err);
    } finally {
      setIsDmForceReleasing(false);
    }
  }, [character, campaignId, characterId, toast]);

  // ================================================================
  // DM FORCE ASSIGN
  // ================================================================
  const dmForceAssign = useCallback(
    async (targetUid: string): Promise<void> => {
      if (!character) return;

      setIsDmForceAssigning(true);
      try {
        await forceAssignCharacter(campaignId, characterId, targetUid);
        toast.success("Character assigned successfully");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to assign character";
        toast.error(`Assignment failed: ${message}`);
        console.error("Failed to force assign:", err);
      } finally {
        setIsDmForceAssigning(false);
      }
    },
    [character, campaignId, characterId, toast]
  );

  // ================================================================
  // DM TOGGLE EDIT PERMISSION
  // ================================================================
  const dmToggleEdit = useCallback(async (): Promise<void> => {
    if (!character) return;

    setIsDmTogglingEdit(true);
    try {
      const newValue = !character.isEditableByPlayer;

      await updateCharacter(campaignId, characterId, {
        isEditableByPlayer: newValue,
      });

      toast.success(newValue ? "Player editing enabled" : "Player editing disabled");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to toggle edit permission";
      toast.error(`Toggle failed: ${message}`);
      console.error("Failed to toggle edit permission:", err);
    } finally {
      setIsDmTogglingEdit(false);
    }
  }, [character, campaignId, characterId, toast]);

  return {
    // Mutations
    updateField,
    patchField,
    patchFields,
    updateCharacteristic,
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
