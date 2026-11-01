import type { ReactNode } from "react";
import { QuantityControl } from "./QuantityControl";
import { colourDivider } from "./styles/colourTokens";
import { uiInlineRow, uiSplitRow, uiTextLabel } from "./styles/editableStyles";

interface EntryQuantityRowProps {
  quantity: number;
  editable: boolean;
  onUpdate: (quantity: number) => void;
  /** A short note shown beside the counter. */
  note?: ReactNode;
}

/** The Quantity row of a weapon or grenade card: the label on the left and the counter on the right. */
export function EntryQuantityRow({ quantity, editable, onUpdate, note }: EntryQuantityRowProps) {
  return (
    <div className={`border-t ${colourDivider} pt-2 ${uiSplitRow}`}>
      <span className={uiTextLabel}>Quantity</span>
      <div className={uiInlineRow}>
        {note}
        <QuantityControl quantity={quantity} editable={editable} size="sm" onUpdate={onUpdate} />
      </div>
    </div>
  );
}
