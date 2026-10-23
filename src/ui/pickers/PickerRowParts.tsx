// src/ui/pickers/PickerRowParts.tsx

import type { HTMLAttributes, ReactNode } from "react";
import { InfoModal } from "../../components/InfoModal";
import type { CustomItemStatus } from "../../types/CustomItems";
import { StatusBadge } from "../chips/StatusBadge";
import { EntryDetailLine } from "../EntryDetailLine";
import { InfoParagraph } from "../InfoSection";
import {
  uiChipRow,
  uiInfoModalWrapper,
  uiItemNameHover,
  uiTextBody,
} from "../styles/editableStyles";

export function PickerRowName({
  name,
  badges,
  status,
  infoTitle,
  information,
}: {
  name: ReactNode;
  badges?: ReactNode;
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
      {infoTitle !== undefined && (
        <span className={uiInfoModalWrapper} onClick={(event) => event.stopPropagation()}>
          <InfoModal title={infoTitle} content={information} as="span" />
        </span>
      )}
    </div>
  );
}

export function PickerRowChips({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`mt-1 ${uiChipRow} items-center ${className}`.trim()} {...props} />;
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

/** The Rules line of a picker row: a label with an information icon, shown only when the entry has rules. */
export function PickerRowRulesLine({ name, rules }: { name: string; rules?: string }) {
  const text = rules?.trim();
  if (!text) return null;
  return (
    <PickerRowLine
      label="Rules"
      info={
        <InfoModal
          title={`${name} Rules`}
          content={<InfoParagraph>{text}</InfoParagraph>}
          as="span"
        />
      }
    />
  );
}

export function PickerRowText({ className = "", ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`mt-1 text-xs lg:text-sm ${uiTextBody} ${className}`.trim()} {...props} />;
}
