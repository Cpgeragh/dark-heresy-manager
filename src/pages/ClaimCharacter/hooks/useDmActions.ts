// src/pages/ClaimCharacter/hooks/useDmActions.ts

import { useState, useCallback } from "react";
import { writeBatch, collection, doc } from "firebase/firestore";
import { db, auth } from "../../../firebase";
import { buildClaimLogPayload } from "../../../utils/claimLog";

export function useDmActions() {
  const [isForceAssigning, setIsForceAssigning] = useState(false);
  const [isForceReleasing, setIsForceReleasing] = useState(false);

  const forceAssign = useCallback(async (campaignId: string, character: any, uid: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Not signed in.");
    setIsForceAssigning(true);
    try {
      const charRef = doc(db, "campaigns", campaignId, "characters", character.id);
      const previous = character.userId;

      const logsRef = collection(db, "campaigns", campaignId, "characters", character.id, "claimLog");
      const batch = writeBatch(db);
      batch.update(charRef, { userId: uid, isEditableByPlayer: true });
      batch.set(doc(logsRef), buildClaimLogPayload("force-assign", user.uid, previous, uid));
      await batch.commit();
    } catch (error) {
      console.error("Force assign failed:", error);
      throw error;
    } finally {
      setIsForceAssigning(false);
    }
  }, []);

  const forceRelease = useCallback(async (campaignId: string, character: any) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Not signed in.");
    setIsForceReleasing(true);
    try {
      const charRef = doc(db, "campaigns", campaignId, "characters", character.id);
      const previous = character.userId;

      const logsRef = collection(db, "campaigns", campaignId, "characters", character.id, "claimLog");
      const batch = writeBatch(db);
      batch.update(charRef, { userId: null, isEditableByPlayer: false });
      batch.set(doc(logsRef), buildClaimLogPayload("force-release", user.uid, previous, null));
      await batch.commit();
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