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
import type { CharField } from "../../utils/characterFactory";

import type { Role, ClaimLogEntry } from "./types";
import type { Character, Characteristics } from "../../types/Character";

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

  //
  // LOAD CHARACTER
  //
  useEffect(() => {
    if (!campaignIdParam || !characterIdParam) {
      console.error("Missing campaignId or characterId in route.");
      setPath(null);
      setCharacter(null);
      setAllowedToEdit(false);
      return;
    }

    const campaignId = campaignIdParam;
    const characterId = characterIdParam;
    setPath({ campaignId, characterId });

    const ref = doc(db, "campaigns", campaignId, "characters", characterId);

    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        console.error("Character document does not exist.");
        setCharacter(null);
        setAllowedToEdit(false);
        return;
      }

      const data = snap.data() as any;

      const merged: Character = {
        id: snap.id,
        ...data,
      };

      setCharacter(merged);

      if (isDM) {
        setAllowedToEdit(true);
      } else {
        const ownsCharacter = merged.userId === user.uid;
        const playerEditable = merged.isEditableByPlayer === true;
        setAllowedToEdit(ownsCharacter && playerEditable);
      }
    });

    return () => unsub();
  }, [campaignIdParam, characterIdParam, user.uid, isDM]);

  //
  // LOAD CLAIM LOG (DM ONLY)
  //
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

  //
  // GENERIC FIELD UPDATE
  //
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

  //
  // CHARACTERISTIC UPDATE
  //
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
        [`characteristics.${String(statKey)}.base`]: value.base,
        [`characteristics.${String(statKey)}.advances`]: value.advances,
      });

      setCharacter((prev) => {
        if (!prev) return prev;
        const prevChars =
          (prev.characteristics as Characteristics) ?? ({} as Characteristics);

        return {
          ...prev,
          characteristics: {
            ...prevChars,
            [statKey]: value,
          },
        };
      });
    } catch (err) {
      console.error("Error updating characteristic:", err);
    }
  }

  //
  // READ A CHARACTERISTIC
  //
  function getCharField(statKey: keyof Characteristics): CharField {
    const chars = character?.characteristics as Characteristics | undefined;
    const value = chars?.[statKey];

    if (!value) {
      return { base: 0, advances: 0 };
    }

    return {
      base: typeof value.base === "number" ? value.base : 0,
      advances: typeof value.advances === "number" ? value.advances : 0,
    };
  }

  //
  // PLAYER RELEASE
  //
  async function releaseCharacter() {
    if (!character || !path) return;

    const isOwner = character.userId === user.uid;
    if (!isOwner || isDM) return;

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

      alert("You have released this character.");
    } catch (err) {
      console.error("Release error:", err);
    }
  }

  //
  // DM FORCE RELEASE
  //
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

      alert("DM: Character ownership cleared.");
    } catch (err) {
      console.error("DM force release error:", err);
    }
  }

  //
  // DM FORCE ASSIGN
  //
  async function dmForceAssign(uid: string) {
    if (!character || !path || !isDM) return;

    const cleaned = uid.trim();
    if (!cleaned) {
      alert("Enter a UID.");
      return;
    }

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
        userId: cleaned,
        isEditableByPlayer: true,
      });

      await addDoc(logsRef, {
        action: "force-assign",
        actorUid: user.uid,
        previousOwnerUid,
        newOwnerUid: cleaned,
        timestamp: serverTimestamp(),
      });

      alert("DM: Character assigned.");
    } catch (err) {
      console.error("DM assign error:", err);
    }
  }

  //
  // DM TOGGLE EDIT PERMISSION
  //
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

      alert("DM: Edit permission toggled.");
    } catch (err) {
      console.error("DM toggle edit error:", err);
    }
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