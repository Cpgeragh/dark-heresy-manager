// src/ui/pickers/PickerRowParts.tsx

import type { HTMLAttributes, ReactNode } from "react";
import {
  uiInfoModalWrapper,
  uiItemNameHover,
  uiTextBody,
  uiTextLabel,
} from "../styles/editableStyles";

export function PickerRowName({
  name,
  badges,
  info,
}: {
  name: ReactNode;
  badges?: ReactNode;
  info?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      <span className={uiItemNameHover}>{name}</span>
      {badges}
      {info && (
        <span className={uiInfoModalWrapper} onClick={(event) => event.stopPropagation()}>
          {info}
        </span>
      )}
    </div>
  );
}

export function PickerRowChips({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`mt-1 flex flex-wrap items-center gap-1.5 ${className}`.trim()} {...props} />
  );
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

export function PickerRowText({ className = "", ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`mt-1 text-xs lg:text-sm ${uiTextBody} ${className}`.trim()} {...props} />;
}
