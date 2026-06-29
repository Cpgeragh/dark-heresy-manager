// src/ui/CustomItemActionButtons.tsx

import type { CampaignCustomItem } from "../types/CustomItems";
import { uiActionButtonCompact } from "./buttonStyles";

interface Props {
  libraryItem: CampaignCustomItem;
  isDM: boolean;
  canEditDefinition: boolean;
  busyAction?: "publish" | "archive" | "updateAll" | null;
  className?: string;
  onEditDefinition?: () => void;
  onPublish?: () => void;
  onArchive?: () => void;
  onUpdateAllCopies?: () => void;
}

export function CustomItemActionButtons({
  libraryItem,
  isDM,
  canEditDefinition,
  busyAction = null,
  className = "mt-2 flex flex-wrap gap-2",
  onEditDefinition,
  onPublish,
  onArchive,
  onUpdateAllCopies,
}: Props) {
  if (!canEditDefinition && !isDM) return null;
  return (
    <div className={className}>
      {canEditDefinition && libraryItem.status !== "archived" && (
        <button type="button" onClick={onEditDefinition} className={uiActionButtonCompact}>
          Edit Definition
        </button>
      )}
      {isDM && !libraryItem.publishedVersionId && libraryItem.status === "draft" && (
        <button
          type="button"
          onClick={onPublish}
          disabled={busyAction === "publish"}
          className={`${uiActionButtonCompact} disabled:opacity-50`}
        >
          {busyAction === "publish" ? "Publishing..." : "Publish"}
        </button>
      )}
      {isDM && libraryItem.status !== "archived" && (
        <button
          type="button"
          onClick={onArchive}
          disabled={busyAction === "archive"}
          className={`${uiActionButtonCompact} disabled:opacity-50`}
        >
          {busyAction === "archive" ? "Archiving..." : "Archive"}
        </button>
      )}
      {isDM && !!libraryItem.publishedVersionId && !!libraryItem.draftVersionId && (
        <button
          type="button"
          onClick={onUpdateAllCopies}
          disabled={busyAction === "updateAll"}
          className={`${uiActionButtonCompact} disabled:opacity-50`}
        >
          {busyAction === "updateAll" ? "Updating..." : "Update All Copies"}
        </button>
      )}
    </div>
  );
}
