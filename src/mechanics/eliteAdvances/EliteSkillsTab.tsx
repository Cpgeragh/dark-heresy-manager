import { useMemo, useState } from "react";
import { DEFAULT_SKILLS } from "../../data/reference/defaultSkills";
import { SKILL_DESCRIPTIONS } from "../../data/reference/skillDescriptions";
import { useSkillComputation } from "../../hooks/useSkillComputation";
import type { CharacteristicTotals } from "../corruption/characteristicModifierTotals";
import { SectionHeader } from "../../ui/SectionHeader";
import { AddButton } from "../../ui/buttons/AddButton";
import { ViewButton } from "../../ui/buttons/ViewButton";
import { Chip } from "../../ui/chips/Chip";
import { XpCostForm } from "../../ui/forms/XpCostForm";
import { PickerList, PickerRow } from "../../ui/pickers/PickerModal";
import { PickerRowChips, PickerRowLine, PickerRowName } from "../../ui/pickers/PickerRowParts";
import {
  uiSection,
  uiSplitRow,
  uiStackList,
  uiTextPlaceholder,
} from "../../ui/styles/editableStyles";
import { sourceChipColour } from "../../ui/styles/sourceStyles";
import { sanitizeNonNegativeIntegerInput } from "../../utils/formInput";
import { buildSkillCatalogue } from "../../utils/skillUtils";
import type {
  Character,
  CharField,
  Characteristics,
  EliteAdvancePurchase,
  ExperienceBlock,
  SkillEntry,
  TalentsAndTraitsBlock,
  WeaponTrainingBlock,
} from "../../types/Character";
import {
  createShownSkillLevels,
  getMissedRankEliteAdvanceOptions,
  getPackageEliteAdvanceOptions,
} from "./eliteAdvanceAccess";
import {
  buildSkillPurchase,
  nextSkillLevel,
  optionPurchase,
  type PurchasedSkillLevel,
} from "./eliteAdvancePurchase";
import { getEliteSkillPurchases } from "./eliteAdvancePurchases";
import { buildEliteSkillTierRemoval } from "./eliteAdvanceRemoval";
import { skillLevelName } from "./eliteAdvanceWarnings";
import { EliteSkillCard } from "./EliteSkillCard";
import { EliteUnlockedAllPicker, type EliteListTab } from "./EliteUnlockedAllPicker";

interface EliteSkillsTabProps {
  skills: SkillEntry[];
  talents: TalentsAndTraitsBlock;
  experience: ExperienceBlock;
  weaponTraining?: WeaponTrainingBlock;
  career?: string;
  rank?: string;
  isDM?: boolean;
  editable: boolean;
  getCharField: (statKey: keyof Characteristics) => CharField;
  modifierTotals?: CharacteristicTotals;
  onUpdateCharacter: (partial: Partial<Character>) => Promise<boolean>;
}

const EMPTY_WEAPON_TRAINING: WeaponTrainingBlock = { trained: [], exoticWeapons: [] };

interface PendingManualSkill {
  skillId: string;
  name: string;
  level: PurchasedSkillLevel;
}

