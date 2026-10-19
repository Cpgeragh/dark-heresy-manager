// src/pages/CharacterSheet/SkillsTab/SkillRow.tsx

import { useState, useCallback } from "react";
import type { SkillAdvanceLevel } from "../../../types/Character";
import { CHAR_FULL_LABEL, CHAR_LABEL, type SkillWithComputed } from "./skillsConstants";
import type { SkillTierAccess } from "shared-rules";
import { characteristicChipColour, sourceChipColour } from "../../../ui/styles/sourceStyles";
import { Chip } from "../../../ui/chips/Chip";
import { StatChip } from "../../../ui/chips/StatChip";
import { InfoModal } from "../../../components/InfoModal";
import { SKILL_DESCRIPTIONS } from "../../../data/reference/skillDescriptions";
import { RemoveEntryButton } from "../../../ui/RemoveEntryButton";
import { EntryDetailLine } from "../../../ui/EntryDetailLine";
import { InfoSection } from "../../../ui/InfoSection";
import { Button } from "../../../ui/buttons/Button";
import { PickerBody, PickerModal } from "../../../ui/pickers/PickerModal";
import {
  uiChipRow,
  editableInputClass,
  uiFormLabel,
  uiInfoModalWrapper,
  uiOverlayItemNameHover,
  uiOverlayPeerHoverText,
  uiSectionShell,
  uiTextBody,
  uiTextDescription,
  uiStackBody,
  uiStackField,
  uiStackList,
} from "../../../ui/styles/editableStyles";
import { CardOverlayButton } from "../../../ui/buttons/CardOverlayButton";
import { uiCardTapHeader } from "../../../ui/styles/buttonStyles";
import { colourAmberPlain, type ChipColour } from "../../../ui/styles/colourTokens";
import { sanitizeNonNegativeIntegerInput } from "../../../utils/formInput";
import { recordComponentRender } from "../../../performance/performanceMetrics";
import { CharacterEntryRow } from "../../../ui/CharacterEntryRow";
import { uiLayerLocal } from "../../../ui/styles/layerStyles";

interface SkillRowProps {
  skill: SkillWithComputed;
  editable: boolean;
  updateLevel: (id: string, level: SkillAdvanceLevel) => void | Promise<boolean | void>;
  previewMode?: boolean;
  onSelect?: (id: string) => void | Promise<boolean | void>;
  indented?: boolean;
  hideLevelChip?: boolean;
  /** Real XP cost to train this skill, shown as a chip in previewMode when known. */
  cost?: number;
  /** What buying this skill's next tier looks like right now. Owned rows only, not previewMode. */
  nextTierAccess?: SkillTierAccess;
  onManualUpgrade?: (
    id: string,
    level: SkillAdvanceLevel,
    cost: number
  ) => void | Promise<boolean | void>;
  isDM?: boolean;
}

const LEVEL_BADGE: Record<string, ChipColour> = {
  untrained: "red",
  trained: "orange",
  "+10": "sky",
  "+20": "green",
};

