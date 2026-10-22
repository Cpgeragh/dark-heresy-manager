// src/ui/pickers/PickerRowParts.tsx

import type { HTMLAttributes, ReactNode } from "react";
import { InfoModal } from "../../components/InfoModal";
import type { CustomItemStatus } from "../../types/CustomItems";
import { StatusBadge } from "../chips/StatusBadge";
import { EntryDetailLine } from "../EntryDetailLine";
import {
  uiChipRow,
  uiInfoModalWrapper,
  uiItemNameHover,
  uiTextBody,
  uiTextLabel,
} from "../styles/editableStyles";

export function PickerRowName({
  name,
  badges,
  info,
  status,
  infoTitle,
  information,
}: {
  name: ReactNode;
  badges?: ReactNode;
  info?: ReactNode;
  /** The status of a custom item, shown as its status badge after the name. */
  status?: CustomItemStatus;
  /** Titles the information window and shows its icon, always, with the empty message when `information` is missing. */
  infoTitle?: string;
  information?: ReactNode;
}) {
  return (
    <div className={`${uiChipRow} min-w-0 items-center`}>
      <span className={uiItemNameHover}>{name}</span>
      {status && <StatusBadge status={status} />}
      {badges}
      {(infoTitle !== undefined || info) && (
        <span className={uiInfoModalWrapper} onClick={(event) => event.stopPropagation()}>
          {infoTitle !== undefined ? (
            <InfoModal title={infoTitle} content={information} as="span" />
          ) : (
            info
          )}
        </span>
      )}
    </div>
  );
}

export function PickerRowChips({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`mt-1 ${uiChipRow} items-center ${className}`.trim()} {...props} />;
}

export function PickerRowInfoLine({
  label,
  children,
  info,
}: {
  label: ReactNode;
  children?: ReactNode;
  info?: ReactNode;
}) {
  return (
    <PickerRowChips>
      <span className={uiTextLabel}>{label}</span>
      {children}
      {info && (
        <span className={uiInfoModalWrapper} onClick={(event) => event.stopPropagation()}>
          {info}
        </span>
      )}
    </PickerRowChips>
  );
}

/** One labelled line in a picker row, built like the lines of an owned entry. */
export function PickerRowLine({
  label,
  value,
  info,
}: {
  label: string;
  value?: ReactNode;
  info?: ReactNode;
}) {
  return (
    <div className="mt-1">
      <EntryDetailLine label={label} value={value} info={info} />
    </div>
  );
}

export function PickerRowText({ className = "", ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`mt-1 text-xs lg:text-sm ${uiTextBody} ${className}`.trim()} {...props} />;
}
