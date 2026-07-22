// src/pages/CampaignOverview/CustomItemAdminRow.tsx

import { useState } from "react";
import type { CampaignCustomItem, CustomItemCategory } from "../../types/CustomItems";
import { Button } from "../../ui/Button";
import { uiSection } from "../../ui/editableStyles";
import { ConfirmInline } from "../../ui/ConfirmInline";
import { useToast } from "../../components/Toast";
import { permanentlyDeleteCustomItem, restoreCustomItem } from "../../services/customItemService";
import { StatusBadge } from "../../ui/StatusBadge";
import { useCustomItemLibraryActions } from "../../hooks/useCustomItemLibraryActions";
import { CUSTOM_ITEM_CATEGORY_LABELS } from "../../constants/customItems";

type ManagementBusyAction = "restore" | "delete";

export function CustomItemAdminRow({
  item,
  campaignId,
  userId,
}: {
  item: CampaignCustomItem;
  campaignId: string;
  userId: string;
}) {
  const [managementBusyAction, setManagementBusyAction] = useState<ManagementBusyAction | null>(
    null
  );
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

  const handleRestore = async () => {
    setManagementBusyAction("restore");
    try {
      await restoreCustomItem({ campaignId, customItemId: item.id, actorUserId: userId });
      toast.success(`${item.name} restored.`);
    } catch (err) {
      console.error(err);
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
      console.error(err);
      toast.error("Failed to delete item.");
    } finally {
      setManagementBusyAction(null);
    }
  };

  return (
    <div className={uiSection}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-medium text-slate-200">{item.name}</span>
            <span className="rounded border border-slate-600 bg-slate-800/60 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
              {CUSTOM_ITEM_CATEGORY_LABELS[item.category]}
            </span>
            <StatusBadge status={item.status} />
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {item.creator.characterName ?? "Unknown character"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {item.status === "draft" && (
            <Button size="xs" onClick={() => publishDefinition(item)} disabled={busy}>
              {busyAction === "publish" ? "Publishing…" : "Publish"}
            </Button>
          )}
          {item.status !== "archived" && (
            <Button size="xs" onClick={() => archiveDefinition(item)} disabled={busy}>
              {busyAction === "archive" ? "Archiving…" : "Archive"}
            </Button>
          )}
          {item.status === "published" && !!item.draftVersionId && (
            <Button size="xs" onClick={() => updateAllCopies(item)} disabled={busy}>
              {busyAction === "updateAll" ? "Updating…" : "Update All Copies"}
            </Button>
          )}
          {item.status === "archived" && (
            <Button size="xs" onClick={handleRestore} disabled={busy}>
              {busyAction === "restore" ? "Restoring…" : "Restore"}
            </Button>
          )}
          {item.status === "archived" && (
            <ConfirmInline
              triggerLabel="Delete"
              question="Permanently delete?"
              onConfirm={handleDelete}
              busy={busyAction === "delete"}
              busyLabel="Deleting…"
              variant="danger"
              size="sm"
            />
          )}
        </div>
      </div>
    </div>
  );
}
