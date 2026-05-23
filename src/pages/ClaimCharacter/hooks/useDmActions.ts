// src/pages/ClaimCharacter/hooks/useDmActions.ts

import { useState, useCallback } from "react";
import { forceAssignCharacter, forceReleaseCharacter } from "../../../services/characterService";

export function useDmActions() {
  const [isForceAssigning, setIsForceAssigning] = useState(false);
  const [isForceReleasing, setIsForceReleasing] = useState(false);

  const forceAssign = useCallback(async (campaignId: string, character: any, uid: string) => {
    setIsForceAssigning(true);
    try {
      await forceAssignCharacter(campaignId, character.id, character.userId, uid);
    } catch (error) {
      console.error("Force assign failed:", error);
      throw error;
    } finally {
      setIsForceAssigning(false);
    }
  }, []);

  const forceRelease = useCallback(async (campaignId: string, character: any) => {
    setIsForceReleasing(true);
    try {
      await forceReleaseCharacter(campaignId, character.id, character.userId);
    } catch (error) {
      console.error("Force release failed:", error);
      throw error;
    } finally {
      setIsForceReleasing(false);
    }
  }, []);

  return { 
    forceAssign, 
    forceRelease,
    isForceAssigning,
    isForceReleasing,
  };
}