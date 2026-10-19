import type { ReactNode } from "react";
import {
  uiInfoModalWrapper,
  uiInlineRow,
  uiItemName,
  uiSection,
  uiStackField,
} from "./styles/editableStyles";

interface CharacterEntryRowProps {
  name: ReactNode;
  info?: ReactNode;
  beforeMetadata?: ReactNode;
  metadata?: ReactNode;
  afterMetadata?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}

/** Shared presentation for one owned entry on a character sheet. */
export function CharacterEntryRow({
  name,
  info,
  beforeMetadata,
  metadata,
  afterMetadata,
  actions,
  children,
}: CharacterEntryRowProps) {
  return (
    <div className={`${uiSection} text-sm lg:text-base`}>
      <div className="flex items-start justify-between gap-2">
        <div className={`min-w-0 ${uiStackField}`}>
          <div className="flex min-w-0 items-center gap-1.5">
            <span className={`${uiItemName} break-words`}>{name}</span>
            {info && <span className={uiInfoModalWrapper}>{info}</span>}
          </div>
          {beforeMetadata}
          {metadata}
          {afterMetadata}
          {children}
        </div>
        {actions && (
          <div className={`${uiInlineRow} shrink-0 flex-wrap justify-end`}>{actions}</div>
        )}
      </div>
    </div>
  );
}
