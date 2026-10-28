// src/pages/CharacterSheet/SkillsTab/SkillRow.tsx

import { useState, useCallback } from "react";
import type { SkillAdvanceLevel } from "../../../types/Character";
import { CHAR_FULL_LABEL, CHAR_LABEL, type SkillWithComputed } from "./skillsConstants";
import type { SkillTierAccess } from "shared-rules";
import { characteristicChipColour } from "../../../ui/styles/sourceStyles";
import { Chip } from "../../../ui/chips/Chip";
import { Button } from "../../../ui/buttons/Button";
import { PickerBody, PickerModal } from "../../../ui/pickers/PickerModal";
import { uiTextBody } from "../../../ui/styles/editableStyles";
import { sanitizeNonNegativeIntegerInput } from "../../../utils/formInput";
import { recordComponentRender } from "../../../performance/performanceMetrics";
import { OwnedEntryRow } from "../../../ui/OwnedEntryRow";
import { EntryActionButton } from "../../../ui/buttons/EntryActionButton";
import {
  LEVEL_BADGE,
  getSkillInfoContent,
  getTalentSourceSummary,
  skillLevelLabel,
} from "./skillRowShared";
import { XpCostForm } from "../../../ui/forms/XpCostForm";

interface SkillRowProps {
  skill: SkillWithComputed;
  editable: boolean;
  updateLevel: (id: string, level: SkillAdvanceLevel) => void | Promise<boolean | void>;
  /** What buying this skill's next tier looks like right now. */
  nextTierAccess?: SkillTierAccess;
  onManualUpgrade?: (
    id: string,
    level: SkillAdvanceLevel,
    cost: number
  ) => void | Promise<boolean | void>;
  isDM?: boolean;
}

export function SkillRow({
  skill,
  editable,
  updateLevel,
  nextTierAccess,
  onManualUpgrade,
  isDM = false,
}: SkillRowProps) {
  recordComponentRender("SkillRow");
  const [upgradeArmed, setUpgradeArmed] = useState(false);
  const [manualUpgradeArmed, setManualUpgradeArmed] = useState(false);
  const [manualUpgradeCost, setManualUpgradeCost] = useState("");

  const levelBadgeColour = LEVEL_BADGE[skill.level];
  const talentSourceSummary = getTalentSourceSummary(skill);
  const skillInfoContent = getSkillInfoContent(skill);

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
  const canRemove =
    editable &&
    skill.level !== "untrained" &&
    !(skill.talentMinimumLevel && skill.baseLevel === "untrained");
  const hasCareerUpgrade = editable && nextTierAccess?.status === "unlocked";
  const hasManualUpgrade = editable && isDM && nextTierAccess?.status === "not-on-career";
  const hasUpgrade = hasCareerUpgrade || hasManualUpgrade;
  const levelLabel = skillLevelLabel(skill.level);
  const total = skill.total ?? "—";
  const characteristicName = CHAR_FULL_LABEL[skill.characteristic].replace(/\s+\([^)]+\)$/, "");

  return (
    <>
      <OwnedEntryRow
        name={skill.name}
        editable={editable}
        information={skillInfoContent}
        informationAs="span"
        chips={
          <>
            <Chip
              colour={characteristicChipColour(skill.characteristic)}
              className="font-code"
              aria-label={`${characteristicName} ${total}`}
            >
              {CHAR_LABEL[skill.characteristic]} {total}
            </Chip>
            <Chip colour={skill.advanced ? "purple" : "teal"}>
              {skill.advanced ? "Advanced" : "Basic"}
            </Chip>
            <Chip colour={levelBadgeColour}>{levelLabel}</Chip>
          </>
        }
        lines={{
          gainedFrom: eliteAdvancePurchase
            ? `${eliteAdvancePurchase.sourceName} (Elite Advance)`
            : undefined,
          talentEffects: talentSourceSummary || undefined,
        }}
        actions={
          hasUpgrade ? (
            <>
              {hasCareerUpgrade && nextTierAccess?.status === "unlocked" && (
                <EntryActionButton onClick={() => setUpgradeArmed(true)}>
                  Upgrade to {nextTierAccess.level}
                </EntryActionButton>
              )}
              {hasManualUpgrade && nextTierAccess?.status === "not-on-career" && (
                <EntryActionButton onClick={() => setManualUpgradeArmed(true)}>
                  Upgrade to {nextTierAccess.level}
                </EntryActionButton>
              )}
            </>
          ) : undefined
        }
        removal={{
          kind: "Skill",
          onRemove: handleRemove,
          hidden: !canRemove,
          extra: downgradeLevel
            ? {
                label: `Downgrade to ${downgradeLabel}`,
                message: `Downgrade ${skill.name} to ${downgradeLabel}, or remove it from this character?`,
                onClick: handleDowngrade,
              }
            : undefined,
        }}
      />

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
        <XpCostForm
          title={`Upgrade ${skill.name} to ${nextTierAccess.level}`}
          submitLabel="Upgrade"
          cost={manualUpgradeCost}
          onCostChange={(value) => setManualUpgradeCost(sanitizeNonNegativeIntegerInput(value))}
          canSubmit={canConfirmManualUpgrade}
          onClose={() => setManualUpgradeArmed(false)}
          onSubmit={async () => {
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
        />
      )}
    </>
  );
}
