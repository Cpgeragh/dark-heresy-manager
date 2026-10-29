import { useState } from "react";
import { CloseIcon } from "../icons/CloseIcon";
import { RemoveEntryModal } from "../modals/RemoveEntryModal";
import { uiDismissButton } from "../styles/buttonStyles";
import type { ChipSize } from "../styles/chipStyles";
import type { ChipColour } from "../styles/colourTokens";
import { Chip } from "./Chip";

interface RemovableChipConfirmation {
  kind: string;
  from?: string;
}

interface RemovableChipProps {
  name: string;
  onRemove: () => unknown;
  confirmation?: RemovableChipConfirmation;
  colour?: ChipColour;
  size?: ChipSize;
  className?: string;
}

/** A chip whose close button either edits local form state or confirms removal of saved data. */
export function RemovableChip({
  name,
  onRemove,
  confirmation,
  colour = "slate",
  size = "md",
  className,
}: RemovableChipProps) {
  const [confirming, setConfirming] = useState(false);
  const remove = () => {
    if (confirmation) {
      setConfirming(true);
      return;
    }
    void onRemove();
  };

  return (
    <>
      <Chip colour={colour} size={size} className={className}>
        {name}
        <button
          type="button"
          onClick={remove}
          aria-label={`Remove ${name}`}
          className={uiDismissButton}
        >
          <CloseIcon />
        </button>
      </Chip>
      {confirming && confirmation && (
        <RemoveEntryModal
          kind={confirmation.kind}
          name={name}
          from={confirmation.from}
          onRemove={onRemove}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  );
}
