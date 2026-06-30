import type { WornArmourPiece } from "../../../types/Character";
import { uiSection, uiTextLabel, uiTextMuted, uiTextPlaceholder } from "../../../ui/editableStyles";
import { uiActionButtonCompact } from "../../../ui/buttonStyles";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { StatChip } from "../weapons/weaponShared";
import { InfoModal } from "../../../components/InfoModal";
import { locationLabel } from "./armourHelpers";
import { ARMOUR_REFERENCE } from "../../../data/reference/armourReference";
import { ARMOUR_SPECIAL_RULES } from "../../../data/reference/armourSpecialRules";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { CustomItemActionButtons } from "../../../ui/CustomItemActionButtons";
import { StatusBadge } from "../../../ui/StatusBadge";

interface Props {
  piece: WornArmourPiece;
  editable: boolean;
  worn: boolean;
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

function armourCraftsmanshipInfo(craftsmanship: NonNullable<WornArmourPiece["craftsmanship"]>) {
  switch (craftsmanship) {
    case "Poor":
      return "Badly fitted, designed or damaged armour. Characters wearing Poor armour take a -10 penalty to all Agility Tests.";
    case "Good":
      return "Well constructed and better fitting armour. Against the first attack in any round, the armour increases its AP by 1.";
    case "Best":
      return "Finely wrought and perfectly fitted armour. Best armour weighs half the normal amount and increases its AP by 1.";
    case "Common":
    default:
      return "Common craftsmanship armour has no additional modifier.";
  }
}

function ArmourQualitiesContent({ qualities }: { qualities: string[] }) {
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

export function PieceRow({
  piece,
  editable,
  worn,
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
  const apDesc =
    Object.keys(piece.apOverrides ?? {}).length > 0 ? `${piece.ap}*` : String(piece.ap);
  const craftsmanship = piece.craftsmanship ?? "Common";

  const ref = ARMOUR_REFERENCE.find((r) => r.id === piece.referenceId);
  const qualities = piece.qualities ?? ref?.qualities ?? [];
  const notes = piece.notes ?? ref?.notes;

  return (
    <div className={[uiSection, "flex items-center gap-3", !worn ? "opacity-60" : ""].join(" ")}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm lg:text-base font-medium text-slate-200 truncate">{piece.name}</span>
          {libraryItem && (
            <StatusBadge status={libraryItem.status} />
          )}
        </div>

        <div className="mt-1 space-y-1">
          <div className="flex flex-wrap gap-1.5">
            <StatChip label="Location" value={locationLabel(piece.locations)} />
            <StatChip label="AP" value={apDesc} />
          </div>
          <ItemMetaChips
            weight={piece.weight}
            value={piece.value}
            availability={piece.availability}
            source={piece.source}
          />
        </div>

        <div className="flex items-center gap-1.5 mt-1">
          <span className={uiTextLabel}>Qualities</span>
          <span className={`text-xs lg:text-sm ${uiTextMuted} italic`}>
            {qualities.length > 0 ? qualities.join(", ") : "-"}
          </span>
          {qualities.length > 0 && (
            <span className="inline-flex items-center -translate-y-[1.4px]">
              <InfoModal
                title={`${piece.name} Qualities`}
                content={<ArmourQualitiesContent qualities={qualities} />}
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
            title={`${craftsmanship} Armour`}
            content={armourCraftsmanshipInfo(craftsmanship)}
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
          className="text-xs lg:text-sm px-2 lg:px-3 py-1 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 transition whitespace-nowrap"
        >
          {worn ? "Stow" : "Wear"}
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
