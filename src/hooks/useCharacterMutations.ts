// src/hooks/useCharacterMutations.ts

import { useCallback } from "react";
import { doc, updateDoc, addDoc, collection } from "firebase/firestore";
import { db } from "../firebase";
import type { Characteristics } from "../types/Character";
import type { CharField } from "../utils/characterFactory";
import { buildClaimLogPayload } from "../utils/claimLog";

interface UseCharacterMutationsArgs {
  campaignId: string | null;
  characterId: string | null;
  userId: string | null;
  allowedToEdit: boolean;
  character: any; // We'll type this better in Fix #5
}

export function useCharacterMutations({
  campaignId,
  characterId,
  userId,
  allowedToEdit,
  character,
}: UseCharacterMutationsArgs) {
  
  // -------------------------------------------------------------
  // Update a field safely
  // -------------------------------------------------------------
  const updateField = useCallback(
    async (field: string, value: any) => {
      if (!allowedToEdit || !campaignId || !characterId) return;

      const ref = doc(db, "campaigns", campaignId, "characters", characterId);
      await updateDoc(ref, { [field]: value });
    },
    [allowedToEdit, campaignId, characterId]
  );

  // -------------------------------------------------------------
  // Update characteristic
  // -------------------------------------------------------------
  const updateCharacteristic = useCallback(
    async (statKey: keyof Characteristics, value: CharField) => {
      if (!allowedToEdit || !campaignId || !characterId) return;

      const ref = doc(db, "campaigns", campaignId, "characters", characterId);

      await updateDoc(ref, {
        [`characteristics.${statKey}.base`]: value.base,
        [`characteristics.${statKey}.advances`]: value.advances,
      });
    },
    [allowedToEdit, campaignId, characterId]
  );

  // -------------------------------------------------------------
  // Player release
  // -------------------------------------------------------------
  const releaseCharacter = useCallback(
    async () => {
      if (!character || !campaignId || !characterId) return;
      if (!userId || character.userId !== userId) return;

      const ref = doc(db, "campaigns", campaignId, "characters", characterId);
      const logsRef = collection(db, "campaigns", campaignId, "characters", characterId, "claimLog");

      const previous = character.userId;

      await updateDoc(ref, {
        userId: null,
        isEditableByPlayer: false,
      });

      await addDoc(
        logsRef,
        buildClaimLogPayload("release", userId, previous, null)
      );
    },
    [character, campaignId, characterId, userId]
  );

  // -------------------------------------------------------------
  // DM force release
  // -------------------------------------------------------------
  const dmForceRelease = useCallback(
    async () => {
      if (!character || !campaignId || !characterId || !userId) return;

      const ref = doc(db, "campaigns", campaignId, "characters", characterId);
      const logsRef = collection(db, "campaigns", campaignId, "characters", characterId, "claimLog");

      const previous = character.userId;

      await updateDoc(ref, {
        userId: null,
        isEditableByPlayer: false,
      });

      await addDoc(
        logsRef,
        buildClaimLogPayload("force-release", userId, previous, null)
      );
    },
    [character, campaignId, characterId, userId]
  );

  // -------------------------------------------------------------
  // DM force assign
  // -------------------------------------------------------------
  const dmForceAssign = useCallback(
    async (uid: string) => {
      if (!character || !campaignId || !characterId || !userId) return;

      const clean = uid.trim();
      if (!clean) return;

      const ref = doc(db, "campaigns", campaignId, "characters", characterId);
      const logsRef = collection(db, "campaigns", campaignId, "characters", characterId, "claimLog");

      const previous = character.userId;

      await updateDoc(ref, {
        userId: clean,
        isEditableByPlayer: true,
      });

      await addDoc(
        logsRef,
        buildClaimLogPayload("force-assign", userId, previous, clean)
      );
    },
    [character, campaignId, characterId, userId]
  );

  // -------------------------------------------------------------
  // DM toggle player edit
  // -------------------------------------------------------------
  const dmToggleEdit = useCallback(
    async () => {
      if (!character || !campaignId || !characterId) return;

      const ref = doc(db, "campaigns", campaignId, "characters", characterId);

      await updateDoc(ref, {
        isEditableByPlayer: !character.isEditableByPlayer,
      });
    },
    [character, campaignId, characterId]
  );

  return {
    updateField,
    updateCharacteristic,
    releaseCharacter,
    dmForceRelease,
    dmForceAssign,
    dmToggleEdit,
  };
}