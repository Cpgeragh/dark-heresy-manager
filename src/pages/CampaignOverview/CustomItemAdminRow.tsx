// src/pages/CampaignOverview/CustomItemAdminRow.tsx

import { useState } from "react";
import type { CampaignCustomItem, CustomItemCategory, CustomItemStatus } from "../../types/CustomItems";
import { uiSection } from "../../ui/editableStyles";
import { uiActionButtonCompact } from "../../ui/buttonStyles";
import { ConfirmInline } from "../../ui/ConfirmInline";
import { useToast } from "../../components/Toast";
import {
  archiveCustomItem,
  permanentlyDeleteCustomItem,
  publishAndUpdateAllCopies,
  publishCustomItem,
  removeAllCustomItemCopies,
  restoreCustomItem,
} from "../../services/customItemService";

const CATEGORY_LABELS: Record<CustomItemCategory, string> = {
  gear: "Gear",
  consumable: "Consumable",
  drug: "Drug",
  cybernetic: "Cybernetic",
  weapon: "Weapon",
  armour: "Armour",
  archeotech: "Archeotech",
};

function StatusBadge({ status }: { status: CustomItemStatus }) {
  const cls =
    status === "published"
      ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
      : status === "draft"
        ? "border-amber-400/40 bg-amber-500/10 text-amber-300"
        : "border-slate-500/50 bg-slate-800 text-slate-300";
  return (
    <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${cls}`}>
      {status}
    </span>
  );
}

type BusyAction = "publish" | "archive" | "updateAll" | "restore" | "delete";

export function CustomItemAdminRow({
  item,
  campaignId,
  userId,
}: {
  item: CampaignCustomItem;
  campaignId: string;
  userId: string;
}) {
  const [busyAction, setBusyAction] = useState<BusyAction | null>(null);
  const toast = useToast();
  const busy = busyAction !== null;

  const handlePublish = async () => {
    setBusyAction("publish");
    try {
      await publishCustomItem({
        campaignId,
        customItemId: item.id,
        actorUserId: userId,
        versionId: item.draftVersionId ?? item.latestVersionId,
      });
      toast.success(`${item.name} published.`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to publish item.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleArchive = async () => {
    setBusyAction("archive");
    try {
      await archiveCustomItem({ campaignId, customItemId: item.id, actorUserId: userId });
      await removeAllCustomItemCopies({ campaignId, customItemId: item.id });
      toast.success(`${item.name} archived and removed from all characters.`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to archive item.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleUpdateAll = async () => {
    setBusyAction("updateAll");
    try {
      const count = await publishAndUpdateAllCopies({
        campaignId,
        customItemId: item.id,
        actorUserId: userId,
      });
      toast.success(`Updated ${count} ${count === 1 ? "copy" : "copies"}.`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update copies.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleRestore = async () => {
    setBusyAction("restore");
    try {
      await restoreCustomItem({ campaignId, customItemId: item.id, actorUserId: userId });
      toast.success(`${item.name} restored.`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to restore item.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleDelete = async () => {
    setBusyAction("delete");
    try {
      await permanentlyDeleteCustomItem({ campaignId, customItemId: item.id });
      toast.success(`${item.name} permanently deleted.`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete item.");
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className={uiSection}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-medium text-slate-200">{item.name}</span>
            <span className="rounded border border-slate-600 bg-slate-800/60 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
              {CATEGORY_LABELS[item.category]}
            </span>
            <StatusBadge status={item.status} />
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {item.creator.characterName ?? "Unknown character"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {item.status === "draft" && (
            <button
              type="button"
              onClick={handlePublish}
              disabled={busy}
              className={`${uiActionButtonCompact} disabled:opacity-50`}
            >
              {busyAction === "publish" ? "Publishing…" : "Publish"}
            </button>
          )}
          {item.status !== "archived" && (
            <button
              type="button"
              onClick={handleArchive}
              disabled={busy}
              className={`${uiActionButtonCompact} disabled:opacity-50`}
            >
              {busyAction === "archive" ? "Archiving…" : "Archive"}
            </button>
          )}
          {item.status === "published" && !!item.draftVersionId && (
            <button
              type="button"
              onClick={handleUpdateAll}
              disabled={busy}
              className={`${uiActionButtonCompact} disabled:opacity-50`}
            >
              {busyAction === "updateAll" ? "Updating…" : "Update All Copies"}
            </button>
          )}
          {item.status === "archived" && (
            <button
              type="button"
              onClick={handleRestore}
              disabled={busy}
              className={`${uiActionButtonCompact} disabled:opacity-50`}
            >
              {busyAction === "restore" ? "Restoring…" : "Restore"}
            </button>
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
