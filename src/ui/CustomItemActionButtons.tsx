// src/ui/CustomItemActionButtons.tsx

import type { CampaignCustomItem } from "../types/CustomItems";
import { Button } from "./Button";

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
        <Button size="xs" onClick={onEditDefinition}>
          Edit Definition
        </Button>
      )}
      {isDM && !libraryItem.publishedVersionId && libraryItem.status === "draft" && (
        <Button
          size="xs"
          onClick={onPublish}
          disabled={busyAction === "publish"}
        >
          {busyAction === "publish" ? "Publishing..." : "Publish"}
        </Button>
      )}
      {isDM && libraryItem.status !== "archived" && (
        <Button
          size="xs"
          onClick={onArchive}
          disabled={busyAction === "archive"}
        >
          {busyAction === "archive" ? "Archiving..." : "Archive"}
        </Button>
      )}
      {isDM && !!libraryItem.publishedVersionId && !!libraryItem.draftVersionId && (
        <Button
          size="xs"
          onClick={onUpdateAllCopies}
          disabled={busyAction === "updateAll"}
        >
          {busyAction === "updateAll" ? "Updating..." : "Update All Copies"}
        </Button>
      )}
    </div>
  );
}
