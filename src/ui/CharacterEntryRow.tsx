import type { ReactNode } from "react";
import { colourNoticeAmber } from "./styles/colourTokens";
import {
  uiInactiveItem,
  uiInfoModalWrapper,
  uiInlineRow,
  uiItemName,
  uiNoticeBox,
  uiOverlayPeerHoverText,
  uiSection,
  uiSplitRow,
  uiStackField,
} from "./styles/editableStyles";
import { uiLayerLocal } from "./styles/layerStyles";

interface CharacterEntryRowContentProps {
  name: ReactNode;
  badge?: ReactNode;
  info?: ReactNode;
  leading?: ReactNode;
  beforeMetadata?: ReactNode;
  metadata?: ReactNode;
  afterMetadata?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  nameClassName?: string;
  interactive?: boolean;
}

interface CharacterEntryRowProps extends CharacterEntryRowContentProps {
  tone?: "default" | "archeotech";
  inactive?: boolean;
}

/** Shared internal layout for flat rows and interactive card headers. */
export function CharacterEntryRowContent({
  name,
  badge,
  info,
  leading,
  beforeMetadata,
  metadata,
  afterMetadata,
  actions,
  children,
  nameClassName = uiItemName,
  interactive = false,
}: CharacterEntryRowContentProps) {
  return (
    <div
      className={`w-full ${interactive ? `${uiSplitRow} relative ${uiLayerLocal} pointer-events-none ${uiOverlayPeerHoverText}` : "flex items-start justify-between gap-2"}`}
    >
      {leading && <div className="shrink-0">{leading}</div>}
      <div className={`min-w-0 flex-1 ${uiStackField}`}>
        <div className="flex min-w-0 items-center gap-1.5">
          <div className={`${nameClassName} break-words`}>{name}</div>
          {badge}
          {info && (
            <span
              className={`${uiInfoModalWrapper} ${interactive ? `relative ${uiLayerLocal} pointer-events-auto` : ""}`}
            >
              {info}
            </span>
          )}
        </div>
        {beforeMetadata}
        {metadata}
        {afterMetadata}
        {children}
      </div>
      {actions && <div className={`${uiInlineRow} shrink-0 flex-wrap justify-end`}>{actions}</div>}
    </div>
  );
}

/** Shared presentation for one owned entry on a character sheet. */
export function CharacterEntryRow({
  name,
  badge,
  info,
  leading,
  tone = "default",
  inactive = false,
  beforeMetadata,
  metadata,
  afterMetadata,
  actions,
  children,
  nameClassName,
  interactive,
}: CharacterEntryRowProps) {
  const containerClass =
    tone === "archeotech" ? `${uiNoticeBox} ${colourNoticeAmber} p-3 lg:p-4` : uiSection;

  return (
    <div className={`${containerClass} ${inactive ? uiInactiveItem : ""} text-sm lg:text-base`}>
      <CharacterEntryRowContent
        name={name}
        badge={badge}
        info={info}
        leading={leading}
        beforeMetadata={beforeMetadata}
        metadata={metadata}
        afterMetadata={afterMetadata}
        actions={actions}
        nameClassName={nameClassName}
        interactive={interactive}
      >
        {children}
      </CharacterEntryRowContent>
    </div>
  );
}
