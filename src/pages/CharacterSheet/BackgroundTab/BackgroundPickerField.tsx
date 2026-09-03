import type { ReactNode } from "react";
import { Button } from "../../../ui/buttons/Button";
import { uiFormLabel, uiSectionShell, uiTextPlaceholder } from "../../../ui/styles/editableStyles";

interface BackgroundPickerFieldProps {
  label: string;
  selected: boolean;
  value: ReactNode;
  emptyText: string;
  showAction: boolean;
  disabled: boolean;
  onClick: () => void;
  info?: ReactNode;
  /** Smaller box/text — for short single-word values in narrow grid cells. */
  compact?: boolean;
}

export function BackgroundPickerField({
  label,
  selected,
  value,
  emptyText,
  showAction,
  disabled,
  onClick,
  info,
  compact = false,
}: BackgroundPickerFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className={uiFormLabel}>{label}</span>
          {info}
        </div>
        {showAction && (
          <Button
            size="xs"
            disabled={disabled}
            onClick={onClick}
            aria-label={`${selected ? "Change" : "Select"} ${label}`}
            className="shrink-0"
          >
            {selected ? "Change" : "Select"}
          </Button>
        )}
      </div>
      <div className={uiSectionShell + " overflow-hidden"}>
        <div className={compact ? "min-h-9 px-2.5 py-1.5 lg:px-3 lg:py-2" : "min-h-11 px-3 py-2.5 lg:px-4 lg:py-3"}>
          <div className={`min-w-0 ${compact ? "text-sm lg:text-base" : ""} ${selected ? "" : uiTextPlaceholder}`}>
            {selected ? value : emptyText}
          </div>
        </div>
      </div>
    </div>
  );
}