export function SkillRow({
  skill,
  editable,
  updateLevel,
  previewMode = false,
  onSelect,
  indented = false,
  hideLevelChip = false,
  cost,
  nextTierAccess,
  onManualUpgrade,
  isDM = false,
}: SkillRowProps) {
  recordComponentRender("SkillRow");
  const [upgradeArmed, setUpgradeArmed] = useState(false);
  const [manualUpgradeArmed, setManualUpgradeArmed] = useState(false);
  const [manualUpgradeCost, setManualUpgradeCost] = useState("");

  const levelBadgeColour = LEVEL_BADGE[skill.level];
  const talentSources = skill.talentSources ?? [];
  const talentSourceSummary = talentSources
    .map(
      (source) =>
        `${source.name} (${source.type})${
          source.detail
            ? `: ${source.detail}`
            : source.amount !== 0
              ? `: ${source.amount > 0 ? "+" : ""}${source.amount}`
              : ""
        }`
    )
    .join(" · ");
  const skillDescription = SKILL_DESCRIPTIONS[skill.name];
  const hasSkillInfo = Boolean(skillDescription) || talentSources.length > 0;
  const skillInfoContent = (
    <div className={uiStackBody}>
      {skillDescription && <p className={uiTextDescription}>{skillDescription}</p>}
      {talentSources.length > 0 && (
        <InfoSection heading="Effects">
          <ul className={`${uiStackField} ${uiTextDescription}`}>
            {talentSources.map((source, index) => (
              <li key={index}>
                {source.name} ({source.type})
                {source.detail
                  ? `: ${source.detail}`
                  : source.amount !== 0
                    ? `: ${source.amount > 0 ? "+" : ""}${source.amount}`
                    : ""}
              </li>
            ))}
          </ul>
        </InfoSection>
      )}
    </div>
  );

  const displayName = indented
    ? skill.name
        .slice(skill.category.length)
        .trim()
        .replace(/^\(|\)$/g, "")
        .trim() || skill.name
    : skill.name;

  const handleRemove = useCallback(
    () => updateLevel(skill.id, "untrained"),
    [skill.id, updateLevel]
  );

  const purchasedLevel = skill.baseLevel ?? skill.level;
  const eliteAdvancePurchase =
    purchasedLevel === "untrained" ? undefined : skill.eliteAdvancePurchases?.[purchasedLevel];
  const downgradeLevel: SkillAdvanceLevel | undefined =
    purchasedLevel === "+20" ? "+10" : purchasedLevel === "+10" ? "trained" : undefined;
  const downgradeLabel = downgradeLevel === "trained" ? "Trained" : downgradeLevel;
  const handleDowngrade = useCallback(
    () => (downgradeLevel ? updateLevel(skill.id, downgradeLevel) : undefined),
    [downgradeLevel, skill.id, updateLevel]
  );

  const manualUpgradeCostNumber = Number(manualUpgradeCost);
  const canConfirmManualUpgrade = manualUpgradeCost.trim() !== "";
  const canDelete =
    editable &&
    skill.level !== "untrained" &&
    !(skill.talentMinimumLevel && skill.baseLevel === "untrained");
  const hasCareerUpgrade = editable && nextTierAccess?.status === "unlocked";
  const hasManualUpgrade = editable && isDM && nextTierAccess?.status === "not-on-career";
  const hasUpgrade = hasCareerUpgrade || hasManualUpgrade;
  const levelLabel =
    skill.level === "trained" ? "Trained" : skill.level === "untrained" ? "Untrained" : skill.level;
  const total = skill.total ?? "—";
  const characteristicName = CHAR_FULL_LABEL[skill.characteristic].replace(/\s+\([^)]+\)$/, "");

  const pickerInformation = hasSkillInfo ? (
    <InfoModal title={skill.name} content={skillInfoContent} as="span" />
  ) : undefined;

  const pickerMetadata = (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
      <div className={`${uiChipRow} items-center`}>
        {skill.source && (
          <Chip colour={sourceChipColour(skill.source)} className="font-code shrink-0">
            {skill.source}
          </Chip>
        )}
        {cost !== undefined && (
          <Chip colour="amber" className="font-code shrink-0">
            {cost} XP
          </Chip>
        )}
        <Chip
          colour={characteristicChipColour(skill.characteristic)}
          className="font-code shrink-0"
        >
          {CHAR_LABEL[skill.characteristic]}
        </Chip>
        <Chip colour={skill.advanced ? "purple" : "teal"} className="shrink-0">
          {skill.advanced ? "Advanced" : "Basic"}
        </Chip>
        {!hideLevelChip && (
          <Chip colour={levelBadgeColour} className="shrink-0">
            {levelLabel}
          </Chip>
        )}
      </div>
      <StatChip label="Total" value={total} />
    </div>
  );
  const pickerSecondaryInformation = (
    <>
      {eliteAdvancePurchase && (
        <p className={`text-sm ${colourAmberPlain}`}>
          Gained from: {eliteAdvancePurchase.sourceName} (Elite Advance)
        </p>
      )}
      {talentSourceSummary && (
        <p className={`text-xs leading-snug ${colourAmberPlain}`}>{talentSourceSummary}</p>
      )}
    </>
  );

  return (
    <>
      {previewMode ? (
        <div className={uiSectionShell + " overflow-hidden"}>
          <div
            className={`relative w-full p-3 text-left lg:p-4 ${onSelect ? uiCardTapHeader : ""}`}
          >
            {onSelect && (
              <CardOverlayButton
                label={`Select ${skill.name}`}
                onClick={() => onSelect(skill.id)}
              />
            )}
            <div
              className={`relative ${uiLayerLocal} pointer-events-none lg:hidden ${uiStackList} ${uiOverlayPeerHoverText}`}
            >
              <div className="flex min-w-0 items-center gap-1.5">
                <span className={`${uiOverlayItemNameHover} break-words`}>{displayName}</span>
                {pickerInformation && (
                  <span className={`${uiInfoModalWrapper} pointer-events-auto`}>
                    {pickerInformation}
                  </span>
                )}
              </div>
              {pickerMetadata}
              {pickerSecondaryInformation}
            </div>
            <div
              className={`relative ${uiLayerLocal} pointer-events-none hidden lg:block ${uiStackList} ${uiOverlayPeerHoverText}`}
            >
              <div className="flex min-w-0 items-center gap-1.5">
                <span className={`${uiOverlayItemNameHover} truncate`}>{displayName}</span>
                {pickerInformation && (
                  <span className={`${uiInfoModalWrapper} pointer-events-auto`}>
                    {pickerInformation}
                  </span>
                )}
              </div>
              {pickerMetadata}
              {pickerSecondaryInformation}
            </div>
          </div>
        </div>
      ) : (
        <CharacterEntryRow
          name={displayName}
          info={
            <InfoModal
              title={skill.name}
              content={hasSkillInfo ? skillInfoContent : undefined}
              as="span"
            />
          }
          metadata={
            <div className={`${uiChipRow} items-center`}>
              <Chip
                colour={characteristicChipColour(skill.characteristic)}
                className="font-code shrink-0"
                aria-label={`${characteristicName} ${total}`}
              >
                {CHAR_LABEL[skill.characteristic]} {total}
              </Chip>
              <Chip colour={skill.advanced ? "purple" : "teal"} className="shrink-0">
                {skill.advanced ? "Advanced" : "Basic"}
              </Chip>
              {!hideLevelChip && (
                <Chip colour={levelBadgeColour} className="shrink-0">
                  {levelLabel}
                </Chip>
              )}
            </div>
          }
          afterMetadata={
            <>
              {eliteAdvancePurchase && (
                <EntryDetailLine
                  label="Gained from"
                  value={`${eliteAdvancePurchase.sourceName} (Elite Advance)`}
                />
              )}
              {talentSourceSummary && (
                <p className={`text-xs leading-snug ${colourAmberPlain}`}>{talentSourceSummary}</p>
              )}
            </>
          }
          actions={
            hasUpgrade ? (
              <>
                {hasCareerUpgrade && nextTierAccess?.status === "unlocked" && (
                  <Button size="xs" onClick={() => setUpgradeArmed(true)}>
                    Upgrade to {nextTierAccess.level}
                  </Button>
                )}
                {hasManualUpgrade && nextTierAccess?.status === "not-on-career" && (
                  <Button size="xs" onClick={() => setManualUpgradeArmed(true)}>
                    Upgrade to {nextTierAccess.level}
                  </Button>
                )}
              </>
            ) : undefined
          }
          removeAction={
            canDelete ? (
              <RemoveEntryButton
                kind="Skill"
                name={skill.name}
                onRemove={handleRemove}
                extra={
                  downgradeLevel
                    ? {
                        label: `Downgrade to ${downgradeLabel}`,
                        message: `Downgrade ${skill.name} to ${downgradeLabel}, or remove it from this character?`,
                        onClick: handleDowngrade,
                      }
                    : undefined
                }
              />
            ) : undefined
          }
        />
      )}

      {upgradeArmed && nextTierAccess?.status === "unlocked" && (
        <PickerModal
          title="Upgrade Skill"
          query=""
          onQueryChange={() => undefined}
          onClose={() => setUpgradeArmed(false)}
          isEmpty={false}
          hideSearch
          maxWidth="max-w-sm"
          footer={
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="primary"
                onClick={async () => {
                  const saved = await updateLevel(skill.id, nextTierAccess.level);
                  if (saved !== false) setUpgradeArmed(false);
                }}
              >
                Upgrade
              </Button>
              <Button variant="neutral" onClick={() => setUpgradeArmed(false)}>
                Cancel
              </Button>
            </div>
          }
        >
          <PickerBody>
            <p className={`text-sm lg:text-base ${uiTextBody} text-center`}>
              Upgrade {skill.name} to {nextTierAccess.level} for {nextTierAccess.cost} XP?
            </p>
          </PickerBody>
        </PickerModal>
      )}

      {isDM && manualUpgradeArmed && nextTierAccess?.status === "not-on-career" && (
        <PickerModal
          title="Upgrade Skill"
          query=""
          onQueryChange={() => undefined}
          onClose={() => setManualUpgradeArmed(false)}
          isEmpty={false}
          hideSearch
          maxWidth="max-w-sm"
          footer={
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="primary"
                disabled={!canConfirmManualUpgrade}
                onClick={async () => {
                  const saved = await onManualUpgrade?.(
                    skill.id,
                    nextTierAccess.level,
                    manualUpgradeCostNumber
                  );
                  if (saved !== false) {
                    setManualUpgradeArmed(false);
                    setManualUpgradeCost("");
                  }
                }}
              >
                Upgrade
              </Button>
              <Button variant="neutral" onClick={() => setManualUpgradeArmed(false)}>
                Cancel
              </Button>
            </div>
          }
        >
          <PickerBody>
            <label className={uiFormLabel}>
              XP Cost to upgrade {skill.name} to {nextTierAccess.level}
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={manualUpgradeCost}
              onChange={(event) =>
                setManualUpgradeCost(sanitizeNonNegativeIntegerInput(event.target.value))
              }
              placeholder="0"
              className={editableInputClass(true) + " mt-0.5"}
              autoComplete="off"
            />
          </PickerBody>
        </PickerModal>
      )}
    </>
  );
}
