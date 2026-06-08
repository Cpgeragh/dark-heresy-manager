// src/hooks/useCharacterPermissions.ts

import { useMemo } from "react";
import type { Character } from "../types/Character";

interface UseCharacterPermissionsArgs {
  character: Character | null;
  userId: string | null;
  isDM: boolean;
  dmReadOnly: boolean;
}

interface UseCharacterPermissionsResult {
  allowedToEdit: boolean;
  isOwner: boolean;
  canPlayerRelease: boolean;
}

export function useCharacterPermissions({
  character,
  userId,
  isDM,
  dmReadOnly,
}: UseCharacterPermissionsArgs): UseCharacterPermissionsResult {
  const isOwner = useMemo(() => {
    return !!(userId && character && character.userId === userId);
  }, [userId, character]);

  const allowedToEdit = useMemo(() => {
    if (!character) return false;

    if (isDM) {
      return !dmReadOnly;
    } else {
      return character.userId === userId && character.isEditableByPlayer === true;
    }
  }, [character, userId, isDM, dmReadOnly]);

  // Player can release if they own it and are not DM
  const canPlayerRelease = useMemo(() => {
    return isOwner && !isDM;
  }, [isOwner, isDM]);

  return {
    allowedToEdit,
    isOwner,
    canPlayerRelease,
  };
}
