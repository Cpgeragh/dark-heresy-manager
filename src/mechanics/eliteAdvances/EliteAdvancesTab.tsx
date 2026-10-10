import { useMemo, useState } from "react";
import { InfoModal } from "../../components/InfoModal";
import {
  ALTERNATE_RANKS,
  ELITE_ADVANCES,
  findCareerByName,
  makeCurrentRankPurchase,
  TALENT_LIST,
  type EliteAdvanceData,
  type TalentData,
} from "shared-rules";
import { DEFAULT_SKILLS } from "../../data/reference/defaultSkills";
import { TALENT_DESCRIPTIONS } from "../../data/reference/talentDescriptions";
import { TRAIT_LIST } from "../../data/reference/traitData";
import type {
  ArcheotechItem,
  Character,
  CyberneticItem,
  EliteAdvanceEntry,
  EliteAdvancePurchase,
  ExperienceBlock,
  InsanityBlock,
  MeleeWeapon,
  PsychicBlock,
  RangedWeapon,
  SkillAdvanceLevel,
  SkillEntry,
  TalentEntry,
  TalentsAndTraitsBlock,
  WeaponTrainingBlock,
} from "../../types/Character";
import { SectionHeader } from "../../ui/SectionHeader";
import { AddButton } from "../../ui/buttons/AddButton";
import { ViewButton } from "../../ui/buttons/ViewButton";
import { Button } from "../../ui/buttons/Button";
import { Chip } from "../../ui/chips/Chip";
import { ArrowLeft, ArrowRight } from "../../ui/icons/PickerArrows";
import { FilterButton } from "../../ui/pickers/FilterButton";
import { PickerBody, PickerList, PickerModal, PickerRow } from "../../ui/pickers/PickerModal";
import { PickerRowChips, PickerRowName, PickerRowText } from "../../ui/pickers/PickerRowParts";
import {
  editableInputClass,
  uiFormLabel,
  uiSection,
  uiTextBody,
  uiTextLabel,
  uiTextPlaceholder,
} from "../../ui/styles/editableStyles";
import { sourceChipColour } from "../../ui/styles/sourceStyles";
import { sanitizeNonNegativeIntegerInput } from "../../utils/formInput";
import { EntryCard } from "../talents/TalentEntryCards";
import { TalentPickerModal } from "../talents/TalentPickerModal";
import { makeTalentEntry } from "../talents/talentUtils";
import { useTalentAcquisitionFlow } from "../talents/useTalentAcquisitionFlow";
import {
  getAvailableNamedEliteAdvances,
  getMissedRankEliteAdvanceOptions,
  getPackageEliteAdvanceOptions,
  type MissedRankSkillOption,
  type MissedRankTalentOption,
} from "./eliteAdvanceAccess";

interface EliteAdvancesTabProps {
  talents: TalentsAndTraitsBlock;
  skills: SkillEntry[];
  experience: ExperienceBlock;
  insanity: InsanityBlock;
  psychic?: PsychicBlock;
  cybernetics?: CyberneticItem[];
  rangedWeapons?: RangedWeapon[];
  meleeWeapons?: MeleeWeapon[];
  archeotech?: ArcheotechItem[];
  willpowerBonus?: number;
  weaponTraining?: WeaponTrainingBlock;
  career?: string;
  rank?: string;
  isDM?: boolean;
  editable: boolean;
  onUpdateCharacter: (partial: Partial<Character>) => Promise<boolean>;
}

type PickerKind = "choose" | "special" | "skill" | "talent";
type PurchasedSkillLevel = Exclude<SkillAdvanceLevel, "untrained">;

const EMPTY_PSYCHIC: PsychicBlock = { psyRating: 0, minorPowers: [], majorPowers: [] };
const EMPTY_WEAPON_TRAINING: WeaponTrainingBlock = { trained: [], exoticWeapons: [] };

function getSkillName(skillId: string): string {
  return DEFAULT_SKILLS.find((skill) => skill.id === skillId)?.name ?? skillId;
}

function getTalentName(talentId: string): string {
  return TALENT_LIST.find((talent) => talent.id === talentId)?.name ?? talentId;
}

function getTraitName(traitId: string): string {
  return TRAIT_LIST.find((trait) => trait.id === traitId)?.name ?? traitId;
}

