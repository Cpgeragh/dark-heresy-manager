import { useState } from "react";
import { findCareerByName, TALENT_LIST, type TalentData } from "shared-rules";
import { TALENT_DESCRIPTIONS } from "../../data/reference/talentDescriptions";
import type {
  ArcheotechItem,
  Character,
  CyberneticItem,
  EliteAdvancePurchase,
  ExperienceBlock,
  InsanityBlock,
  MeleeWeapon,
  PsychicBlock,
  RangedWeapon,
  SkillEntry,
  TalentEntry,
  TalentsAndTraitsBlock,
  WeaponTrainingBlock,
} from "../../types/Character";
import { OwnedEntryRow } from "../../ui/OwnedEntryRow";
import { SectionHeader } from "../../ui/SectionHeader";
import { AddButton } from "../../ui/buttons/AddButton";
import { ViewButton } from "../../ui/buttons/ViewButton";
import { Chip } from "../../ui/chips/Chip";
import { PickerList, PickerRow } from "../../ui/pickers/PickerModal";
import { PickerRowChips, PickerRowLine, PickerRowName } from "../../ui/pickers/PickerRowParts";
import {
  uiSection,
  uiSplitRow,
  uiStackList,
  uiTextPlaceholder,
} from "../../ui/styles/editableStyles";
import { sourceChipColour } from "../../ui/styles/sourceStyles";
import { removeWeaponTrainingGroup } from "../../utils/weaponTrainingRemoval";
import { EntryCard } from "../talents/TalentEntryCards";
import { TalentPickerModal, type UnlockedTalentTab } from "../talents/TalentPickerModal";
import { buildTalentRemovalUpdate } from "../talents/talentRemovalRules";
import { normaliseSources } from "../talents/talentUtils";
import { useTalentAcquisitionFlow } from "../talents/useTalentAcquisitionFlow";
import {
  getMissedRankEliteAdvanceOptions,
  getPackageEliteAdvanceOptions,
  type MissedRankTalentOption,
} from "./eliteAdvanceAccess";
import { buildFixedTalentPurchase } from "./eliteAdvancePurchase";
import { getEliteTalentPurchases, getEliteTrainingPurchases } from "./eliteAdvancePurchases";

