// src/pages/characterSheet/CyberneticsTab/ImplantRow.tsx

import type { CyberneticItem } from "../../../types/Character";
import { CYBERNETICS_REFERENCE } from "../../../data/reference/cyberneticsReference";
import { Chip } from "../../../ui/Chip";
import {
  uiSection,
  uiTextBody,
  uiTextLabel,
  uiTextMuted,
  uiItemName,
  uiInfoModalWrapper,
} from "../../../ui/editableStyles";
import { RemoveButton } from "../../../ui/RemoveButton";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { CRAFTSMANSHIP_STYLE } from "../../../ui/craftsmanship";
import { ARMOUR_LOCATION_LABELS } from "../../../constants/locations";
import {
  availableCraftsmanship,
  concealedWeaponBionicDescription,
  craftsmanshipDescription,
} from "./cyberneticsHelpers";
import { InfoModal } from "../../../components/InfoModal";
import type { CustomItemLibraryActionProps } from "../../../types/CustomItemActions";
import { CustomItemActionButtons } from "../../../ui/CustomItemActionButtons";
import { StatusBadge } from "../../../ui/StatusBadge";

interface Props extends CustomItemLibraryActionProps<"cybernetic"> {
  item: CyberneticItem;
  linkedArmName?: string;
  linkedWeaponName?: string;
  linkedWeaponType?: "ranged" | "melee";
  editable: boolean;
  onCycleQuality: (id: string) => void;
  onRemove: (id: string) => void;
}

export function ImplantRow({
  item,
  linkedArmName,
  linkedWeaponName,
  linkedWeaponType,
  editable,
  libraryItem,
  isDM = false,
  canEditDefinition = false,
  busyAction = null,
  onEditDefinition,
  onPublish,
  onArchive,
  onUpdateAllCopies,
  onCycleQuality,
  onRemove,
}: Props) {
  const ref = CYBERNETICS_REFERENCE.find((r) => r.id === item.referenceId);
  const qualityOptions = availableCraftsmanship(ref);
  const canChangeQuality = editable && qualityOptions.length > 1;
  const displayedCraftsmanship = qualityOptions.includes(item.craftsmanship)
    ? item.craftsmanship
    : qualityOptions[0];
  const qualityDescription = ref
    ? ref.id === "ih-concealed-weapon-bionic"
      ? concealedWeaponBionicDescription(displayedCraftsmanship, linkedWeaponType)
      : craftsmanshipDescription(ref, displayedCraftsmanship)
    : (item.notes ?? "No rules recorded.");
  const isConcealedWeaponBionic = ref?.id === "ih-concealed-weapon-bionic";

  return (
    <div className={[uiSection, "flex items-start gap-3"].join(" ")}>
      {/* Name + craftsmanship description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className={`${uiItemName} truncate`}>{item.name}</p>
          {libraryItem && <StatusBadge status={libraryItem.status} />}
          {!isConcealedWeaponBionic && (ref?.notes || item.notes) && (
            <span className={uiInfoModalWrapper}>
              <InfoModal
                title={item.name}
                content={
                  <div className="space-y-3">
                    {ref?.notes && (
                      <div>
                        <p className={`${uiTextLabel} font-semibold mb-1`}>Item Rules</p>
                        <p className={`text-sm ${uiTextBody} leading-relaxed`}>{ref.notes}</p>
                      </div>
                    )}
                    {item.notes && (
                      <div>
                        <p className={`${uiTextLabel} font-semibold mb-1`}>Notes</p>
                      <p className={`text-sm ${uiTextBody} leading-relaxed`}>{item.notes}</p>
                    </div>
                    )}
                  </div>
                }
              />
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {item.bodyLocation && item.bodyLocation.length > 0 && (
            <Chip className={`border-slate-700 bg-slate-800/40 ${uiTextMuted}`}>
              {item.bodyLocation.map((location) => ARMOUR_LOCATION_LABELS[location]).join(" & ")}
            </Chip>
          )}
          <ItemMetaChips
            bare
            value={item.value ?? ref?.value}
            availability={item.availability ?? ref?.availability}
            source={item.source ?? ref?.source}
          />
        </div>
        {item.grantedByTalentName && (
          <p className="mt-1 text-xs text-amber-300">Granted by {item.grantedByTalentName}</p>
        )}
        {linkedArmName && linkedWeaponName && (
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className={uiTextLabel}>Linked</span>
            <Chip className="border-pink-500/50 bg-pink-500/10 text-pink-300">{linkedArmName}</Chip>
            <Chip className="border-pink-500/50 bg-pink-500/10 text-pink-300">{linkedWeaponName}</Chip>
          </div>
        )}
        <div className="flex items-center gap-1.5 mt-1">
          <span className={uiTextLabel}>Quality</span>
          <Chip
            as="button"
            type="button"
            onClick={() => canChangeQuality && onCycleQuality(item.id)}
            title={
              canChangeQuality
                ? `Click to change quality (currently ${displayedCraftsmanship})`
                : displayedCraftsmanship
            }
            disabled={!canChangeQuality}
            className={[
              CRAFTSMANSHIP_STYLE[displayedCraftsmanship],
              canChangeQuality ? "cursor-pointer hover:opacity-80" : "cursor-default",
              "transition shrink-0",
            ].join(" ")}
          >
            {displayedCraftsmanship}
          </Chip>
          <span className={uiInfoModalWrapper}>
            <InfoModal
              title={`${displayedCraftsmanship} ${item.name}`}
              content={<p className={`whitespace-pre-line text-sm ${uiTextBody} leading-relaxed`}>{qualityDescription}</p>}
            />
          </span>
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

      {/* Info button */}
      <button type="button" onClick={() => undefined} title="View rules" className="hidden">
        ⓘ
      </button>

      {/* Craftsmanship badge — clickable when editable */}
      {/* Remove */}
      {editable && !item.grantedByTalentEntryUid && (
        <RemoveButton onClick={() => onRemove(item.id)} label="Remove" />
      )}
    </div>
  );
}
