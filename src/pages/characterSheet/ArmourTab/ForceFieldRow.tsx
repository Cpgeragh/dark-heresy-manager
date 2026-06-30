import type { WornArmourPiece } from "../../../types/Character";
import { uiSection, uiTextLabel, uiTextMuted, uiTextPlaceholder } from "../../../ui/editableStyles";
import { uiActionButtonCompact } from "../../../ui/buttonStyles";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { StatChip } from "../weapons/weaponShared";
import { InfoModal } from "../../../components/InfoModal";
import { ARMOUR_REFERENCE } from "../../../data/reference/armourReference";
import { ARMOUR_SPECIAL_RULES } from "../../../data/reference/armourSpecialRules";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { CustomItemActionButtons } from "../../../ui/CustomItemActionButtons";
import { StatusBadge } from "../../../ui/StatusBadge";

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
}

function forceFieldCraftsmanshipInfo(craftsmanship: NonNullable<WornArmourPiece["craftsmanship"]>) {
  switch (craftsmanship) {
    case "Poor":
      return "Poorly constructed field generator. Overloads on a roll of 01–15.";
    case "Good":
      return "Well constructed field generator. Overloads on a roll of 01–05.";
    case "Best":
      return "Finest available field generator. Overloads only on a roll of 1.";
    case "Common":
    default:
      return "Standard field generator. Overloads on a roll of 01–10.";
  }
}

function ForceFieldQualitiesContent({ qualities }: { qualities: string[] }) {
  return (
    <div className="space-y-4">
      {qualities.map((name) => {
        const desc = ARMOUR_SPECIAL_RULES[name];
        if (!desc) return null;
        return (
          <div key={name}>
            <p className="text-sm lg:text-base font-semibold text-amber-300">{name}</p>
            <p className={`text-sm lg:text-base ${uiTextMuted} mt-1 leading-relaxed`}>{desc}</p>
          </div>
        );
      })}
    </div>
  );
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
}: Props) {
  const active = piece.worn;
  const ref = ARMOUR_REFERENCE.find((r) => r.id === piece.referenceId);
  const qualities = piece.qualities ?? ref?.qualities ?? [];
  const notes = piece.notes ?? ref?.notes;
  const craftsmanship = piece.craftsmanship ?? "Common";

  return (
    <div className={[uiSection, "flex items-center gap-3", !active ? "opacity-60" : ""].join(" ")}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm lg:text-base font-medium text-slate-200 truncate">{piece.name}</span>
          {libraryItem && (
            <StatusBadge status={libraryItem.status} />
          )}
        </div>

        <div className="mt-1 flex flex-wrap gap-1.5">
          {piece.protectionRating !== undefined && (
            <StatChip label="PR" value={String(piece.protectionRating)} />
          )}
        </div>

        <ItemMetaChips
          weight={piece.weight}
          value={piece.value}
          availability={piece.availability}
          source={piece.source}
          className="flex flex-wrap gap-1.5 mt-1"
        />

        <div className="flex items-center gap-1.5 mt-1">
          <span className={uiTextLabel}>Qualities</span>
          <span className={`text-xs lg:text-sm ${uiTextMuted} italic`}>
            {qualities.length > 0 ? qualities.join(", ") : "-"}
          </span>
          {qualities.length > 0 && (
            <span className="inline-flex items-center -translate-y-[1.4px]">
              <InfoModal
                title={`${piece.name} Qualities`}
                content={<ForceFieldQualitiesContent qualities={qualities} />}
              />
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 mt-1">
          <span className={uiTextLabel}>Rules</span>
          {notes ? (
            <span className="inline-flex items-center -translate-y-[1.4px]">
              <InfoModal title={`${piece.name} Rules`} content={notes} />
            </span>
          ) : (
            <span className={`text-xs lg:text-sm ${uiTextPlaceholder}`}>-</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 mt-1">
          <span className={uiTextLabel}>Craftsmanship</span>
          <span className={`text-xs lg:text-sm ${uiTextMuted} italic`}>{craftsmanship}</span>
          <InfoModal
            title={`${craftsmanship} Force Field`}
            content={forceFieldCraftsmanshipInfo(craftsmanship)}
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
