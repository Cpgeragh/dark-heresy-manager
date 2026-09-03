// src/ui/forms/CustomItemActionButtons.tsx

import type { CampaignCustomItem } from "../../types/CustomItems";
import type {
  CustomItemLibraryAction,
  CustomItemLibraryActionCallbacks,
} from "../../types/CustomItemActions";
import { Button } from "../buttons/Button";
import { ConfirmInline } from "./ConfirmInline";

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
        <Button size="xs" onClick={onPublish} disabled={busy}>
          {busyAction === "publish" ? "Publishing..." : "Publish"}
        </Button>
      )}
      {isDM && libraryItem.status !== "archived" && (
        <ConfirmInline
          triggerLabel={busyAction === "archive" ? "Archiving..." : "Archive"}
          size="xs"
          variant="warning"
          question="Archive and remove copies?"
          busy={busy}
          onConfirm={() => onArchive?.()}
        />
      )}
      {isDM && !!libraryItem.publishedVersionId && !!libraryItem.draftVersionId && (
        <ConfirmInline
          triggerLabel={busyAction === "updateAll" ? "Updating..." : "Update All Copies"}
          size="xs"
          variant="warning"
          question="Publish and update copies?"
          busy={busy}
          onConfirm={() => onUpdateAllCopies?.()}
        />
      )}
    </div>
  );
}
