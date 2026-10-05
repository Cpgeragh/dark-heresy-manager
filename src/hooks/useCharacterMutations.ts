// src/hooks/useCharacterMutations.ts

import { useState, useCallback, useEffect, useRef } from "react";
import type { Character, Characteristics } from "../types/Character";
import type { CharField } from "../types/Character";
import { stripUndefined } from "../utils/stripUndefined";
import {
  adjustCharacterXp,
  forceAssignCharacter,
  forceReleaseCharacter,
  patchCharacterField,
  patchCharacterFields,
  patchCharacterCollectionField,
  releaseCharacter as releaseCharacterInService,
  updateCharacter,
} from "../services/characterService";
import { useToast } from "../components/Toast";
import type { OptimisticOverlayControls, PatchOptions } from "./useOptimisticOverlay";

interface PendingCoalescedPatch {
  timer: ReturnType<typeof setTimeout>;
  sent: unknown;
  version: number | undefined;
  waiting: ((saved: boolean) => void)[];
}

interface UseCharacterMutationsProps {
  campaignId: string;
  characterId: string;
  character: Character | null;
  allowedToEdit: boolean;
  overlay?: OptimisticOverlayControls;
}

export function useCharacterMutations({
  campaignId,
  characterId,
  character,
  allowedToEdit,
  overlay,
}: UseCharacterMutationsProps) {
  const [pendingUpdateCount, setPendingUpdateCount] = useState(0);
  const [isReleasing, setIsReleasing] = useState(false);
  const [isDmForceReleasing, setIsDmForceReleasing] = useState(false);
  const [isDmForceAssigning, setIsDmForceAssigning] = useState(false);
  const [isDmTogglingEdit, setIsDmTogglingEdit] = useState(false);

  const toast = useToast();
  const hasCharacter = character !== null;
  const characteristics = character?.characteristics;

  type DirectWriteCharacterField = "isEditableByPlayer" | "backgroundComplete";

  // ================================================================
  // UPDATE FIELD (GENERIC)
  // ================================================================
  const updateField = useCallback(
    async <K extends DirectWriteCharacterField>(field: K, value: Character[K]): Promise<void> => {
      if (!allowedToEdit || !hasCharacter) return;

      setPendingUpdateCount((count) => count + 1);
      try {
        await updateCharacter(campaignId, characterId, {
          [field]: stripUndefined(value),
        } as Partial<Character>);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update field";
        toast.error(`Update failed: ${message}`);
        console.error("Failed to update field:", err);
      } finally {
        setPendingUpdateCount((count) => Math.max(0, count - 1));
      }
    },
    [allowedToEdit, hasCharacter, campaignId, characterId, toast]
  );

  type PatchableCharacterField =
    | "notes"
    | "header"
    | "portraitUrl"
    | "characteristics"
    | "talentsAndTraits"
    | "weaponTraining"
    | "psychic"
    | "cybernetics"
    | "rangedWeapons"
    | "meleeWeapons"
    | "archeotech"
    | "insanity"
    | "gear"
    | "consumables"
    | "drugs"
    | "grenades"
    | "shields"
    | "armour"
    | "companions"
    | "skills"
    | "wounds"
    | "fate"
    | "corruption"
    | "movement"
    | "experience";

  const pendingCoalesced = useRef(new Map<string, PendingCoalescedPatch>());

  const sendPatch = useCallback(
    async (field: string, sent: unknown, version: number | undefined): Promise<boolean> => {
      setPendingUpdateCount((count) => count + 1);
      try {
        await patchCharacterField(campaignId, characterId, field, sent);
        if (version !== undefined) overlay?.confirm(field, version);
        return true;
      } catch (err) {
        if (version !== undefined) overlay?.revert(field, version);
        const message = err instanceof Error ? err.message : "Failed to update field";
        toast.error(`Update failed: ${message}`);
        console.error("Failed to update field:", err);
        return false;
      } finally {
        setPendingUpdateCount((count) => Math.max(0, count - 1));
      }
    },
    [campaignId, characterId, toast, overlay]
  );

  const flushCoalesced = useCallback(
    async (field: string): Promise<void> => {
      const entry = pendingCoalesced.current.get(field);
      if (!entry) return;
      pendingCoalesced.current.delete(field);
      const saved = await sendPatch(field, entry.sent, entry.version);
      entry.waiting.forEach((resolve) => resolve(saved));
    },
    [sendPatch]
  );

  const flushCoalescedRef = useRef(flushCoalesced);
  useEffect(() => {
    flushCoalescedRef.current = flushCoalesced;
  });

  useEffect(() => {
    const pending = pendingCoalesced.current;
    return () => {
      for (const [field, entry] of pending) {
        clearTimeout(entry.timer);
        void flushCoalescedRef.current(field);
      }
    };
  }, []);

  const patchFieldWithResult = useCallback(
    async <K extends PatchableCharacterField>(
      field: K,
      value: Character[K],
      options?: PatchOptions
    ): Promise<boolean> => {
      if (!allowedToEdit || !hasCharacter) return false;

      const sent = stripUndefined(value);
      const version = options?.optimistic ? overlay?.apply(field, sent) : undefined;
      const pending = pendingCoalesced.current.get(field);

      if (options?.coalesceMs !== undefined) {
        const delay = options.coalesceMs;
        return new Promise<boolean>((resolve) => {
          if (pending) clearTimeout(pending.timer);
          pendingCoalesced.current.set(field, {
            sent,
            version,
            waiting: [...(pending?.waiting ?? []), resolve],
            timer: setTimeout(() => void flushCoalesced(field), delay),
          });
        });
      }

      if (pending) {
        clearTimeout(pending.timer);
        pendingCoalesced.current.delete(field);
      }
      const saved = await sendPatch(field, sent, version);
      pending?.waiting.forEach((resolve) => resolve(saved));
      return saved;
    },
    [allowedToEdit, hasCharacter, overlay, flushCoalesced, sendPatch]
  );

  const patchField = useCallback(
    async <K extends PatchableCharacterField>(
      field: K,
      value: Character[K],
      options?: PatchOptions
    ): Promise<void> => {
      await patchFieldWithResult(field, value, options);
    },
    [patchFieldWithResult]
  );

  const patchFieldsWithResult = useCallback(
    async (partial: Record<string, unknown>): Promise<boolean> => {
      if (!allowedToEdit || !hasCharacter) return false;
      setPendingUpdateCount((count) => count + 1);
      try {
        await patchCharacterFields(campaignId, characterId, stripUndefined(partial));
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update character";
        toast.error(`Update failed: ${message}`);
        console.error("Failed to update character:", err);
        return false;
      } finally {
        setPendingUpdateCount((count) => Math.max(0, count - 1));
      }
    },
    [allowedToEdit, hasCharacter, campaignId, characterId, toast]
  );

  const patchFields = useCallback(
    async (partial: Record<string, unknown>): Promise<void> => {
      await patchFieldsWithResult(partial);
    },
    [patchFieldsWithResult]
  );

  const adjustXp = useCallback(
    async (amountXp: number, reason: string): Promise<boolean> => {
      if (!allowedToEdit || !hasCharacter) return false;
      setPendingUpdateCount((count) => count + 1);
      try {
        await adjustCharacterXp(campaignId, characterId, amountXp, reason);
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to adjust XP";
        toast.error(`XP adjustment failed: ${message}`);
        console.error("Failed to adjust XP:", err);
        return false;
      } finally {
        setPendingUpdateCount((count) => Math.max(0, count - 1));
      }
    },
    [allowedToEdit, hasCharacter, campaignId, characterId, toast]
  );

  const patchCollectionField = useCallback(
    async (
      field: "consumables" | "drugs" | "grenades" | "rangedWeapons" | "meleeWeapons" | "armour",
      before: unknown[],
      after: unknown[],
      options?: PatchOptions
    ): Promise<void> => {
      if (!allowedToEdit || !hasCharacter) return;
      const version = options?.optimistic ? overlay?.apply(field, after) : undefined;
      setPendingUpdateCount((count) => count + 1);
      try {
        await patchCharacterCollectionField(campaignId, characterId, field, before, after, {
          flushPendingNumbers: options?.optimistic === true,
        });
        if (version !== undefined) overlay?.confirm(field, version);
      } catch (err) {
        if (version !== undefined) overlay?.revert(field, version);
        const message = err instanceof Error ? err.message : "Failed to update quantity";
        toast.error(`Update failed: ${message}`);
        console.error("Failed to update character quantity:", err);
      } finally {
        setPendingUpdateCount((count) => Math.max(0, count - 1));
      }
    },
    [allowedToEdit, hasCharacter, campaignId, characterId, toast, overlay]
  );

  // ================================================================
  // UPDATE CHARACTERISTIC
  // ================================================================
  const updateCharacteristic = useCallback(
    async (statKey: keyof Characteristics, value: CharField): Promise<void> => {
      if (!allowedToEdit || !characteristics) return;

      setPendingUpdateCount((count) => count + 1);
      try {
        const updated = stripUndefined({
          ...characteristics,
          [statKey]: value,
        });

        await patchCharacterField(campaignId, characterId, "characteristics", updated);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update characteristic";
        toast.error(`Update failed: ${message}`);
        console.error("Failed to update characteristic:", err);
      } finally {
        setPendingUpdateCount((count) => Math.max(0, count - 1));
      }
    },
    [allowedToEdit, characteristics, campaignId, characterId, toast]
  );

  // ================================================================
  // RELEASE CHARACTER (PLAYER ACTION)
  // ================================================================
  const releaseCharacter = useCallback(async (): Promise<boolean> => {
    if (!character) return false;

    setIsReleasing(true);
    try {
      await releaseCharacterInService(campaignId, characterId);

      toast.success("Character released successfully");
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to release character";
      toast.error(`Release failed: ${message}`);
      console.error("Failed to release character:", err);
      return false;
    } finally {
      setIsReleasing(false);
    }
  }, [character, campaignId, characterId, toast]);

  // ================================================================
  // DM FORCE RELEASE
  // ================================================================
  const dmForceRelease = useCallback(async (): Promise<void> => {
    if (!character) return;

    setIsDmForceReleasing(true);
    try {
      await forceReleaseCharacter(campaignId, characterId);
      toast.success("Character force-released");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to force release";
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
      try {
        await forceAssignCharacter(campaignId, characterId, targetUid);
        toast.success("Character assigned successfully");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to assign character";
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
    try {
      const newValue = !character.isEditableByPlayer;

      await updateCharacter(campaignId, characterId, {
        isEditableByPlayer: newValue,
      });

      toast.success(newValue ? "Player editing enabled" : "Player editing disabled");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to toggle edit permission";
      toast.error(`Toggle failed: ${message}`);
      console.error("Failed to toggle edit permission:", err);
    } finally {
      setIsDmTogglingEdit(false);
    }
  }, [character, campaignId, characterId, toast]);

  return {
    // Mutations
    updateField,
    patchField,
    patchFields,
    patchFieldWithResult,
    patchFieldsWithResult,
    patchCollectionField,
    adjustXp,
    updateCharacteristic,
    releaseCharacter,
    dmForceRelease,
    dmForceAssign,
    dmToggleEdit,

    // Loading states
    isUpdating: pendingUpdateCount > 0,
    isReleasing,
    isDmForceReleasing,
    isDmForceAssigning,
    isDmTogglingEdit,
  };
}
