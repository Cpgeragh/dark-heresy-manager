// src/hooks/useCharacterMutations.ts

import { useState, useCallback } from "react";
import { updateDoc, writeBatch, collection, doc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { characterDocRef } from "../firebase/converters";
import type { Character, Characteristics } from "../types/Character";
import type { CharField } from "../utils/characterFactory";
import { buildClaimLogPayload } from "../utils/claimLog";
import { stripUndefined } from "../utils/stripUndefined";
import { forceAssignCharacter, forceReleaseCharacter } from "../services/characterService";
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
  // Loading states
  const [isUpdating, setIsUpdating] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [isDmForceReleasing, setIsDmForceReleasing] = useState(false);
  const [isDmForceAssigning, setIsDmForceAssigning] = useState(false);
  const [isDmTogglingEdit, setIsDmTogglingEdit] = useState(false);

  // Error states
  const [error, setError] = useState<string | null>(null);

  // Toast notifications
  const toast = useToast();

  // Use converter for type safety
  const charRef = characterDocRef(campaignId, characterId);

  // Clear error helper
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ================================================================
  // UPDATE FIELD (GENERIC)
  // ================================================================
  const updateField = useCallback(
    async <K extends keyof Character>(
      field: K,
      value: Character[K]
    ): Promise<void> => {
      if (!allowedToEdit || !character) return;

      setIsUpdating(true);
      setError(null);
      try {
        await updateDoc(charRef, { [field]: stripUndefined(value) });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update field";
        setError(message);
        toast.error(`Update failed: ${message}`);
        console.error("Failed to update field:", err);
      } finally {
        setIsUpdating(false);
      }
    },
    [allowedToEdit, character, charRef, toast]
  );

  // ================================================================
  // UPDATE CHARACTERISTIC
  // ================================================================
  const updateCharacteristic = useCallback(
    async (
      statKey: keyof Characteristics,
      value: CharField
    ): Promise<void> => {
      if (!allowedToEdit || !character) return;

      setIsUpdating(true);
      setError(null);
      try {
        const updated = {
          ...character.characteristics,
          [statKey]: value,
        };

        await updateDoc(charRef, { characteristics: updated });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update characteristic";
        setError(message);
        toast.error(`Update failed: ${message}`);
        console.error("Failed to update characteristic:", err);
      } finally {
        setIsUpdating(false);
      }
    },
    [allowedToEdit, character, charRef, toast]
  );

  // ================================================================
  // RELEASE CHARACTER (PLAYER ACTION)
  // ================================================================
  const releaseCharacter = useCallback(async (): Promise<void> => {
    const user = auth.currentUser;
    if (!user || !character) return;

    setIsReleasing(true);
    setError(null);
    try {
      const previousOwner = character.userId;

      const logsRef = collection(db, "campaigns", campaignId, "characters", characterId, "claimLog");

      const batch = writeBatch(db);
      batch.update(charRef, { userId: null, isEditableByPlayer: false });
      batch.set(doc(logsRef), buildClaimLogPayload("release", user.uid, previousOwner, null));
      await batch.commit();

      toast.success("Character released successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to release character";
      setError(message);
      toast.error(`Release failed: ${message}`);
      console.error("Failed to release character:", err);
    } finally {
      setIsReleasing(false);
    }
  }, [character, charRef, campaignId, characterId, toast]);

  // ================================================================
  // DM FORCE RELEASE
  // ================================================================
  const dmForceRelease = useCallback(async (): Promise<void> => {
    if (!character) return;

    setIsDmForceReleasing(true);
    setError(null);
    try {
      await forceReleaseCharacter(campaignId, characterId, character.userId);
      toast.success("Character force-released");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to force release";
      setError(message);
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
      setError(null);
      try {
        await forceAssignCharacter(campaignId, characterId, character.userId, targetUid);
        toast.success("Character assigned successfully");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to assign character";
        setError(message);
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
    setError(null);
    try {
      const newValue = !character.isEditableByPlayer;
      
      await updateDoc(charRef, {
        isEditableByPlayer: newValue,
      });

      toast.success(
        newValue ? "Player editing enabled" : "Player editing disabled"
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to toggle edit permission";
      setError(message);
      toast.error(`Toggle failed: ${message}`);
      console.error("Failed to toggle edit permission:", err);
    } finally {
      setIsDmTogglingEdit(false);
    }
  }, [character, charRef, toast]);

  return {
    // Mutations
    updateField,
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
    
    // Error state
    error,
    clearError,
  };
}