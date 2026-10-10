// src/pages/CampaignOverview/CustomItemAdminRow.tsx

import { useState } from "react";
import type { CampaignCustomItem, CustomItemCategory } from "../../types/CustomItems";
import { Button } from "../../ui/buttons/Button";
import { Chip } from "../../ui/chips/Chip";
import { uiChipRow, uiInlineRow, uiSection, uiTextError } from "../../ui/styles/editableStyles";
import { ConfirmInline } from "../../ui/forms/ConfirmInline";
import { useToast } from "../../components/Toast";
import {
  permanentlyDeleteCustomItem,
  preflightPermanentCustomItemDeletion,
  restoreCustomItem,
  type CustomItemOperationPreflight,
} from "../../services/customItemService";
import { StatusBadge } from "../../ui/chips/StatusBadge";
import { PendingOverlay } from "../../ui/PendingOverlay";
import { useCustomItemLibraryActions } from "../../hooks/useCustomItemLibraryActions";
import { CUSTOM_ITEM_CATEGORY_LABELS } from "../../constants/customItems";
import { recordComponentRender } from "../../performance/performanceMetrics";
import { colourMetadataLabelText, colourTextPrimary } from "../../ui/styles/colourTokens";

type ManagementBusyAction = "restore" | "delete";
type PreflightState = {
  loading: boolean;
  result?: CustomItemOperationPreflight;
  error?: string;
};

function impactDetails(state: PreflightState) {
  if (state.error) return <span className={`text-xs ${uiTextError}`}>{state.error}</span>;
  if (!state.result) return null;
  return (
    <span
      className={
        state.result.safe ? `text-xs ${colourMetadataLabelText}` : `text-xs ${uiTextError}`
      }
    >
      {state.result.safe
        ? `Affects ${state.result.affectedDocuments} document${state.result.affectedDocuments === 1 ? "" : "s"}${state.result.affectedCopies ? ` (${state.result.affectedCopies} linked copies)` : ""}.`
        : (state.result.reason ?? "This operation is not safe to start.")}
    </span>
  );
}

export function CustomItemAdminRow({
  item,
  campaignId,
  userId,
}: {
  item: CampaignCustomItem;
  campaignId: string;
  userId: string;
}) {
  recordComponentRender("CustomItemAdminRow");
  const [managementBusyAction, setManagementBusyAction] = useState<ManagementBusyAction | null>(
    null
  );
  const [deletePreflight, setDeletePreflight] = useState<PreflightState>({ loading: false });
  const toast = useToast();
  const { publishDefinition, archiveDefinition, updateAllCopies, getBusyAction } =
    useCustomItemLibraryActions<CustomItemCategory>({
      campaignId,
      userId,
      itemLabel: item.name,
      messageStyle: "namedItem",
    });
  const busyAction = getBusyAction(item.id) ?? managementBusyAction;
  const busy = busyAction !== null;

  const loadPreflight = async (
    setter: (state: PreflightState) => void,
    operation: () => Promise<CustomItemOperationPreflight>
  ) => {
    setter({ loading: true });
    try {
      setter({ loading: false, result: await operation() });
    } catch (error) {
      setter({
        loading: false,
        error: error instanceof Error ? error.message : "Unable to check this operation.",
      });
    }
  };

  const handleRestore = async () => {
    setManagementBusyAction("restore");
    try {
      await restoreCustomItem({ campaignId, customItemId: item.id, actorUserId: userId });
      toast.success(`${item.name} restored.`);
    } catch (err) {
      console.error("Failed to restore item:", err);
      toast.error("Failed to restore item.");
    } finally {
      setManagementBusyAction(null);
    }
  };

  const handleDelete = async () => {
    setManagementBusyAction("delete");
    try {
      await permanentlyDeleteCustomItem({ campaignId, customItemId: item.id });
      toast.success(`${item.name} permanently deleted.`);
    } catch (err) {
      console.error("Failed to delete item:", err);
      toast.error("Failed to delete item.");
    } finally {
      setManagementBusyAction(null);
    }
  };

  return (
    <div className={`${uiSection} relative`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={`${uiChipRow} items-center`}>
            <span className={`text-sm font-medium ${colourTextPrimary}`}>{item.name}</span>
            <Chip size="sm" colour="slate" className="uppercase tracking-wide">
              {CUSTOM_ITEM_CATEGORY_LABELS[item.category]}
            </Chip>
            <StatusBadge status={item.status} />
          </div>
          <p className={`text-xs ${colourMetadataLabelText} mt-0.5`}>
            {item.creator.characterName ?? "Unknown character"}
          </p>
        </div>
        <div className={`${uiInlineRow} flex-wrap shrink-0`}>
          {item.status === "draft" && (
            <Button
              size="xs"
              onClick={() => publishDefinition(item)}
              disabled={busy && busyAction !== "publish"}
              loading={busyAction === "publish"}
              loadingLabel="Publishing"
            >
              Publish
            </Button>
          )}
          {item.status !== "archived" && (
            <ConfirmInline
              triggerLabel="Archive"
              triggerLoading={busyAction === "archive"}
              triggerLoadingLabel="Archiving"
              question="Archive and remove copies?"
              variant="warning"
              size="xs"
              busy={busy}
              busyLabel="Archiving"
              onConfirm={() => archiveDefinition(item)}
            />
          )}
          {item.status === "published" && !!item.draftVersionId && (
            <ConfirmInline
              triggerLabel="Update All Copies"
              triggerLoading={busyAction === "updateAll"}
              triggerLoadingLabel="Updating"
              question="Publish and update copies?"
              variant="warning"
              size="xs"
              busy={busy}
              busyLabel="Updating"
              onConfirm={() => updateAllCopies(item)}
            />
          )}
          {item.status === "archived" && (
            <Button
              size="xs"
              onClick={handleRestore}
              disabled={busy && busyAction !== "restore"}
              loading={busyAction === "restore"}
              loadingLabel="Restoring"
            >
              Restore
            </Button>
          )}
          {item.status === "archived" && (
            <ConfirmInline
              triggerLabel="Delete"
              question="Permanently delete?"
              onConfirm={handleDelete}
              busy={busyAction === "delete"}
              busyLabel="Deleting"
              variant="danger"
              size="sm"
              onArm={() =>
                loadPreflight(setDeletePreflight, () =>
                  preflightPermanentCustomItemDeletion({
                    campaignId,
                    customItemId: item.id,
                  })
                )
              }
              details={impactDetails(deletePreflight)}
              confirmDisabled={!deletePreflight.result?.safe}
            />
          )}
        </div>
      </div>
      <PendingOverlay active={deletePreflight.loading} />
    </div>
  );
}