function getUnlockedAdvanceName(
  advance: NonNullable<EliteAdvanceData["unlockedAdvances"]>[number]
): string {
  if (advance.kind === "skill" && advance.skillId) {
    const name = getSkillName(advance.skillId);
    return advance.level && advance.level !== "trained" ? `${name} ${advance.level}` : name;
  }
  if (advance.kind === "talent" && advance.talentId) {
    const name = getTalentName(advance.talentId);
    return advance.specialisation ? `${name} (${advance.specialisation})` : name;
  }
  return "Unknown Advance";
}

function getAlternateRankNames(advance: EliteAdvanceData): string[] {
  return (advance.alternateRankIds ?? []).map(
    (rankId) => ALTERNATE_RANKS.find((rank) => rank.id === rankId)?.name ?? rankId
  );
}

function nextSkillLevel(level: SkillAdvanceLevel): PurchasedSkillLevel | undefined {
  if (level === "untrained") return "trained";
  if (level === "trained") return "+10";
  if (level === "+10") return "+20";
  return undefined;
}

function EliteAdvanceDetails({ advance }: { advance: EliteAdvanceData }) {
  return (
    <div className={`space-y-4 ${uiTextBody}`}>
      <p>{advance.description}</p>
      {advance.downtime && (
        <p>
          <span className={uiTextLabel}>Downtime: </span>
          {advance.downtime}
        </p>
      )}
      {advance.grantedSkills && advance.grantedSkills.length > 0 && (
        <div>
          <p className={uiTextLabel}>Granted skills</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {advance.grantedSkills.map((skill) => (
              <li key={`${skill.skillId}-${skill.level}`}>{getSkillName(skill.skillId)}</li>
            ))}
          </ul>
        </div>
      )}
      {advance.grantedTalents && advance.grantedTalents.length > 0 && (
        <div>
          <p className={uiTextLabel}>Granted talents</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {advance.grantedTalents.map((talentId) => (
              <li key={talentId}>{getTalentName(talentId)}</li>
            ))}
          </ul>
        </div>
      )}
      {advance.grantedTraits && advance.grantedTraits.length > 0 && (
        <div>
          <p className={uiTextLabel}>Granted traits</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {advance.grantedTraits.map((traitId) => (
              <li key={traitId}>{getTraitName(traitId)}</li>
            ))}
          </ul>
        </div>
      )}
      {(advance.grantedMinorPsychicPowers ?? 0) > 0 && (
        <div>
          <p className={uiTextLabel}>Granted psychic powers</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>
              {advance.grantedMinorPsychicPowers} random permanent Minor Psychic Power
              {advance.grantedMinorPsychicPowers === 1 ? "" : "s"}
            </li>
          </ul>
        </div>
      )}
      {advance.unlockedAdvances && advance.unlockedAdvances.length > 0 && (
        <div>
          <p className={uiTextLabel}>Unlocked advances</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {advance.unlockedAdvances.map((unlocked, index) => (
              <li key={`${unlocked.kind}-${unlocked.skillId ?? unlocked.talentId}-${index}`}>
                {getUnlockedAdvanceName(unlocked)} — {unlocked.cost} XP
                {unlocked.prerequisites ? `; prerequisite: ${unlocked.prerequisites}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
      {advance.consequences && advance.consequences.length > 0 && (
        <div>
          <p className={uiTextLabel}>Consequences</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {advance.consequences.map((consequence) => (
              <li key={consequence}>{consequence}</li>
            ))}
          </ul>
        </div>
      )}
      {advance.effects && advance.effects.length > 0 && (
        <div>
          <p className={uiTextLabel}>Effects</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {advance.effects.map((effect) => (
              <li key={effect}>{effect}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function PickerChoice({
  label,
  description,
  onClick,
}: {
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <PickerRow trailing={<ArrowRight />} onClick={onClick}>
      <PickerRowName name={label} />
      <PickerRowText>{description}</PickerRowText>
    </PickerRow>
  );
}

function EliteAdvanceKindPicker({
  editable,
  onChoose,
  onClose,
}: {
  editable: boolean;
  onChoose: (kind: Exclude<PickerKind, "choose">) => void;
  onClose: () => void;
}) {
  return (
    <PickerModal
      title={editable ? "Add Elite Advance" : "View Elite Advances"}
      query=""
      onQueryChange={() => undefined}
      onClose={onClose}
      isEmpty={false}
      hideSearch
    >
      <PickerList>
        <PickerChoice
          label="Special"
          description="Packaged Elite Advances such as Encarta Maleficarum."
          onClick={() => onChoose("special")}
        />
        <PickerChoice
          label="Skills"
          description="Skills made available as Elite Advances."
          onClick={() => onChoose("skill")}
        />
        <PickerChoice
          label="Talents"
          description="Talents, including Faith Talents, made available as Elite Advances."
          onClick={() => onChoose("talent")}
        />
      </PickerList>
    </PickerModal>
  );
}

function SpecialAdvancePicker({
  advances,
  owned,
  editable,
  isDM,
  onSelect,
  onBack,
}: {
  advances: readonly EliteAdvanceData[];
  owned: readonly EliteAdvanceEntry[];
  editable: boolean;
  isDM: boolean;
  onSelect: (advance: EliteAdvanceData) => void;
  onBack: () => void;
}) {
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const ownedIds = new Set(owned.map((entry) => entry.eliteAdvanceId));
  const filtered = [...(showAll ? ELITE_ADVANCES : advances)]
    .filter((advance) => !advance.automaticGrantOnly)
    .filter((advance) => !editable || !ownedIds.has(advance.id))
    .filter((advance) =>
      advance.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
    )
    .sort((left, right) => left.name.localeCompare(right.name, "en-GB"));
  const canAdd = editable && (!showAll || isDM);

  return (
    <PickerModal
      title={editable ? "Add Special Elite Advance" : "View Special Elite Advances"}
      query={query}
      onQueryChange={setQuery}
      onClose={showAll ? () => setShowAll(false) : onBack}
      closeLabel={<ArrowLeft />}
      closeAriaLabel="Back"
      isEmpty={filtered.length === 0}
      emptyMessage="No Special Elite Advances available."
      filterRow={
        !showAll && (
          <FilterButton className="w-full" onClick={() => setShowAll(true)}>
            Show all
          </FilterButton>
        )
      }
    >
      <PickerList>
        {filtered.map((advance) => {
          const alternateRankNames = getAlternateRankNames(advance);
          return (
            <PickerRow
              key={advance.id}
              interactive={canAdd}
              onClick={() => canAdd && onSelect(advance)}
            >
              <PickerRowName
                name={advance.name}
                info={
                  <InfoModal
                    title={advance.name}
                    content={<EliteAdvanceDetails advance={advance} />}
                    as="span"
                  />
                }
              />
              <PickerRowChips>
                <Chip colour={sourceChipColour(advance.source)} className="font-code">
                  {advance.source}
                </Chip>
                <Chip colour="amber">
                  {advance.cost} XP
                </Chip>
              </PickerRowChips>
              {advance.prerequisites && (
                <PickerRowText>
                  <span className={uiTextLabel}>Prerequisites: </span>
                  {advance.prerequisites}
                </PickerRowText>
              )}
              {alternateRankNames.length > 0 && (
                <PickerRowText>
                  <span className={uiTextLabel}>Available through: </span>
                  {alternateRankNames.join(", ")}
                </PickerRowText>
              )}
            </PickerRow>
          );
        })}
      </PickerList>
    </PickerModal>
  );
}

function SpecialAdvancePurchaseModal({
  advance,
  onBuy,
  onBack,
}: {
  advance: EliteAdvanceData;
  onBuy: (rolls: {
    insanityGained?: number;
    characteristicReductions?: Partial<Record<"t" | "fel", number>>;
  }) => void;
  onBack: () => void;
}) {
  const [insanity, setInsanity] = useState("");
  const [toughness, setToughness] = useState("");
  const [fellowship, setFellowship] = useState("");
  const needsInsanity = advance.insanityGain === "1d5";
  const needsToughness = Boolean(
    advance.characteristicReductions?.some((entry) => entry.characteristic === "t")
  );
  const needsFellowship = Boolean(
    advance.characteristicReductions?.some((entry) => entry.characteristic === "fel")
  );
  const validRoll = (value: string, required: boolean) =>
    !required || (Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 5);
  const canBuy =
    validRoll(insanity, needsInsanity) &&
    validRoll(toughness, needsToughness) &&
    validRoll(fellowship, needsFellowship);

  const rollInput = (label: string, value: string, setValue: (next: string) => void) => (
    <label className="block">
      <span className={uiFormLabel}>{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={5}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="1–5"
        className={`${editableInputClass(true)} mt-1`}
        autoComplete="off"
      />
    </label>
  );

  return (
    <PickerModal
      title={`Buy ${advance.name}`}
      query=""
      onQueryChange={() => undefined}
      onClose={onBack}
      closeLabel={<ArrowLeft />}
      closeAriaLabel="Back"
      isEmpty={false}
      hideSearch
      footer={
        <Button
          fullWidth
          disabled={!canBuy}
          onClick={() =>
            onBuy({
              ...(needsInsanity ? { insanityGained: Number(insanity) } : {}),
              ...(needsToughness || needsFellowship
                ? {
                    characteristicReductions: {
                      ...(needsToughness ? { t: Number(toughness) } : {}),
                      ...(needsFellowship ? { fel: Number(fellowship) } : {}),
                    },
                  }
                : {}),
            })
          }
        >
          Buy for {advance.cost} XP
        </Button>
      }
    >
      <PickerBody>
        <EliteAdvanceDetails advance={advance} />
        {needsInsanity && rollInput("Insanity gained (1d5)", insanity, setInsanity)}
        {needsToughness &&
          rollInput("Permanent Toughness reduction (1d5)", toughness, setToughness)}
        {needsFellowship &&
          rollInput("Permanent Fellowship reduction (1d5)", fellowship, setFellowship)}
      </PickerBody>
    </PickerModal>
  );
}

function SkillAdvancePicker({
  options,
  skills,
  career,
  editable,
  isDM,
  onBuy,
  onBack,
}: {
  options: readonly MissedRankSkillOption[];
  skills: readonly SkillEntry[];
  career?: string;
  editable: boolean;
  isDM: boolean;
  onBuy: (
    skillId: string,
    level: PurchasedSkillLevel,
    cost: number,
    purchase: EliteAdvancePurchase
  ) => void;
  onBack: () => void;
}) {
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [manualSkill, setManualSkill] = useState<{
    skill: SkillEntry;
    level: PurchasedSkillLevel;
  } | null>(null);
  const [manualCost, setManualCost] = useState("");
  const careerData = findCareerByName(career);
  const candidates: {
    skill: SkillEntry;
    level: PurchasedSkillLevel;
    option?: MissedRankSkillOption;
  }[] = showAll
    ? DEFAULT_SKILLS.flatMap((skill) => {
        const level = nextSkillLevel(
          skills.find((entry) => entry.id === skill.id)?.level ?? "untrained"
        );
        return level ? [{ skill, level }] : [];
      })
    : options.flatMap((option) => {
        const skill = DEFAULT_SKILLS.find((entry) => entry.id === option.skillId);
        return skill ? [{ skill, level: option.level, option }] : [];
      });
  const filtered = candidates
    .filter(({ skill }) =>
      skill.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
    )
    .sort((left, right) => left.skill.name.localeCompare(right.skill.name, "en-GB"));

  if (manualSkill) {
    const cost = Number(manualCost);
    return (
      <PickerModal
        title={`Buy ${manualSkill.skill.name}`}
        query=""
        onQueryChange={() => undefined}
        onClose={() => setManualSkill(null)}
        closeLabel={<ArrowLeft />}
        closeAriaLabel="Back"
        isEmpty={false}
        hideSearch
        footer={
          <Button
            fullWidth
            disabled={manualCost.trim() === ""}
            onClick={() => {
              onBuy(manualSkill.skill.id, manualSkill.level, cost, {
                source: "gm-approved",
                cost,
                sourceName: "GM-approved Skill",
              });
              setManualSkill(null);
              setManualCost("");
            }}
          >
            Buy {manualSkill.skill.name}
          </Button>
        }
      >
        <PickerBody>
          <label className={uiFormLabel}>XP Cost</label>
          <input
            type="text"
            inputMode="numeric"
            value={manualCost}
            onChange={(event) => setManualCost(sanitizeNonNegativeIntegerInput(event.target.value))}
            placeholder="0"
            className={`${editableInputClass(true)} mt-1`}
            autoComplete="off"
          />
        </PickerBody>
      </PickerModal>
    );
  }

  return (
    <PickerModal
      title={editable ? "Add Elite Advance Skill" : "View Elite Advance Skills"}
      query={query}
      onQueryChange={setQuery}
      onClose={showAll ? () => setShowAll(false) : onBack}
      closeLabel={<ArrowLeft />}
      closeAriaLabel="Back"
      isEmpty={filtered.length === 0}
      emptyMessage="No Elite Advance Skills available."
      filterRow={
        !showAll && (
          <FilterButton className="w-full" onClick={() => setShowAll(true)}>
            Show all
          </FilterButton>
        )
      }
    >
      <PickerList>
        {filtered.map(({ skill, level, option }) => {
          const replacedRank = option
            ? careerData?.ranks.find((entry) => entry.id === option.replacedRankId)
            : undefined;
          const canAdd = editable && (!showAll || isDM);
          return (
            <PickerRow
              key={option?.key ?? skill.id}
              interactive={canAdd}
              onClick={() => {
                if (!canAdd) return;
                if (showAll) {
                  setManualSkill({ skill, level });
                  return;
                }
                if (!option) return;
                onBuy(
                  skill.id,
                  level,
                  option.cost,
                  option.eliteAdvanceId
                    ? {
                        source: "elite-package",
                        cost: option.cost,
                        sourceName: option.eliteAdvanceName ?? option.eliteAdvanceId,
                        eliteAdvanceId: option.eliteAdvanceId,
                      }
                    : {
                        source: "missed-rank",
                        cost: option.cost,
                        sourceName: `Missed ${replacedRank?.name ?? option.replacedRankId} Rank`,
                        alternateRankId: option.alternateRankId,
                        replacedRankId: option.replacedRankId,
                      }
                );
              }}
            >
              <PickerRowName name={skill.name} />
              <PickerRowChips>
                <Chip colour={sourceChipColour(skill.source)} className="font-code">
                  {skill.source}
                </Chip>
                <Chip colour="sky">{level}</Chip>
                {option && (
                  <Chip colour="amber">
                    {option.cost} XP
                  </Chip>
                )}
              </PickerRowChips>
              {option?.eliteAdvanceId && (
                <PickerRowText>
                  <span className={uiTextLabel}>Unlocked by: </span>
                  {option.eliteAdvanceName ?? option.eliteAdvanceId}
                </PickerRowText>
              )}
              {option?.prerequisites && (
                <PickerRowText>
                  <span className={uiTextLabel}>Prerequisites: </span>
                  {option.prerequisites}
                </PickerRowText>
              )}
            </PickerRow>
          );
        })}
      </PickerList>
    </PickerModal>
  );
}

function TalentAdvancePicker({
  options,
  talents,
  career,
  rank,
  editable,
  isDM,
  suspended,
  onBuyFixed,
  onBuyManual,
  onBack,
}: {
  options: readonly MissedRankTalentOption[];
  talents: TalentsAndTraitsBlock;
  career?: string;
  rank?: string;
  editable: boolean;
  isDM: boolean;
  suspended: boolean;
  onBuyFixed: (option: MissedRankTalentOption) => void;
  onBuyManual: (entry: TalentEntry) => void;
  onBack: () => void;
}) {
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const careerData = findCareerByName(career);
  const filtered = options
    .flatMap((option) => {
      const talent = TALENT_LIST.find((entry) => entry.id === option.talentId);
      return talent ? [{ option, talent }] : [];
    })
    .filter(({ talent }) =>
      talent.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
    )
    .sort((left, right) => left.talent.name.localeCompare(right.talent.name, "en-GB"));

  if (showAll) {
    return (
      <TalentPickerModal
        title={editable ? "Add Elite Advance Talent" : "View Elite Advance Talents"}
        listData={[]}
        overflowListData={TALENT_LIST}
        entries={talents.talents}
        useTalentBehaviours
        editable={editable}
        isDM={isDM}
        onAdd={onBuyManual}
        onClose={() => setShowAll(false)}
        career={career}
        rank={rank}
        initialShowOverflow
        overflowBackCloses
        suspended={suspended}
      />
    );
  }

  return (
    <PickerModal
      title={editable ? "Add Elite Advance Talent" : "View Elite Advance Talents"}
      query={query}
      onQueryChange={setQuery}
      onClose={onBack}
      closeLabel={<ArrowLeft />}
      closeAriaLabel="Back"
      isEmpty={filtered.length === 0}
      emptyMessage="No Elite Advance Talents available."
      filterRow={
        <FilterButton className="w-full" onClick={() => setShowAll(true)}>
          Show all
        </FilterButton>
      }
    >
      <PickerList>
        {filtered.map(({ option, talent }) => {
          const replacedRank = option.replacedRankId
            ? careerData?.ranks.find((entry) => entry.id === option.replacedRankId)
            : undefined;
          return (
            <PickerRow
              key={option.key}
              interactive={editable}
              onClick={() => editable && onBuyFixed(option)}
            >
              <PickerRowName
                name={
                  <>
                    {talent.name}
                    {option.specialisation ? ` (${option.specialisation})` : ""}
                  </>
                }
                info={
                  TALENT_DESCRIPTIONS[talent.id] && (
                    <InfoModal
                      title={talent.name}
                      content={TALENT_DESCRIPTIONS[talent.id]}
                      as="span"
                    />
                  )
                }
              />
              <PickerRowChips>
                {(Array.isArray(talent.source) ? talent.source : [talent.source]).map((source) => (
                  <Chip key={source} colour={sourceChipColour(source)} className="font-code">
                    {source}
                  </Chip>
                ))}
                <Chip colour="amber">
                  {option.cost} XP
                </Chip>
              </PickerRowChips>
              {option.eliteAdvanceId ? (
                <PickerRowText>
                  <span className={uiTextLabel}>Unlocked by: </span>
                  {option.eliteAdvanceName ?? option.eliteAdvanceId}
                </PickerRowText>
              ) : (
                <PickerRowText>
                  <span className={uiTextLabel}>Missed rank: </span>
                  {replacedRank?.name ?? option.replacedRankId}
                </PickerRowText>
              )}
              {option.prerequisites && (
                <PickerRowText>
                  <span className={uiTextLabel}>Prerequisites: </span>
                  {option.prerequisites}
                </PickerRowText>
              )}
            </PickerRow>
          );
        })}
      </PickerList>
    </PickerModal>
  );
}

export function EliteAdvancesTab({
  talents,
  skills,
  experience,
  insanity,
  psychic = EMPTY_PSYCHIC,
  cybernetics = [],
  rangedWeapons = [],
  meleeWeapons = [],
  archeotech = [],
  willpowerBonus = 0,
  weaponTraining = EMPTY_WEAPON_TRAINING,
  career,
  rank,
  isDM = false,
  editable,
  onUpdateCharacter,
}: EliteAdvancesTabProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerKind, setPickerKind] = useState<PickerKind>("choose");
  const [pendingSpecial, setPendingSpecial] = useState<EliteAdvanceData | null>(null);
  const entries = talents.eliteAdvances ?? [];
  const references = useMemo(
    () => new Map(ELITE_ADVANCES.map((advance) => [advance.id, advance])),
    []
  );
  const namedAvailable = getAvailableNamedEliteAdvances(experience);
  const missed = getMissedRankEliteAdvanceOptions({
    career,
    rank,
    experience,
    skills,
    talents: talents.talents,
  });
  const packageOptions = getPackageEliteAdvanceOptions({ talents, skills, weaponTraining });
  const availableSkills = [...missed.skills, ...packageOptions.skills];
  const availableTalents = [...missed.talents, ...packageOptions.talents];
  const {
    addTalent: addTalentThroughAcquisition,
    acquisitionPending,
    acquisitionModal,
  } = useTalentAcquisitionFlow({
    talents,
    career,
    psychic,
    cybernetics,
    rangedWeapons,
    meleeWeapons,
    archeotech,
    insanity,
    willpowerBonus,
    weaponTraining,
    onSave: onUpdateCharacter,
  });

  const closePicker = () => {
    setShowPicker(false);
    setPickerKind("choose");
    setPendingSpecial(null);
  };

  const purchaseSpecial = async (
    advance: EliteAdvanceData,
    rolls: {
      insanityGained?: number;
      characteristicReductions?: Partial<Record<"t" | "fel", number>>;
    }
  ) => {
    const entry: EliteAdvanceEntry = {
      uid: crypto.randomUUID(),
      eliteAdvanceId: advance.id,
      name: advance.name,
      xpPurchase: makeCurrentRankPurchase(career, rank, advance.cost),
      acquisition: rolls,
    };
    const saved = await onUpdateCharacter({
      talentsAndTraits: { ...talents, eliteAdvances: [...entries, entry] },
      ...(rolls.insanityGained
        ? { insanity: { ...insanity, points: insanity.points + rolls.insanityGained } }
        : {}),
    });
    if (saved !== false) setPendingSpecial(null);
  };

  const purchaseSkill = async (
    skillId: string,
    level: PurchasedSkillLevel,
    cost: number,
    eliteAdvancePurchase: EliteAdvancePurchase
  ) => {
    const definition = DEFAULT_SKILLS.find((skill) => skill.id === skillId);
    const owned = skills.find((skill) => skill.id === skillId);
    if (!definition) return;
    const updated: SkillEntry = {
      ...definition,
      ...owned,
      level,
      xpPurchases: {
        ...owned?.xpPurchases,
        [level]: makeCurrentRankPurchase(career, rank, cost),
      },
      ...(eliteAdvancePurchase.source === "gm-approved"
        ? { manualCosts: { ...owned?.manualCosts, [level]: cost } }
        : {}),
      eliteAdvancePurchases: {
        ...owned?.eliteAdvancePurchases,
        [level]: eliteAdvancePurchase,
      },
    };
    await onUpdateCharacter({
      skills: owned
        ? skills.map((skill) => (skill.id === skillId ? updated : skill))
        : [...skills, updated],
    });
  };

  const purchaseFixedTalent = (option: MissedRankTalentOption) => {
    if (option.weaponTrainingId) {
      const id = option.weaponTrainingId;
      const eliteAdvancePurchase: EliteAdvancePurchase = {
        source: "elite-package",
        cost: option.cost,
        sourceName: option.eliteAdvanceName ?? option.eliteAdvanceId ?? "Elite Advance Package",
        eliteAdvanceId: option.eliteAdvanceId,
      };
      void onUpdateCharacter({
        weaponTraining: {
          ...weaponTraining,
          trained: [...weaponTraining.trained, id],
          xpPurchases: {
            ...weaponTraining.xpPurchases,
            [id]: makeCurrentRankPurchase(career, rank, option.cost),
          },
          eliteAdvancePurchases: {
            ...weaponTraining.eliteAdvancePurchases,
            [id]: eliteAdvancePurchase,
          },
        },
      });
      return;
    }
    const reference = TALENT_LIST.find((talent) => talent.id === option.talentId);
    if (!reference) return;
    const replacedRank = option.replacedRankId
      ? findCareerByName(career)?.ranks.find((entry) => entry.id === option.replacedRankId)
      : undefined;
    const eliteAdvancePurchase: EliteAdvancePurchase = option.eliteAdvanceId
      ? {
          source: "elite-package",
          cost: option.cost,
          sourceName: option.eliteAdvanceName ?? option.eliteAdvanceId,
          eliteAdvanceId: option.eliteAdvanceId,
        }
      : {
          source: "missed-rank",
          cost: option.cost,
          sourceName: `Missed ${replacedRank?.name ?? option.replacedRankId} Rank`,
          alternateRankId: option.alternateRankId,
          replacedRankId: option.replacedRankId,
        };
    const entry: TalentEntry = {
      ...makeTalentEntry(reference, option.specialisation),
      xpPurchase: makeCurrentRankPurchase(career, rank, option.cost),
      eliteAdvancePurchase,
    };
    addTalentThroughAcquisition(entry);
  };

  const purchaseManualTalent = (entry: TalentEntry) => {
    const reference = TALENT_LIST.find((talent) => talent.id === entry.talentId) as
      | TalentData
      | undefined;
    const cost = entry.xpPurchase?.cost ?? entry.manualCost ?? 0;
    const eliteAdvancePurchase: EliteAdvancePurchase = {
      source: reference?.faithGroup ? "faith-talent" : "gm-approved",
      cost,
      sourceName: reference?.faithGroup ? "GM-approved Faith Talent" : "GM-approved Talent",
    };
    addTalentThroughAcquisition({ ...entry, eliteAdvancePurchase });
  };

  const removeSpecial = async (uid: string) => {
    const removed = entries.find((entry) => entry.uid === uid);
    if (!removed) return;
    const psychicGrantPrefix = `elite-advance:${removed.uid}:minor-psychic-power:`;
    await onUpdateCharacter({
      talentsAndTraits: {
        ...talents,
        eliteAdvances: entries.filter((entry) => entry.uid !== uid),
      },
      ...(psychic
        ? {
            psychic: {
              ...psychic,
              minorPowers: psychic.minorPowers.filter(
                (power) => !power.talentEntryUid?.startsWith(psychicGrantPrefix)
              ),
            },
          }
        : {}),
      ...(removed.acquisition?.insanityGained
        ? {
            insanity: {
              ...insanity,
              points: Math.max(0, insanity.points - removed.acquisition.insanityGained),
            },
          }
        : {}),
    });
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <SectionHeader>Elite Advances</SectionHeader>
        {editable ? (
          <AddButton label="Add Elite Advance" onClick={() => setShowPicker(true)} />
        ) : (
          <ViewButton label="View Elite Advances" onClick={() => setShowPicker(true)} />
        )}
      </div>
      <section className={`${uiSection} space-y-2`}>
        {entries.length === 0 && (
          <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>
            No standalone Elite Advances purchased.
          </p>
        )}
        <div className="grid grid-cols-1 gap-2">
          {[...entries]
            .sort((left, right) => left.name.localeCompare(right.name, "en-GB"))
            .map((entry) => {
              const advance = references.get(entry.eliteAdvanceId);
              const displayEntry: TalentEntry = {
                uid: entry.uid,
                talentId: entry.eliteAdvanceId,
                name: advance?.name ?? entry.name,
                source: advance?.source,
                ...(entry.grantedByAlternateRankId
                  ? {
                      grantedByTalentEntryUid: `alternate-rank:${entry.grantedByAlternateRankId}`,
                      grantedByTalentName:
                        entry.grantedByAlternateRankName ?? entry.grantedByAlternateRankId,
                      grantedByType: "Alternate Rank" as const,
                    }
                  : {}),
              };
              return (
                <EntryCard
                  key={entry.uid}
                  entry={displayEntry}
                  editable={editable}
                  onRemove={(uid) => void removeSpecial(uid)}
                  confirmDeletion
                  deletionNoun="Elite Advance"
                  statusChip={
                    entry.grantedByAlternateRankId
                      ? undefined
                      : advance
                        ? `${advance.cost} XP`
                        : undefined
                  }
                  infoContent={advance ? <EliteAdvanceDetails advance={advance} /> : undefined}
                />
              );
            })}
        </div>
      </section>

      {showPicker && pickerKind === "choose" && (
        <EliteAdvanceKindPicker
          editable={editable}
          onChoose={setPickerKind}
          onClose={closePicker}
        />
      )}
      {showPicker && pickerKind === "special" && !pendingSpecial && (
        <SpecialAdvancePicker
          advances={namedAvailable}
          owned={entries}
          editable={editable}
          isDM={isDM}
          onSelect={setPendingSpecial}
          onBack={() => setPickerKind("choose")}
        />
      )}
      {showPicker && pickerKind === "special" && pendingSpecial && (
        <SpecialAdvancePurchaseModal
          advance={pendingSpecial}
          onBuy={(rolls) => void purchaseSpecial(pendingSpecial, rolls)}
          onBack={() => setPendingSpecial(null)}
        />
      )}
      {showPicker && pickerKind === "skill" && (
        <SkillAdvancePicker
          options={availableSkills}
          skills={skills}
          career={career}
          editable={editable}
          isDM={isDM}
          onBuy={(...args) => void purchaseSkill(...args)}
          onBack={() => setPickerKind("choose")}
        />
      )}
      {showPicker && pickerKind === "talent" && (
        <TalentAdvancePicker
          options={availableTalents}
          talents={talents}
          career={career}
          rank={rank}
          editable={editable}
          isDM={isDM}
          suspended={acquisitionPending}
          onBuyFixed={(option) => void purchaseFixedTalent(option)}
          onBuyManual={(entry) => void purchaseManualTalent(entry)}
          onBack={() => setPickerKind("choose")}
        />
      )}
      {acquisitionModal}
    </div>
  );
}
