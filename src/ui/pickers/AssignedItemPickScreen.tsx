import type { ReactNode } from "react";
import type { AssignedItemPick } from "../../hooks/useAssignedItemPick";
import { AssignedItemMetaScreen } from "./AssignedItemMetaScreen";

interface AssignedItemPickScreenProps<T extends { name: string }> {
  pick: AssignedItemPick<T>;
  title: string;
  /** The sentence after the item name. An item priced with a plus sign and no weight uses its own sentence. */
  explanation?: ReactNode;
  /** The cost box placeholder, unless the item has a minimum cost. */
  costPlaceholder?: string;
  idPrefix: string;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
  /** Where the Close cross and Cancel go; the default returns to the list. */
  onBack?: () => void;
  maxWidth?: string;
}

/** The Assigned Cost pop-up that every picker shows for an item whose cost, weight or rarity is set when it is picked. */
export function AssignedItemPickScreen<T extends { name: string }>({
  pick,
  title,
  explanation,
  costPlaceholder = "e.g. 500",
  idPrefix,
  confirmLabel,
  onConfirm,
  onBack,
  maxWidth,
}: AssignedItemPickScreenProps<T>) {
  const { pending, needs, meta } = pick;
  if (pending === null) return null;
  const minimumText = needs.minimumCost?.toLocaleString("en-US");
  const explanationText =
    minimumText !== undefined && !needs.weight
      ? `has an open-ended cost of ${minimumText} or more. Enter the value assigned for this item.`
      : explanation;

  return (
    <AssignedItemMetaScreen
      title={title}
      itemName={pending.name}
      explanation={explanationText}
      gmCost={meta.gmCost}
      setGmCost={meta.setGmCost}
      costValid={meta.costValid}
      costPlaceholder={minimumText !== undefined ? `At least ${minimumText}` : costPlaceholder}
      minimumCost={needs.minimumCost}
      requiresCost={needs.cost}
      requiresWeight={needs.weight}
      gmWeight={meta.gmWeight}
      setGmWeight={meta.setGmWeight}
      requiresRarity={needs.rarity}
      gmRarity={meta.gmRarity}
      setGmRarity={meta.setGmRarity}
      showRarityPicker={meta.showRarityPicker}
      setShowRarityPicker={meta.setShowRarityPicker}
      idPrefix={idPrefix}
      confirmLabel={confirmLabel}
      canConfirm={meta.canConfirm}
      onBack={onBack ?? pick.cancel}
      onConfirm={onConfirm}
      maxWidth={maxWidth}
    />
  );
}
