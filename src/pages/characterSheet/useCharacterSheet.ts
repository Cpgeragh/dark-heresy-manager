// src/pages/characterSheet/useCharacterSheet.ts

import { useEffect, useState } from "react";
import { auth, db } from "../../firebase";

import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  addDoc,
  getDoc,
} from "firebase/firestore";

import type { ClaimLog } from "../../types/ClaimLog";
import type { Character, Characteristics } from "../../types/Character";
import type { CharField } from "../../utils/characterFactory";

// NEW: import log builder
import { buildClaimLogPayload } from "../../utils/claimLog";

type Path = { campaignId: string; characterId: string } | null;

interface UseCharacterSheetArgs {
  campaignIdParam?: string;
  characterIdParam?: string;
}

export function useCharacterSheet({
  campaignIdParam,
  characterIdParam,
}: UseCharacterSheetArgs) {
  const [path, setPath] = useState<Path>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [claimLog, setClaimLog] = useState<ClaimLog[]>([]);
  const [isDM, setIsDM] = useState(false);

  const user = auth.currentUser;
  const userId = user?.uid ?? null;

  // ----------------------------------------------------------------------
  // Load user role (dm / player)
  // ----------------------------------------------------------------------
  useEffect(() => {
    async function loadRole() {
      if (!userId) return;

      const userRef = doc(db, "users", userId);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const role = snap.data().role;
        setIsDM(role === "dm");
      }
    }

    loadRole();
  }, [userId]);

  // ----------------------------------------------------------------------
  // Load character live
  // ----------------------------------------------------------------------
  useEffect(() => {
    if (!campaignIdParam || !characterIdParam || !userId) {
      setPath(null);
      setCharacter(null);
      setAllowedToEdit(false);
      return;
    }

    const pathObj = {
      campaignId: campaignIdParam,
      characterId: characterIdParam,
    };

    setPath(pathObj);

    const ref = doc(
      db,
      "campaigns",
      pathObj.campaignId,
      "characters",
      pathObj.characterId
    );

    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        setCharacter(null);
        setAllowedToEdit(false);
        return;
      }

      const data = snap.data() as Character;
      setCharacter(data);

      if (isDM) {
        setAllowedToEdit(true);
      } else {
        setAllowedToEdit(
          data.userId === userId && data.isEditableByPlayer === true
        );
      }
    });

    return () => unsub();
  }, [campaignIdParam, characterIdParam, userId, isDM]);

  // ----------------------------------------------------------------------
  // Load claim log (DM only)
  // ----------------------------------------------------------------------
  useEffect(() => {
    if (!path || !isDM) return;

    const logsRef = collection(
      db,
      "campaigns",
      path.campaignId,
      "characters",
      path.characterId,
      "claimLog"
    );

    const q = query(logsRef, orderBy("timestamp", "desc"));

    const unsub = onSnapshot(q, (snap) => {
      const list: ClaimLog[] = snap.docs.map((d) => {
        const data = d.data() as Omit<ClaimLog, "id">;
        return { id: d.id, ...data };
      });

      setClaimLog(list);
    });

    return () => unsub();
  }, [path, isDM]);

  // ----------------------------------------------------------------------
  // Update single field
  // ----------------------------------------------------------------------
  async function updateField(field: string, value: any) {
    if (!allowedToEdit || !path || !character) return;

    const ref = doc(
      db,
      "campaigns",
      path.campaignId,
      "characters",
      path.characterId
    );

    await updateDoc(ref, { [field]: value });

    setCharacter((prev) =>
      prev ? { ...prev, [field]: value } : prev
    );
  }

  // ----------------------------------------------------------------------
  // Update characteristic
  // ----------------------------------------------------------------------
  async function updateCharacteristic(
    statKey: keyof Characteristics,
    value: CharField
  ) {
    if (!allowedToEdit || !path || !character) return;

    const ref = doc(
      db,
      "campaigns",
      path.campaignId,
      "characters",
      path.characterId
    );

    await updateDoc(ref, {
      [`characteristics.${statKey}.base`]: value.base,
      [`characteristics.${statKey}.advances`]: value.advances,
    });

    setCharacter((prev) =>
      prev
        ? {
            ...prev,
            characteristics: {
              ...prev.characteristics,
              [statKey]: value,
            },
          }
        : prev
    );
  }

  // ----------------------------------------------------------------------
  // Safe read characteristic
  // ----------------------------------------------------------------------
  function getCharField(statKey: keyof Characteristics): CharField {
    const v = character?.characteristics?.[statKey];
    return {
      base: typeof v?.base === "number" ? v.base : 0,
      advances: typeof v?.advances === "number" ? v.advances : 0,
    };
  }

  // ----------------------------------------------------------------------
  // Player release
  // ----------------------------------------------------------------------
  async function releaseCharacter() {
    if (!character || !path || isDM) return;
    if (!userId || character.userId !== userId) return;

    const ref = doc(
      db,
      "campaigns",
      path.campaignId,
      "characters",
      path.characterId
    );

    const logsRef = collection(
      db,
      "campaigns",
      path.campaignId,
      "characters",
      path.characterId,
      "claimLog"
    );

    const previous = character.userId;

    await updateDoc(ref, {
      userId: null,
      isEditableByPlayer: false,
    });

    await addDoc(
      logsRef,
      buildClaimLogPayload(
        "release",
        userId,
        previous,
        null
      )
    );
  }

  // ----------------------------------------------------------------------
  // DM force release
  // ----------------------------------------------------------------------
  async function dmForceRelease() {
    if (!character || !path || !isDM) return;

    const ref = doc(
      db,
      "campaigns",
      path.campaignId,
      "characters",
      path.characterId
    );

    const logsRef = collection(
      db,
      "campaigns",
      path.campaignId,
      "characters",
      path.characterId,
      "claimLog"
    );

    const previous = character.userId;

    await updateDoc(ref, {
      userId: null,
      isEditableByPlayer: false,
    });

    await addDoc(
      logsRef,
      buildClaimLogPayload(
        "force-release",
        userId!,
        previous,
        null
      )
    );
  }

  // ----------------------------------------------------------------------
  // DM force assign
  // ----------------------------------------------------------------------
  async function dmForceAssign(uid: string) {
    if (!character || !path || !isDM) return;

    const clean = uid.trim();
    if (!clean) return;

    const ref = doc(
      db,
      "campaigns",
      path.campaignId,
      "characters",
      path.characterId
    );

    const logsRef = collection(
      db,
      "campaigns",
      path.campaignId,
      "characters",
      path.characterId,
      "claimLog"
    );

    const previous = character.userId;

    await updateDoc(ref, {
      userId: clean,
      isEditableByPlayer: true,
    });

    await addDoc(
      logsRef,
      buildClaimLogPayload(
        "force-assign",
        userId!,
        previous,
        clean
      )
    );
  }

  // ----------------------------------------------------------------------
  // DM toggle edit flag
  // ----------------------------------------------------------------------
  async function dmToggleEdit() {
    if (!character || !path || !isDM) return;

    const ref = doc(
      db,
      "campaigns",
      path.campaignId,
      "characters",
      path.characterId
    );

    await updateDoc(ref, {
      isEditableByPlayer: !character.isEditableByPlayer,
    });
  }

  return {
    path,
    character,
    allowedToEdit,
    claimLog,
    isDM,
    getCharField,
    updateCharacteristic,
    updateField,
    releaseCharacter,
    dmForceRelease,
    dmForceAssign,
    dmToggleEdit,
  };
}