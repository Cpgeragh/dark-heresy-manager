// src/pages/ClaimCharacter/hooks/useDmActions.ts

import { useState, useCallback } from "react";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../../firebase";
import { buildClaimLogPayload } from "../../../utils/claimLog";

export function useDmActions() {
  const user = auth.currentUser;
  const [isForceAssigning, setIsForceAssigning] = useState(false);
  const [isForceReleasing, setIsForceReleasing] = useState(false);

  const forceAssign = useCallback(async (campaignId: string, character: any, uid: string) => {
    setIsForceAssigning(true);
    try {
      const charRef = doc(
        db,
        "campaigns",
        campaignId,
        "characters",
        character.id
      );

      const previous = character.userId;

      await updateDoc(charRef, {
        userId: uid,
        isEditableByPlayer: true,
      });

      await addDoc(
        collection(db, "campaigns", campaignId, "characters", character.id, "claimLog"),
        buildClaimLogPayload("force-assign", user!.uid, previous, uid)
      );
    } catch (error) {
      console.error("Force assign failed:", error);
      throw error;
    } finally {
      setIsForceAssigning(false);
    }
  }, [user]);

  const forceRelease = useCallback(async (campaignId: string, character: any) => {
    setIsForceReleasing(true);
    try {
      const charRef = doc(
        db,
        "campaigns",
        campaignId,
        "characters",
        character.id
      );

      const previous = character.userId;

      await updateDoc(charRef, {
        userId: null,
        isEditableByPlayer: false,
      });

      await addDoc(
        collection(db, "campaigns", campaignId, "characters", character.id, "claimLog"),
        buildClaimLogPayload("force-release", user!.uid, previous, null)
      );
    } catch (error) {
      console.error("Force release failed:", error);
      throw error;
    } finally {
      setIsForceReleasing(false);
    }
  }, [user]);

  return { 
    forceAssign, 
    forceRelease,
    isForceAssigning,
    isForceReleasing,
  };
}