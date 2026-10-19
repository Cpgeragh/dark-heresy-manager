// src/pages/CharacterSheet/weapons/ArcheotechShieldRow.tsx

import { useState, useEffect } from "react";
import type { ArcheotechItem } from "../../../types/Character";
import { ARCHEOTECH_REFERENCE } from "../../../data/reference/archeotechReference";
import { InfoModal } from "../../../components/InfoModal";
import { Chip } from "../../../ui/chips/Chip";
import {
  uiChipRow,
  uiNoticeBox,
  uiSectionShell,
  uiOverlayItemNameHover,
  uiStackSection,
} from "../../../ui/styles/editableStyles";
import { CardOverlayButton } from "../../../ui/buttons/CardOverlayButton";
import { uiCardTapHeader } from "../../../ui/styles/buttonStyles";
import { colourNoticeAmber } from "../../../ui/styles/colourTokens";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { StatChip } from "../../../ui/chips/StatChip";
import { EquipToggle } from "./weaponShared";
import { locationLabel } from "../../../utils/armourLocations";
import { RemoveEntryButton } from "../../../ui/RemoveEntryButton";
import { CharacterEntryRowContent } from "../../../ui/CharacterEntryRow";
import { EntryDetailLine } from "../../../ui/EntryDetailLine";
import { InfoParagraph } from "../../../ui/InfoSection";
import { ExpandChevron } from "../../../ui/icons/ExpandChevron";

interface Props {
  item: ArcheotechItem;
  editable: boolean;
  isEquipped: boolean;
  onToggleEquip?: () => void;
  slotsDisabled?: boolean;
  onRemove: () => void;
  highlightAsArcheotech?: boolean;
}

export function ArcheotechShieldRow({
  item,
  editable,
  isEquipped,
  onToggleEquip,
  slotsDisabled = false,
  onRemove,
  highlightAsArcheotech = true,
}: Props) {
  const [expanded, setExpanded] = useState(isEquipped);
  useEffect(() => {
    setExpanded(isEquipped);
  }, [isEquipped]);

  const locations = item.locations ?? [];
  const ref = ARCHEOTECH_REFERENCE.find((r) => r.id === item.referenceId);
  const description = item.description ?? ref?.description;
  const rules = item.rules?.trim() || ref?.rules;

  const containerClass = highlightAsArcheotech
    ? `${uiNoticeBox} ${colourNoticeAmber} overflow-hidden`
    : `${uiSectionShell} overflow-hidden`;

  return (
    <div className={containerClass}>
      <div className={`${uiCardTapHeader} relative w-full p-3 lg:p-4`}>
        <CardOverlayButton
          label={`${expanded ? "Collapse" : "Expand"} ${item.name} details`}
          expanded={expanded}
          onClick={() => setExpanded((e) => !e)}
        />
        <CharacterEntryRowContent
          interactive
          name={item.name}
          nameClassName={uiOverlayItemNameHover}
          info={
            <InfoModal
              title={item.name}
              content={description ? <InfoParagraph>{description}</InfoParagraph> : undefined}
            />
          }
          metadata={
            <div className={`${uiChipRow} items-center`}>
              {highlightAsArcheotech && (
                <Chip colour="amber" className="shrink-0">
                  Archeotech
                </Chip>
              )}
              <Chip colour="lime">Shield</Chip>
            </div>
          }
          removeAction={
            editable ? (
              <RemoveEntryButton kind="Archeotech item" name={item.name} onRemove={onRemove} />
            ) : undefined
          }
          actions={
            onToggleEquip ? (
              <EquipToggle
                equipped={isEquipped}
                disabled={slotsDisabled}
                editable={editable}
                onChange={onToggleEquip}
              />
            ) : undefined
          }
          expandControl={<ExpandChevron expanded={expanded} />}
        />
      </div>

      {expanded && (
        <div className={`px-3 pb-3 lg:px-4 lg:pb-4 ${uiStackSection}`}>
          <div className={uiChipRow}>
            {locations.length > 0 && <StatChip label="Location" value={locationLabel(locations)} />}
            {item.ap !== undefined && <StatChip label="AP" value={String(item.ap)} />}
          </div>
          <EntryDetailLine
            label="Rules"
            info={
              rules ? (
                <InfoModal
                  title={`${item.name} Rules`}
                  content={<InfoParagraph>{rules}</InfoParagraph>}
                />
              ) : undefined
            }
          />
          <ItemMetaChips
            weight={item.weight}
            value={item.value}
            availability={item.availability}
            className={uiChipRow}
          />
        </div>
      )}
    </div>
  );
}