interface EliteTalentsTabProps {
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

const EMPTY_PSYCHIC: PsychicBlock = { psyRating: 0, minorPowers: [], majorPowers: [] };
const EMPTY_WEAPON_TRAINING: WeaponTrainingBlock = { trained: [], exoticWeapons: [] };

const LINKED_POWERS_MESSAGE =
  "This Talent cannot be removed until its linked Psychic powers are removed. Remove those powers on the Psychic page first, then remove the Talent here.";

export function EliteTalentsTab({
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
}: EliteTalentsTabProps) {
  const [showPicker, setShowPicker] = useState(false);
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
  const missed = getMissedRankEliteAdvanceOptions({ career, rank, experience, skills, talents });
  const packageOptions = getPackageEliteAdvanceOptions({
    talents,
    skills,
    weaponTraining,
    career,
    rank,
    alternateRanks: experience.alternateRanks,
  });
  const unlockedOptions = [...missed.talents, ...packageOptions.talents];
  const talentPurchases = getEliteTalentPurchases(talents.talents);
  const trainingPurchases = getEliteTrainingPurchases(weaponTraining);
  const careerData = findCareerByName(career);
  const powers = [...psychic.minorPowers, ...psychic.majorPowers];

  const removeTalent = async (uid: string, restoreOneTimeEffects = false) => {
    const entry = talents.talents.find((talent) => talent.uid === uid);
    if (!entry) return;
    return onUpdateCharacter(
      buildTalentRemovalUpdate({
        entry,
        restoreOneTimeEffects,
        talents,
        psychic,
        cybernetics,
        insanity,
        rangedWeapons,
        meleeWeapons,
        archeotech,
      })
    );
  };

  const buyUnlocked = (option: MissedRankTalentOption) => {
    const purchase = buildFixedTalentPurchase({ option, weaponTraining, career, rank });
    if (!purchase) return undefined;
    if (purchase.kind === "training") {
      return onUpdateCharacter({ weaponTraining: purchase.weaponTraining });
    }
    return addTalentThroughAcquisition(purchase.entry);
  };

  const buyManual = (entry: TalentEntry) => {
    const reference = TALENT_LIST.find((talent) => talent.id === entry.talentId) as
      | TalentData
      | undefined;
    const cost = entry.xpPurchase?.cost ?? entry.manualCost ?? 0;
    const eliteAdvancePurchase: EliteAdvancePurchase = {
      source: reference?.faithGroup ? "faith-talent" : "gm-approved",
      cost,
      sourceName: reference?.faithGroup ? "GM-approved Faith Talent" : "GM-approved Talent",
    };
    return addTalentThroughAcquisition({ ...entry, eliteAdvancePurchase });
  };

  const unlockedTab: UnlockedTalentTab = {
    isUnlocked: (talentId, specialisation) =>
      unlockedOptions.some(
        (option) =>
          option.talentId === talentId &&
          (option.specialisation ?? "").toLocaleLowerCase() ===
            (specialisation ?? "").toLocaleLowerCase()
      ),
    render: (query) => {
      const needle = query.trim().toLocaleLowerCase();
      const rows = unlockedOptions
        .flatMap((option) => {
          const talent = TALENT_LIST.find((entry) => entry.id === option.talentId);
          return talent && talent.name.toLocaleLowerCase().includes(needle)
            ? [{ option, talent }]
            : [];
        })
        .sort((left, right) => left.talent.name.localeCompare(right.talent.name, "en-GB"));
      return {
        isEmpty: rows.length === 0,
        rows: (
          <PickerList>
            {rows.map(({ option, talent }) => {
              const replacedRank = option.replacedRankId
                ? careerData?.ranks.find((entry) => entry.id === option.replacedRankId)
                : undefined;
              return (
                <PickerRow
                  key={option.key}
                  interactive={editable}
                  onClick={() => (editable ? buyUnlocked(option) : undefined)}
                >
                  <PickerRowName
                    name={
                      <>
                        {talent.name}
                        {option.specialisation ? ` (${option.specialisation})` : ""}
                      </>
                    }
                    infoTitle={talent.name}
                    information={TALENT_DESCRIPTIONS[talent.id]}
                  />
                  <PickerRowChips>
                    {normaliseSources(talent.source).map((source) => (
                      <Chip key={source} colour={sourceChipColour(source)} className="font-code">
                        {source}
                      </Chip>
                    ))}
                    <Chip colour="amber">{option.cost} XP</Chip>
                  </PickerRowChips>
                  {option.eliteAdvanceId ? (
                    <PickerRowLine
                      label="Unlocked by"
                      value={option.eliteAdvanceName ?? option.eliteAdvanceId}
                    />
                  ) : (
                    <PickerRowLine
                      label="Missed rank"
                      value={replacedRank?.name ?? option.replacedRankId}
                    />
                  )}
                  {option.prerequisites && (
                    <PickerRowLine label="Prerequisites" value={option.prerequisites} />
                  )}
                </PickerRow>
              );
            })}
          </PickerList>
        ),
      };
    },
  };

  return (
    <div>
      <div className={`${uiSplitRow} mb-3`}>
        <SectionHeader>Elite Talents</SectionHeader>
        {editable ? (
          <AddButton label="Add Elite Talent" onClick={() => setShowPicker(true)} />
        ) : (
          <ViewButton label="View Elite Talents" onClick={() => setShowPicker(true)} />
        )}
      </div>
      <section className={`${uiSection} ${uiStackList}`}>
        {talentPurchases.length === 0 && trainingPurchases.length === 0 && (
          <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>No Elite talents purchased.</p>
        )}
        <div className={uiStackList}>
          {talentPurchases.map((entry) => {
            const linked = powers.some((power) => power.psyRatingTalentEntryUid === entry.uid);
            return (
              <EntryCard
                key={entry.uid}
                entry={entry}
                editable={editable}
                onRemove={removeTalent}
                removable={!linked}
                removalBlockedMessage={linked ? LINKED_POWERS_MESSAGE : undefined}
              />
            );
          })}
          {trainingPurchases.map(({ id, name, purchase }) => (
            <OwnedEntryRow
              key={id}
              name={name}
              editable={editable}
              collapsible
              lines={{ gainedFrom: `${purchase.sourceName} (Elite Advance)` }}
              removal={{
                kind: "Talent",
                onRemove: () =>
                  onUpdateCharacter({
                    weaponTraining: removeWeaponTrainingGroup(weaponTraining, id),
                  }),
              }}
            />
          ))}
        </div>
      </section>

      {showPicker && (
        <TalentPickerModal
          title={editable ? "Add Elite Talent" : "View Elite Talents"}
          listData={[]}
          overflowListData={TALENT_LIST}
          entries={talents.talents}
          useTalentBehaviours
          editable={editable}
          isDM={isDM}
          onAdd={buyManual}
          onClose={() => setShowPicker(false)}
          career={career}
          rank={rank}
          initialShowOverflow
          overflowBackCloses
          suspended={acquisitionPending}
          unlockedTab={unlockedTab}
        />
      )}
      {acquisitionModal}
    </div>
  );
}
