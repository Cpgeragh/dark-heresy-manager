// src/ui/CustomItemActionButtons.tsx

import { useState } from "react";
import type { CampaignCustomItem } from "../types/CustomItems";
import type {
  CustomItemLibraryAction,
  CustomItemLibraryActionCallbacks,
} from "../types/CustomItemActions";
import { Button } from "./Button";
import { ConfirmInline } from "./ConfirmInline";
import {
  preflightCustomItemArchive,
  preflightCustomItemUpdateAllCopies,
  type CustomItemOperationPreflight,
} from "../services/customItemService";

interface PreflightState {
  loading: boolean;
  result?: CustomItemOperationPreflight;
  error?: string;
}

function PreflightDetails({ state }: { state: PreflightState }) {
  if (state.loading) return <span className="text-xs text-slate-500">Checking impact…</span>;
  if (state.error) return <span className="text-xs text-red-400">{state.error}</span>;
  if (!state.result) return null;
  return (
    <span className={state.result.safe ? "text-xs text-slate-500" : "text-xs text-red-400"}>
      {state.result.safe
        ? `Affects ${state.result.affectedDocuments} document${state.result.affectedDocuments === 1 ? "" : "s"} (${state.result.affectedCopies} linked ${state.result.affectedCopies === 1 ? "copy" : "copies"}).`
        : (state.result.reason ?? "This operation is not safe to start.")}
    </span>
  );
}

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
  const [archivePreflight, setArchivePreflight] = useState<PreflightState>({ loading: false });
  const [updatePreflight, setUpdatePreflight] = useState<PreflightState>({ loading: false });
  if (!canEditDefinition && !isDM) return null;
  const busy = busyAction !== null;

  const loadArchivePreflight = async () => {
    setArchivePreflight({ loading: true });
    try {
      const result = await preflightCustomItemArchive({
        campaignId: libraryItem.campaignId,
        customItemId: libraryItem.id,
      });
      setArchivePreflight({ loading: false, result });
    } catch (error) {
      setArchivePreflight({
        loading: false,
        error: error instanceof Error ? error.message : "Unable to check this operation.",
      });
    }
  };

  const loadUpdatePreflight = async () => {
    setUpdatePreflight({ loading: true });
    try {
      const result = await preflightCustomItemUpdateAllCopies({
        campaignId: libraryItem.campaignId,
        customItemId: libraryItem.id,
        versionId: libraryItem.draftVersionId ?? undefined,
      });
      setUpdatePreflight({ loading: false, result });
    } catch (error) {
      setUpdatePreflight({
        loading: false,
        error: error instanceof Error ? error.message : "Unable to check this operation.",
      });
    }
  };

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
          onArm={loadArchivePreflight}
          details={<PreflightDetails state={archivePreflight} />}
          confirmDisabled={!archivePreflight.result?.safe}
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
          onArm={loadUpdatePreflight}
          details={<PreflightDetails state={updatePreflight} />}
          confirmDisabled={!updatePreflight.result?.safe}
          onConfirm={() => onUpdateAllCopies?.()}
        />
      )}
    </div>
  );
}
