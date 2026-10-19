import type { ReactNode } from "react";
import {
  uiInfoModalWrapper,
  uiTextBody,
  uiTextLabel,
  uiTextPlaceholder,
} from "./styles/editableStyles";

interface EntryDetailLineProps {
  label: string;
  value?: ReactNode;
  info?: ReactNode;
}

/** One labelled line inside a character entry, such as Qualities, Rules or Craftsmanship. */
export function EntryDetailLine({ label, value, info }: EntryDetailLineProps) {
  const hasValue = value !== undefined && value !== "";
  return (
    <div className="flex items-center gap-1.5">
      <span className={uiTextLabel}>{label}</span>
      {hasValue && <span className={`text-xs lg:text-sm ${uiTextBody}`}>{value}</span>}
      {info && <span className={uiInfoModalWrapper}>{info}</span>}
      {!hasValue && !info && <span className={`text-xs lg:text-sm ${uiTextPlaceholder}`}>-</span>}
    </div>
  );
}
