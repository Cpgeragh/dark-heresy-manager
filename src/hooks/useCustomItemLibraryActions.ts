import { useCallback, useRef, useState } from "react";
import { useToast } from "../components/Toast";
import {
  archiveCustomItem,
  publishAndUpdateAllCopies,
  publishCustomItem,
  removeAllCustomItemCopies,
} from "../services/customItemService";
import type {
  BusyCustomItemLibraryAction,
  CustomItemLibraryAction,
} from "../types/CustomItemActions";
import type { CampaignCustomItem, CustomItemCategory } from "../types/CustomItems";

interface UseCustomItemLibraryActionsArgs {
  campaignId: string;
  userId?: string | null;
  itemLabel: string;
  messageStyle?: "customCategory" | "namedItem";
}

export function useCustomItemLibraryActions<TCategory extends CustomItemCategory>({
  campaignId,
  userId,
  itemLabel,
  messageStyle = "customCategory",
}: UseCustomItemLibraryActionsArgs) {
  const toast = useToast();
  const [busyActions, setBusyActions] = useState<BusyCustomItemLibraryAction[]>([]);
  const inFlightItemIds = useRef(new Set<string>());

  const runAction = useCallback(
    async (
      libraryItem: CampaignCustomItem<TCategory>,
      action: CustomItemLibraryAction,
      operation: (actorUserId: string) => Promise<string>
    ) => {
      if (!userId || inFlightItemIds.current.has(libraryItem.id)) return;

      inFlightItemIds.current.add(libraryItem.id);
      setBusyActions((current) => [...current, { itemId: libraryItem.id, action }]);

      try {
        const successMessage = await operation(userId);
        toast.success(successMessage);
      } catch (error) {
        const errorMessage = getErrorMessage(action, itemLabel, messageStyle);
        if (messageStyle === "namedItem") {
          console.error(error);
        } else {
          console.error(errorMessage.replace(/\.$/, ":"), error);
        }
        toast.error(errorMessage);
      } finally {
        inFlightItemIds.current.delete(libraryItem.id);
        setBusyActions((current) =>
          current.filter(
            (busyAction) =>
              busyAction.itemId !== libraryItem.id || busyAction.action !== action
          )
        );
      }
    },
    [itemLabel, messageStyle, toast, userId]
  );

  const publishDefinition = useCallback(
    (libraryItem: CampaignCustomItem<TCategory>) =>
      runAction(libraryItem, "publish", async (actorUserId) => {
        await publishCustomItem({
          campaignId,
          customItemId: libraryItem.id,
          actorUserId,
          versionId: libraryItem.draftVersionId ?? libraryItem.latestVersionId,
        });
        return messageStyle === "namedItem"
          ? `${itemLabel} published.`
          : `Custom ${itemLabel} published.`;
      }),
    [campaignId, itemLabel, messageStyle, runAction]
  );

  const archiveDefinition = useCallback(
    (libraryItem: CampaignCustomItem<TCategory>) =>
      runAction(libraryItem, "archive", async (actorUserId) => {
        await archiveCustomItem({
          campaignId,
          customItemId: libraryItem.id,
          actorUserId,
        });
        await removeAllCustomItemCopies({ campaignId, customItemId: libraryItem.id });
        return messageStyle === "namedItem"
          ? `${itemLabel} archived and removed from all characters.`
          : `Custom ${itemLabel} archived and removed from all characters.`;
      }),
    [campaignId, itemLabel, messageStyle, runAction]
  );

  const updateAllCopies = useCallback(
    (libraryItem: CampaignCustomItem<TCategory>) =>
      runAction(libraryItem, "updateAll", async (actorUserId) => {
        const updatedCopies = await publishAndUpdateAllCopies({
          campaignId,
          customItemId: libraryItem.id,
          actorUserId,
        });
        return messageStyle === "namedItem"
          ? `Updated ${updatedCopies} ${updatedCopies === 1 ? "copy" : "copies"}.`
          : `Updated ${updatedCopies} ${itemLabel} ${updatedCopies === 1 ? "copy" : "copies"}.`;
      }),
    [campaignId, itemLabel, messageStyle, runAction]
  );

  const getBusyAction = useCallback(
    (itemId: string) =>
      busyActions.find((busyAction) => busyAction.itemId === itemId)?.action ?? null,
    [busyActions]
  );

  return {
    publishDefinition,
    archiveDefinition,
    updateAllCopies,
    getBusyAction,
  };
}

function getErrorMessage(
  action: CustomItemLibraryAction,
  itemLabel: string,
  messageStyle: "customCategory" | "namedItem"
) {
  if (messageStyle === "namedItem") {
    if (action === "publish") return "Failed to publish item.";
    if (action === "archive") return "Failed to archive item.";
    return "Failed to update copies.";
  }

  if (action === "publish") return `Failed to publish custom ${itemLabel}.`;
  if (action === "archive") return `Failed to archive custom ${itemLabel}.`;
  return `Failed to update custom ${itemLabel} copies.`;
}
