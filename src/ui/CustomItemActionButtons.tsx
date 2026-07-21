// src/ui/CustomItemActionButtons.tsx

import type { CampaignCustomItem } from "../types/CustomItems";
import type {
  CustomItemLibraryAction,
  CustomItemLibraryActionCallbacks,
} from "../types/CustomItemActions";
import { Button } from "./Button";

interface Props extends CustomItemLibraryActionCallbacks {
  libraryItem: CampaignCustomItem;
  isDM: boolean;
  canEditDefinition: boolean;
  busyAction?: CustomItemLibraryAction | null;
  className?: string;
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
  const busy = busyAction !== null;

  return (
    <div className={className}>
      {canEditDefinition && libraryItem.status !== "archived" && (
        <Button size="xs" onClick={onEditDefinition} disabled={busy}>
          Edit Definition
        </Button>
      )}
      {isDM && !libraryItem.publishedVersionId && libraryItem.status === "draft" && (
        <Button
          size="xs"
          onClick={onPublish}
          disabled={busy}
        >
          {busyAction === "publish" ? "Publishing..." : "Publish"}
        </Button>
      )}
      {isDM && libraryItem.status !== "archived" && (
        <Button
          size="xs"
          onClick={onArchive}
          disabled={busy}
        >
          {busyAction === "archive" ? "Archiving..." : "Archive"}
        </Button>
      )}
      {isDM && !!libraryItem.publishedVersionId && !!libraryItem.draftVersionId && (
        <Button
          size="xs"
          onClick={onUpdateAllCopies}
          disabled={busy}
        >
          {busyAction === "updateAll" ? "Updating..." : "Update All Copies"}
        </Button>
      )}
    </div>
  );
}
