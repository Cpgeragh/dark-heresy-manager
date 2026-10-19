import type { WornArmourPiece } from "../../../types/Character";
import {
  uiChipRow,
  uiTextLabel,
  uiRuleName,
  uiTextDescription,
  uiStackBody,
} from "../../../ui/styles/editableStyles";
import { StateToggleButton } from "../../../ui/buttons/StateToggleButton";
import { EntryDetailLine } from "../../../ui/EntryDetailLine";
import { CharacterEntryRow } from "../../../ui/CharacterEntryRow";
import { RemoveEntryButton } from "../../../ui/RemoveEntryButton";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { StatChip } from "../../../ui/chips/StatChip";
import { InfoModal } from "../../../components/InfoModal";
import { InfoParagraph } from "../../../ui/InfoSection";
import { ARMOUR_REFERENCE } from "../../../data/reference/armourReference";
import { ARMOUR_SPECIAL_RULES } from "../../../data/reference/armourSpecialRules";
import type { CustomItemLibraryActionProps } from "../../../types/CustomItemActions";
import { CustomItemActionButtons } from "../../../ui/forms/CustomItemActionButtons";
import { StatusBadge } from "../../../ui/chips/StatusBadge";
import { forceFieldCraftsmanshipDescription } from "./armourHelpers";
import { Stepper } from "../../../components/Stepper";

interface Props extends CustomItemLibraryActionProps<"armour"> {
  piece: WornArmourPiece;
  editable: boolean;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdateSpareCells: (id: string, value: number) => void;
}

function ForceFieldQualitiesContent({ qualities }: { qualities: string[] }) {
  return (
    <div className={uiStackBody}>
      {qualities.map((name) => {
        const desc = ARMOUR_SPECIAL_RULES[name];
        if (!desc) return null;
        return (
          <div key={name}>
            <p className={uiRuleName}>{name}</p>
            <p className={`${uiTextDescription} mt-1`}>{desc}</p>
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
  onUpdateSpareCells,
}: Props) {
  const active = piece.worn;
  const ref = ARMOUR_REFERENCE.find((r) => r.id === piece.referenceId);
  const qualities = piece.qualities ?? ref?.qualities ?? [];
  const notes = piece.notes ?? ref?.notes;
  const craftsmanship = piece.craftsmanship ?? "Common";

  return (
    <CharacterEntryRow
      name={piece.name}
      badge={libraryItem ? <StatusBadge status={libraryItem.status} /> : undefined}
      inactive={!active}
      info={
        <InfoModal
          title={piece.name}
          content={
            piece.description ? <InfoParagraph>{piece.description}</InfoParagraph> : undefined
          }
        />
      }
      metadata={
        <>
          {piece.protectionRating !== undefined && (
            <div className={uiChipRow}>
              <StatChip label="PR" value={String(piece.protectionRating)} />
            </div>
          )}
          <ItemMetaChips
            weight={piece.weight}
            value={piece.value}
            availability={piece.availability}
            source={piece.source}
            className={uiChipRow}
          />
        </>
      }
      afterMetadata={
        <>
          <EntryDetailLine
            label="Qualities"
            value={qualities.length > 0 ? qualities.join(", ") : undefined}
            info={
              qualities.length > 0 ? (
                <InfoModal
                  title={`${piece.name} Qualities`}
                  content={<ForceFieldQualitiesContent qualities={qualities} />}
                />
              ) : undefined
            }
          />
          <EntryDetailLine
            label="Rules"
            info={
              notes ? (
                <InfoModal
                  title={`${piece.name} Rules`}
                  content={<InfoParagraph>{notes}</InfoParagraph>}
                />
              ) : undefined
            }
          />
          <EntryDetailLine
            label="Craftsmanship"
            value={craftsmanship}
            info={
              <InfoModal
                title={`${craftsmanship} Force Field`}
                content={forceFieldCraftsmanshipDescription(craftsmanship)}
              />
            }
          />

          {ref?.spareCellValue && (
            <div className="flex items-center gap-1.5">
              <span className={uiTextLabel}>Spare Cells</span>
              <Stepper
                value={piece.spareCells ?? 0}
                editable={editable}
                onChange={(value) => onUpdateSpareCells(piece.id, value)}
              />
            </div>
          )}
        </>
      }
      actions={
        <StateToggleButton
          active={active}
          activeLabel="Deactivate"
          inactiveLabel="Activate"
          activeBusyLabel="Deactivating"
          inactiveBusyLabel="Activating"
          statusLabel="Active"
          disabled={false}
          editable={editable}
          onChange={() => onToggle(piece.id)}
        />
      }
      removeAction={
        editable ? (
          <RemoveEntryButton
            kind="Force Field"
            name={piece.name}
            onRemove={() => onRemove(piece.id)}
          />
        ) : undefined
      }
    >
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
    </CharacterEntryRow>
  );
}
