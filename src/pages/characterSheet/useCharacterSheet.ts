// src/pages/characterSheet/useCharacterSheet.ts

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../firebase";

import type { Role, ClaimLogEntry } from "./types";
import type {
  Character,
  Characteristics,
} from "../../types/Character";

import type { CharField } from "../../utils/characterFactory";

type Path = { campaignId: string; characterId: string } | null;

interface UseCharacterSheetArgs {
  user: User;
  role: Role;
  campaignIdParam?: string;
  characterIdParam?: string;
}

export function useCharacterSheet({
  user,
  role,
  campaignIdParam,
  characterIdParam,
}: UseCharacterSheetArgs) {
  const [path, setPath] = useState<Path>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [claimLog, setClaimLog] = useState<ClaimLogEntry[]>([]);

  const isDM = role === "dm";

  //----------------------------------------------------------------------
  // Load character in real time
  //----------------------------------------------------------------------
  useEffect(() => {
    if (!campaignIdParam || !characterIdParam) {
      console.error("Missing campaignId or characterId in route.");
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
        console.error("Character document does not exist.");
        setCharacter(null);
        setAllowedToEdit(false);
        return;
      }

      const data = snap.data() as Character;

      // Always trust Firestore snapshot.id, never stored data.id
      const merged: Character = {
        ...data,
        id: snap.id,
      };


      setCharacter(merged);

      // Permission logic
      if (isDM) {
        setAllowedToEdit(true);
      } else {
        const owns = merged.userId === user.uid;
        const editable = merged.isEditableByPlayer === true;
        setAllowedToEdit(owns && editable);
      }
    });

    return () => unsub();
  }, [campaignIdParam, characterIdParam, user.uid, isDM]);

  //----------------------------------------------------------------------
  // Load claim history (DM only)
  //----------------------------------------------------------------------
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
      const list: ClaimLogEntry[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          action: data.action,
          actorUid: data.actorUid,
          previousOwnerUid:
            typeof data.previousOwnerUid === "string"
              ? data.previousOwnerUid
              : null,
          newOwnerUid:
            typeof data.newOwnerUid === "string" ? data.newOwnerUid : null,
          timestamp: data.timestamp,
        };
      });
      setClaimLog(list);
    });

    return () => unsub();
  }, [path, isDM]);

  //----------------------------------------------------------------------
  // Generic field update
  //----------------------------------------------------------------------
  async function updateField(field: string, value: any) {
    if (!allowedToEdit || !path || !character) return;

    const ref = doc(
      db,
      "campaigns",
      path.campaignId,
      "characters",
      path.characterId
    );

    try {
      await updateDoc(ref, { [field]: value });
      setCharacter((prev) => (prev ? { ...prev, [field]: value } : prev));
    } catch (err) {
      console.error("Error updating field:", err);
    }
  }

  //----------------------------------------------------------------------
  // Update CHARACTERISTICS correctly
  //----------------------------------------------------------------------
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

    try {
      await updateDoc(ref, {
        [`characteristics.${statKey}.base`]: value.base,
        [`characteristics.${statKey}.advances`]: value.advances,
      });

      setCharacter((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          characteristics: {
            ...prev.characteristics,
            [statKey]: value,
          },
        };
      });
    } catch (err) {
      console.error("Error updating characteristic:", err);
    }
  }

  //----------------------------------------------------------------------
  // Read a characteristic safely
  //----------------------------------------------------------------------
  function getCharField(statKey: keyof Characteristics): CharField {
    const chars = character?.characteristics;
    const v = chars?.[statKey];

    return {
      base: typeof v?.base === "number" ? v.base : 0,
      advances: typeof v?.advances === "number" ? v.advances : 0,
    };
  }

  //----------------------------------------------------------------------
  // PLAYER RELEASE CHARACTER
  //----------------------------------------------------------------------
  async function releaseCharacter() {
    if (!character || !path) return;
    const owns = character.userId === user.uid;

    if (!owns || isDM) return;

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

    const previousOwnerUid = character.userId;

    try {
      await updateDoc(ref, {
        userId: null,
        isEditableByPlayer: false,
        recoveryCode: character.recoveryCode,
      });

      await addDoc(logsRef, {
        action: "release",
        actorUid: user.uid,
        previousOwnerUid,
        newOwnerUid: null,
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.error("Release error:", err);
    }
  }

  //----------------------------------------------------------------------
  // DM FORCE RELEASE
  //----------------------------------------------------------------------
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

    const previousOwnerUid = character.userId;

    try {
      await updateDoc(ref, {
        userId: null,
        isEditableByPlayer: false,
      });

      await addDoc(logsRef, {
        action: "force-release",
        actorUid: user.uid,
        previousOwnerUid,
        newOwnerUid: null,
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.error("DM force release error:", err);
    }
  }

  //----------------------------------------------------------------------
  // DM FORCE ASSIGN
  //----------------------------------------------------------------------
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

    const previousOwnerUid = character.userId;

    try {
      await updateDoc(ref, {
        userId: clean,
        isEditableByPlayer: true,
      });

      await addDoc(logsRef, {
        action: "force-assign",
        actorUid: user.uid,
        previousOwnerUid,
        newOwnerUid: clean,
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.error("DM assign error:", err);
    }
  }

  //----------------------------------------------------------------------
  // DM TOGGLE PLAYER EDIT PERMISSION
  //----------------------------------------------------------------------
  async function dmToggleEdit() {
    if (!character || !path || !isDM) return;

    const ref = doc(
      db,
      "campaigns",
      path.campaignId,
      "characters",
      path.characterId
    );

    try {
      await updateDoc(ref, {
        isEditableByPlayer: !character.isEditableByPlayer,
      });
    } catch (err) {
      console.error("DM toggle edit error:", err);
    }
  }

  //----------------------------------------------------------------------
  // RETURN API TO THE COMPONENT
  //----------------------------------------------------------------------
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