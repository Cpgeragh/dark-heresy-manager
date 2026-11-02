import { useCallback, useState } from "react";
import { useAssignedItemMeta } from "./useAssignedItemMeta";

/** What the assigned-cost screen must ask for, worked out from the item that was picked. */
export interface AssignedItemNeeds {
  cost: boolean;
  weight: boolean;
  rarity: boolean;
  /** The lowest cost that may be entered, for an item priced with a plus sign. */
  minimumCost?: number;
}

const NOTHING_PENDING: AssignedItemNeeds = { cost: true, weight: false, rarity: false };

/**
 * The one flow for an item whose cost, weight or rarity is assigned when it is picked: it holds the
 * picked item, what that item needs, the typed values, and the begin, cancel and confirm steps.
 */
export function useAssignedItemPick<T>(needsOf: (item: T) => AssignedItemNeeds) {
  const [pending, setPending] = useState<T | null>(null);
  const needs = pending !== null ? needsOf(pending) : NOTHING_PENDING;
  const meta = useAssignedItemMeta({
    requiresCost: needs.cost,
    requiresWeight: needs.weight,
    requiresRarity: needs.rarity,
    minimumCost: needs.minimumCost,
  });
  const { resetAssignedItemMeta, canConfirm } = meta;

  const begin = useCallback(
    (item: T) => {
      setPending(item);
      resetAssignedItemMeta();
    },
    [resetAssignedItemMeta]
  );

  const cancel = useCallback(() => {
    setPending(null);
    resetAssignedItemMeta();
  }, [resetAssignedItemMeta]);

  /** Runs `submit` with the picked item once the typed values are valid, then closes the screen. */
  const confirm = async (submit: (item: T) => unknown) => {
    if (pending === null || !canConfirm) return;
    await submit(pending);
    cancel();
  };

  return { pending, needs, meta, begin, cancel, confirm };
}

export type AssignedItemPick<T> = ReturnType<typeof useAssignedItemPick<T>>;