export function EliteSkillsTab({
  skills,
  talents,
  experience,
  weaponTraining = EMPTY_WEAPON_TRAINING,
  career,
  rank,
  isDM = false,
  editable,
  getCharField,
  modifierTotals = {},
  onUpdateCharacter,
}: EliteSkillsTabProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [pendingManual, setPendingManual] = useState<PendingManualSkill | null>(null);
  const [manualCost, setManualCost] = useState("");
  const catalogue = useMemo(() => buildSkillCatalogue(skills), [skills]);
  const computedSkills = useSkillComputation({
    skills: catalogue,
    getCharField,
    modifierTotals,
    talents,
    career,
  });
  const purchases = getEliteSkillPurchases(skills);
  const missed = getMissedRankEliteAdvanceOptions({ career, rank, experience, skills, talents });
  const packageOptions = getPackageEliteAdvanceOptions({
    talents,
    skills,
    weaponTraining,
    career,
    rank,
    alternateRanks: experience.alternateRanks,
  });
  const unlockedOptions = [...missed.skills, ...packageOptions.skills];
  const shownLevel = createShownSkillLevels(skills, talents, career);

  const closePicker = () => {
    setShowPicker(false);
    setPendingManual(null);
    setManualCost("");
  };

  const buy = (
    skillId: string,
    level: PurchasedSkillLevel,
    cost: number,
    purchase: EliteAdvancePurchase
  ) => {
    const next = buildSkillPurchase({ skills, skillId, level, cost, purchase, career, rank });
    if (!next) return undefined;
    return onUpdateCharacter({ skills: next });
  };

  const renderTab = (tab: EliteListTab, query: string) => {
    const needle = query.trim().toLocaleLowerCase();
    const matches = (name: string) => name.toLocaleLowerCase().includes(needle);

    if (tab === "unlocked") {
      const rows = unlockedOptions
        .flatMap((option) => {
          const skill = DEFAULT_SKILLS.find((entry) => entry.id === option.skillId);
          return skill && matches(skill.name) ? [{ option, skill }] : [];
        })
        .sort((left, right) => left.skill.name.localeCompare(right.skill.name, "en-GB"));
      return {
        isEmpty: rows.length === 0,
        rows: (
          <PickerList>
            {rows.map(({ option, skill }) => (
              <PickerRow
                key={option.key}
                interactive={editable}
                onClick={() =>
                  editable
                    ? buy(skill.id, option.level, option.cost, optionPurchase(option, career))
                    : undefined
                }
              >
                <PickerRowName
                  name={skill.name}
                  infoTitle={skill.name}
                  information={SKILL_DESCRIPTIONS[skill.name]}
                />
                <PickerRowChips>
                  <Chip colour={sourceChipColour(skill.source)} className="font-code">
                    {skill.source}
                  </Chip>
                  <Chip colour="sky">{skillLevelName(option.level)}</Chip>
                  <Chip colour="amber">{option.cost} XP</Chip>
                </PickerRowChips>
                {option.eliteAdvanceId && (
                  <PickerRowLine
                    label="Unlocked by"
                    value={option.eliteAdvanceName ?? option.eliteAdvanceId}
                  />
                )}
                {option.prerequisites && (
                  <PickerRowLine label="Prerequisites" value={option.prerequisites} />
                )}
              </PickerRow>
            ))}
          </PickerList>
        ),
      };
    }

    const unlockedKeys = new Set(
      unlockedOptions.map((option) => `${option.skillId}:${option.level}`)
    );
    const rows = DEFAULT_SKILLS.flatMap((skill) => {
      const level = nextSkillLevel(shownLevel(skill.id));
      if (!level || unlockedKeys.has(`${skill.id}:${level}`) || !matches(skill.name)) return [];
      return [{ skill, level }];
    }).sort((left, right) => left.skill.name.localeCompare(right.skill.name, "en-GB"));
    const canAdd = editable && isDM;
    return {
      isEmpty: rows.length === 0,
      rows: (
        <PickerList>
          {rows.map(({ skill, level }) => (
            <PickerRow
              key={`${skill.id}:${level}`}
              interactive={canAdd}
              onClick={() => {
                if (!canAdd) return;
                setPendingManual({ skillId: skill.id, name: skill.name, level });
                setManualCost("");
              }}
            >
              <PickerRowName
                name={skill.name}
                infoTitle={skill.name}
                information={SKILL_DESCRIPTIONS[skill.name]}
              />
              <PickerRowChips>
                <Chip colour={sourceChipColour(skill.source)} className="font-code">
                  {skill.source}
                </Chip>
                <Chip colour="sky">{skillLevelName(level)}</Chip>
              </PickerRowChips>
            </PickerRow>
          ))}
        </PickerList>
      ),
    };
  };

  return (
    <div>
      <div className={`${uiSplitRow} mb-3`}>
        <SectionHeader>Elite Skills</SectionHeader>
        {editable ? (
          <AddButton label="Add Elite Skill" onClick={() => setShowPicker(true)} />
        ) : (
          <ViewButton label="View Elite Skills" onClick={() => setShowPicker(true)} />
        )}
      </div>
      <section className={`${uiSection} ${uiStackList}`}>
        {purchases.length === 0 && (
          <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>No Elite skills purchased.</p>
        )}
        <div className={uiStackList}>
          {purchases.map(({ skillId, tier, purchase }) => {
            const skill = computedSkills.find((entry) => entry.id === skillId);
            if (!skill) return null;
            const removal = buildEliteSkillTierRemoval({
              skills,
              skillId,
              tier,
              talents,
              career,
            });
            return (
              <EliteSkillCard
                key={`${skillId}:${tier}`}
                skill={skill}
                tier={tier}
                purchase={purchase}
                editable={editable}
                blockedMessage={removal.ok ? undefined : removal.warning.message}
                onRemove={() => (removal.ok ? onUpdateCharacter(removal.update) : false)}
              />
            );
          })}
        </div>
      </section>

      {showPicker && (
        <EliteUnlockedAllPicker
          title={editable ? "Add Elite Skill" : "View Elite Skills"}
          onClose={closePicker}
          renderTab={renderTab}
          emptyMessage="No Elite skills available."
          suspended={pendingManual !== null}
        />
      )}
      {showPicker && pendingManual && (
        <XpCostForm
          title={`Buy ${pendingManual.name}`}
          submitLabel={`Buy ${pendingManual.name}`}
          cost={manualCost}
          onCostChange={(value) => setManualCost(sanitizeNonNegativeIntegerInput(value))}
          onClose={() => setPendingManual(null)}
          onSubmit={async () => {
            const cost = Number(manualCost);
            const saved = await buy(pendingManual.skillId, pendingManual.level, cost, {
              source: "gm-approved",
              cost,
              sourceName: "GM-approved Skill",
            });
            if (saved === false) return;
            setPendingManual(null);
            setManualCost("");
          }}
        />
      )}
    </div>
  );
}
