// src/pages/characterSheet/ArmourTab/ForceFieldRow.tsx

import type { WornArmourPiece } from "../../../types/Character";
import { uiActionButtonCompact, uiSection } from "../../../ui/editableStyles";
import { Chip } from "../../../ui/Chip";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { CustomItemActionButtons } from "../../../ui/CustomItemActionButtons";

interface Props {
  piece: WornArmourPiece;
  editable: boolean;
  libraryItem?: CampaignCustomItem<"armour">;
  isDM?: boolean;
  canEditDefinition?: boolean;
  busyAction?: "publish" | "archive" | "updateAll" | null;
  onEditDefinition?: () => void;
  onPublish?: () => void;
  onArchive?: () => void;
  onUpdateAllCopies?: () => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onInfo: (piece: WornArmourPiece) => void;
}

export function ForceFieldRow({
  piece,
  editable,
  libraryItem,
  isDM = false,
  canEditDefinition = false,
  busyAction = null,
  onEditDefinition,
  onPublish,
  onArchive,
  onUpdateAllCopies,
  onToggle,
  onRemove,
  onInfo,
}: Props) {
  const active = piece.worn;
  return (
    <div className={[uiSection, "flex items-center gap-3", !active ? "opacity-60" : ""].join(" ")}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm lg:text-base font-medium text-slate-200 truncate">{piece.name}</span>
          {libraryItem && (
            <span
              className={[
                "shrink-0 rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide",
                libraryItem.status === "published"
                  ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
                  : libraryItem.status === "draft"
                    ? "border-amber-400/40 bg-amber-500/10 text-amber-300"
                    : "border-slate-500/50 bg-slate-800 text-slate-300",
              ].join(" ")}
            >
              {libraryItem.status}
            </span>
          )}
          <span className="inline-flex items-center -translate-y-[1.4px]">
            <button
              onClick={() => onInfo(piece)}
              title="View rules"
              className="inline-flex h-[13.5px] w-[18px] shrink-0 my-auto items-center justify-center rounded bg-slate-700 border border-slate-600 text-slate-300 leading-none hover:bg-slate-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-2.5 h-2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                />
              </svg>
            </button>
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {piece.protectionRating !== undefined && (
            <Chip className="border-slate-700 bg-slate-800/40 font-code text-slate-200">
              PR {piece.protectionRating}
            </Chip>
          )}
          <ItemMetaChips
            bare
            weight={piece.weight}
            value={piece.value}
            availability={piece.availability}
            source={piece.source}
          />
        </div>
        {libraryItem && (
          <CustomItemActionButtons
            libraryItem={libraryItem}
            isDM={isDM}
            canEditDefinition={canEditDefinition}
            busyAction={busyAction}
            onEditDefinition={onEditDefinition}
            onPublish={onPublish}
            onArchive={onArchive}
            onUpdateAllCopies={onUpdateAllCopies}
          />
        )}
      </div>

      {editable && (
        <button
          onClick={() => onToggle(piece.id)}
          className="text-xs lg:text-sm px-2 lg:px-3 py-1 lg:py-1.5 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 transition whitespace-nowrap"
        >
          {active ? "Deactivate" : "Activate"}
        </button>
      )}

      {editable && (
        <button
          onClick={() => onRemove(piece.id)}
          className={`${uiActionButtonCompact} shrink-0`}
        >
          Remove
        </button>
      )}
    </div>
  );
}
