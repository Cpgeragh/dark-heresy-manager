// src/hooks/useCharacterMutations.ts

import { useState, useCallback } from "react";
import { doc, updateDoc, addDoc, collection } from "firebase/firestore";
import { db, auth } from "../firebase";
import type { Character, Characteristics } from "../types/Character";
import type { CharField } from "../utils/characterFactory";
import { buildClaimLogPayload } from "../utils/claimLog";

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

  const charRef = doc(db, "campaigns", campaignId, "characters", characterId);

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
      try {
        await updateDoc(charRef, { [field]: value });
      } catch (error) {
        console.error("Failed to update field:", error);
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [allowedToEdit, character, charRef]
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
      try {
        const updated = {
          ...character.characteristics,
          [statKey]: value,
        };

        await updateDoc(charRef, { characteristics: updated });
      } catch (error) {
        console.error("Failed to update characteristic:", error);
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [allowedToEdit, character, charRef]
  );

  // ================================================================
  // RELEASE CHARACTER (PLAYER ACTION)
  // ================================================================
  const releaseCharacter = useCallback(async (): Promise<void> => {
    const user = auth.currentUser;
    if (!user || !character) return;

    setIsReleasing(true);
    try {
      const previousOwner = character.userId;

      await updateDoc(charRef, {
        userId: null,
        isEditableByPlayer: false,
      });

      const logsRef = collection(
        db,
        "campaigns",
        campaignId,
        "characters",
        characterId,
        "claimLog"
      );

      await addDoc(
        logsRef,
        buildClaimLogPayload("release", user.uid, previousOwner, null)
      );
    } catch (error) {
      console.error("Failed to release character:", error);
      throw error;
    } finally {
      setIsReleasing(false);
    }
  }, [character, charRef, campaignId, characterId]);

  // ================================================================
  // DM FORCE RELEASE
  // ================================================================
  const dmForceRelease = useCallback(async (): Promise<void> => {
    const user = auth.currentUser;
    if (!user || !character) return;

    setIsDmForceReleasing(true);
    try {
      const previousOwner = character.userId;

      await updateDoc(charRef, {
        userId: null,
        isEditableByPlayer: false,
      });

      const logsRef = collection(
        db,
        "campaigns",
        campaignId,
        "characters",
        characterId,
        "claimLog"
      );

      await addDoc(
        logsRef,
        buildClaimLogPayload("force-release", user.uid, previousOwner, null)
      );
    } catch (error) {
      console.error("Failed to force release:", error);
      throw error;
    } finally {
      setIsDmForceReleasing(false);
    }
  }, [character, charRef, campaignId, characterId]);

  // ================================================================
  // DM FORCE ASSIGN
  // ================================================================
  const dmForceAssign = useCallback(
    async (targetUid: string): Promise<void> => {
      const user = auth.currentUser;
      if (!user || !character) return;

      setIsDmForceAssigning(true);
      try {
        const previousOwner = character.userId;

        await updateDoc(charRef, {
          userId: targetUid,
          isEditableByPlayer: true,
        });

        const logsRef = collection(
          db,
          "campaigns",
          campaignId,
          "characters",
          characterId,
          "claimLog"
        );

        await addDoc(
          logsRef,
          buildClaimLogPayload("force-assign", user.uid, previousOwner, targetUid)
        );
      } catch (error) {
        console.error("Failed to force assign:", error);
        throw error;
      } finally {
        setIsDmForceAssigning(false);
      }
    },
    [character, charRef, campaignId, characterId]
  );

  // ================================================================
  // DM TOGGLE EDIT PERMISSION
  // ================================================================
  const dmToggleEdit = useCallback(async (): Promise<void> => {
    if (!character) return;

    setIsDmTogglingEdit(true);
    try {
      await updateDoc(charRef, {
        isEditableByPlayer: !character.isEditableByPlayer,
      });
    } catch (error) {
      console.error("Failed to toggle edit permission:", error);
      throw error;
    } finally {
      setIsDmTogglingEdit(false);
    }
  }, [character, charRef]);

  return {
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
  };
}