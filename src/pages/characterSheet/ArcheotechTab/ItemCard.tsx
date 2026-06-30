// src/pages/characterSheet/ArcheotechTab/ItemCard.tsx

import { useState } from "react";
import type { ArcheotechItem } from "../../../types/Character";
import { ARCHEOTECH_REFERENCE } from "../../../data/reference/archeotechReference";
import { uiSection, uiTextBody, uiTextLabel, uiTextMuted, uiItemName, uiInfoModalWrapper } from "../../../ui/editableStyles";
import { uiActionButtonCompact } from "../../../ui/buttonStyles";
import { colourStacks } from "../../../ui/colourTokens";
import { Chip } from "../../../ui/Chip";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { StatChip } from "../weapons/weaponShared";
import { locationLabel } from "../ArmourTab/armourHelpers";
import { LOCATION_DISPLAY, CRAFTSMANSHIP_STYLE } from "../CyberneticsTab/cyberneticsConstants";
import { InfoModal } from "../../../components/InfoModal";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { CustomItemActionButtons } from "../../../ui/CustomItemActionButtons";
import { StatusBadge } from "../../../ui/StatusBadge";

interface Props {
  item: ArcheotechItem;
  editable: boolean;
  libraryItem?: CampaignCustomItem<"archeotech">;
  isDM?: boolean;
  canEditDefinition?: boolean;
  busyAction?: "publish" | "archive" | "updateAll" | null;
  onEditDefinition?: () => void;
  onPublish?: () => void;
  onArchive?: () => void;
  onUpdateAllCopies?: () => void;
  onRemove: () => void;
}

export function ItemCard({
  item,
  editable,
  libraryItem,
  isDM = false,
  canEditDefinition = false,
  busyAction = null,
  onEditDefinition,
  onPublish,
  onArchive,
  onUpdateAllCopies,
  onRemove,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const hasBody = !!(item.description?.trim() || item.notes?.trim());
  const ref = item.referenceId
    ? ARCHEOTECH_REFERENCE.find((r) => r.id === item.referenceId)
    : undefined;

  const description = item.description ?? ref?.description;
  const specialRules = ref?.specialRules;
  const weight = item.weight ?? ref?.weight;
  const value = item.value ?? ref?.value;
  const availability = item.availability ?? ref?.availability;
  const source = item.source ?? ref?.source;

  return (
    <div className={uiSection}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={uiItemName}>{item.name}</span>
            {libraryItem && (
              <StatusBadge status={libraryItem.status} />
            )}
            {item.type && (
              <Chip className={`border-slate-700 bg-slate-800/40 ${uiTextMuted}`}>
                {item.type}
              </Chip>
            )}
            {hasBody && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="text-slate-500 hover:text-slate-300 text-xs lg:text-sm transition"
              >
                {expanded ? "▲" : "▼"}
              </button>
            )}
            {description && !hasBody && (
              <span className={uiInfoModalWrapper}>
                <InfoModal title={item.name} content={description} />
              </span>
            )}
          </div>

          {/* Expanded body */}
          {expanded && (
            <div className="mt-2 space-y-1.5">
              {specialRules && (
                <p className={`text-xs lg:text-sm ${uiTextMuted}`}>
                  <span className={`${uiTextLabel} mr-1`}>
                    Special
                  </span>
                  {specialRules}
                </p>
              )}
              {description && (
                <p className={`text-xs lg:text-sm ${uiTextBody} leading-relaxed`}>{description}</p>
              )}
              {item.notes?.trim() && (
                <p className="text-xs lg:text-sm text-amber-300/70 italic leading-relaxed">{item.notes}</p>
              )}
            </div>
          )}

          {/* Type-specific stat chips */}
          {item.type === "Armour" && (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {(item.locations ?? []).length > 0 && <StatChip label="Location" value={locationLabel(item.locations!)} />}
              {item.ap !== undefined && <StatChip label="AP" value={String(item.ap)} />}
              {item.stacks && <Chip className={colourStacks}>Stacks</Chip>}
            </div>
          )}
          {item.type === "Force Field" && item.protectionRating !== undefined && (
            <div className="mt-1">
              <StatChip label="PR" value={String(item.protectionRating)} />
            </div>
          )}
          {item.type === "Shield" && (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {(item.locations ?? []).length > 0 && <StatChip label="Location" value={locationLabel(item.locations!)} />}
              {item.ap !== undefined && <StatChip label="AP" value={String(item.ap)} />}
            </div>
          )}
          {item.type === "Cybernetic" && (
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {(item.bodyLocation ?? []).length > 0 && (
                <StatChip label="Location" value={item.bodyLocation!.map((l) => LOCATION_DISPLAY[l] ?? l).join(" & ")} />
              )}
              {item.craftsmanship && (
                <>
                  <span className={uiTextLabel}>Quality</span>
                  <Chip className={`${CRAFTSMANSHIP_STYLE[item.craftsmanship as keyof typeof CRAFTSMANSHIP_STYLE]} shrink-0`}>{item.craftsmanship}</Chip>
                </>
              )}
            </div>
          )}

          {/* Chips */}
          <ItemMetaChips
            weight={weight}
            value={value}
            availability={availability}
            source={source}
            className="flex flex-wrap gap-1.5 mt-1.5"
          />
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
            onClick={onRemove}
            className={`${uiActionButtonCompact} shrink-0 mt-0.5`}
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
