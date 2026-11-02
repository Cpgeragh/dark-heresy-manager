import { useMemo, useState } from "react";
import { ELITE_ADVANCES, makeCurrentRankPurchase, type EliteAdvanceData } from "shared-rules";
import type {
  ArcheotechItem,
  CyberneticItem,
  EliteAdvanceEntry,
  ExperienceBlock,
  InsanityBlock,
  MeleeWeapon,
  PsychicBlock,
  RangedWeapon,
  SkillEntry,
  TalentEntry,
  TalentsAndTraitsBlock,
  WeaponTrainingBlock,
  Character,
} from "../../types/Character";
import { SectionHeader } from "../../ui/SectionHeader";
import { AddButton } from "../../ui/buttons/AddButton";
import { ViewButton } from "../../ui/buttons/ViewButton";
import { Button } from "../../ui/buttons/Button";
import { Chip } from "../../ui/chips/Chip";
import { PickerBody, PickerList, PickerModal, PickerRow } from "../../ui/pickers/PickerModal";
import { PickerRowChips, PickerRowLine, PickerRowName } from "../../ui/pickers/PickerRowParts";
import {
  editableInputClass,
  uiSection,
  uiSplitRow,
  uiStackList,
  uiTextPlaceholder,
} from "../../ui/styles/editableStyles";
import { sourceChipColour } from "../../ui/styles/sourceStyles";
import { FormLabel } from "../../ui/forms/FormLabel";
import { EntryCard } from "../talents/TalentEntryCards";
import { getAvailableNamedEliteAdvances } from "./eliteAdvanceAccess";
import { EliteAdvanceDetails } from "./eliteAdvanceDetails";
import { getAlternateRankNames } from "./eliteAdvanceNames";
import { buildPackageRemoval } from "./eliteAdvanceRemoval";
import { EliteUnlockedAllPicker, type EliteListTab } from "./EliteUnlockedAllPicker";

interface ElitePackagesTabProps {
  talents: TalentsAndTraitsBlock;
  skills: SkillEntry[];
  experience: ExperienceBlock;
  insanity: InsanityBlock;
  psychic?: PsychicBlock;
  cybernetics?: CyberneticItem[];
  rangedWeapons?: RangedWeapon[];
  meleeWeapons?: MeleeWeapon[];
  archeotech?: ArcheotechItem[];
  weaponTraining?: WeaponTrainingBlock;
  career?: string;
  rank?: string;
  isDM?: boolean;
  editable: boolean;
  onUpdateCharacter: (partial: Partial<Character>) => Promise<boolean>;
}

const EMPTY_PSYCHIC: PsychicBlock = { psyRating: 0, minorPowers: [], majorPowers: [] };
const EMPTY_WEAPON_TRAINING: WeaponTrainingBlock = { trained: [], exoticWeapons: [] };

interface PackageRolls {
  insanityGained?: number;
  characteristicReductions?: Partial<Record<"t" | "fel", number>>;
}

function PackagePurchaseModal({
  advance,
  onBuy,
  onBack,
}: {
  advance: EliteAdvanceData;
  onBuy: (rolls: PackageRolls) => void | Promise<boolean | void>;
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
    <div>
      <FormLabel htmlFor={`elite-roll-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
        {label}
      </FormLabel>
      <input
        id={`elite-roll-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
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
    </div>
  );

  return (
    <PickerModal
      title={`Buy ${advance.name}`}
      query=""
      onQueryChange={() => undefined}
      onClose={onBack}
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
        {needsInsanity && rollInput("Insanity Gained (1d5)", insanity, setInsanity)}
        {needsToughness &&
          rollInput("Permanent Toughness Reduction (1d5)", toughness, setToughness)}
        {needsFellowship &&
          rollInput("Permanent Fellowship Reduction (1d5)", fellowship, setFellowship)}
      </PickerBody>
    </PickerModal>
  );
}

export function ElitePackagesTab({
  talents,
  skills,
  experience,
  insanity,
  psychic = EMPTY_PSYCHIC,
  cybernetics = [],
  rangedWeapons = [],
  meleeWeapons = [],
  archeotech = [],
  weaponTraining = EMPTY_WEAPON_TRAINING,
  career,
  rank,
  isDM = false,
  editable,
  onUpdateCharacter,
}: ElitePackagesTabProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [pendingPackage, setPendingPackage] = useState<EliteAdvanceData | null>(null);
  const entries = talents.eliteAdvances ?? [];
  const references = useMemo(
    () => new Map(ELITE_ADVANCES.map((advance) => [advance.id, advance])),
    []
  );
  const unlocked = getAvailableNamedEliteAdvances(experience);
  const ownedIds = new Set(entries.map((entry) => entry.eliteAdvanceId));

  const closePicker = () => {
    setShowPicker(false);
    setPendingPackage(null);
  };

  const purchasePackage = async (advance: EliteAdvanceData, rolls: PackageRolls) => {
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
    if (saved !== false) setPendingPackage(null);
    return saved;
  };

  const packageState = {
    talents,
    skills,
    weaponTraining,
    psychic,
    insanity,
    cybernetics,
    rangedWeapons,
    meleeWeapons,
    archeotech,
    career,
  };

  const removePackage = async (uid: string) => {
    const removal = buildPackageRemoval(packageState, uid);
    if (!removal.ok) return false;
    return onUpdateCharacter(removal.update);
  };

  const renderTab = (tab: EliteListTab, query: string) => {
    const unlockedIds = new Set(unlocked.map((advance) => advance.id));
    const needle = query.trim().toLocaleLowerCase();
    const listed = (
      tab === "unlocked"
        ? [...unlocked]
        : ELITE_ADVANCES.filter((advance) => !unlockedIds.has(advance.id))
    )
      .filter((advance) => !advance.automaticGrantOnly)
      .filter((advance) => !editable || !ownedIds.has(advance.id))
      .filter((advance) => advance.name.toLocaleLowerCase().includes(needle))
      .sort((left, right) => left.name.localeCompare(right.name, "en-GB"));
    const canAdd = editable && (tab === "unlocked" || isDM);

    return {
      isEmpty: listed.length === 0,
      rows: (
        <PickerList>
          {listed.map((advance) => {
            const alternateRankNames = getAlternateRankNames(advance);
            return (
              <PickerRow
                key={advance.id}
                interactive={canAdd}
                onClick={() => canAdd && setPendingPackage(advance)}
              >
                <PickerRowName
                  name={advance.name}
                  infoTitle={advance.name}
                  information={<EliteAdvanceDetails advance={advance} />}
                />
                <PickerRowChips>
                  <Chip colour={sourceChipColour(advance.source)} className="font-code">
                    {advance.source}
                  </Chip>
                  <Chip colour="amber">{advance.cost} XP</Chip>
                </PickerRowChips>
                {advance.prerequisites && (
                  <PickerRowLine label="Prerequisites" value={advance.prerequisites} />
                )}
                {alternateRankNames.length > 0 && (
                  <PickerRowLine label="Available through" value={alternateRankNames.join(", ")} />
                )}
              </PickerRow>
            );
          })}
        </PickerList>
      ),
    };
  };

  return (
    <div>
      <div className={`${uiSplitRow} mb-3`}>
        <SectionHeader>Elite Packages</SectionHeader>
        {editable ? (
          <AddButton label="Add Elite Package" onClick={() => setShowPicker(true)} />
        ) : (
          <ViewButton label="View Elite Packages" onClick={() => setShowPicker(true)} />
        )}
      </div>
      <section className={`${uiSection} ${uiStackList}`}>
        {entries.length === 0 && (
          <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>
            No Elite Packages purchased.
          </p>
        )}
        <div className={uiStackList}>
          {[...entries]
            .sort((left, right) => left.name.localeCompare(right.name, "en-GB"))
            .map((entry) => {
              const advance = references.get(entry.eliteAdvanceId);
              const removal = buildPackageRemoval(packageState, entry.uid);
              const displayEntry: TalentEntry = {
                uid: entry.uid,
                talentId: entry.eliteAdvanceId,
                name: advance?.name ?? entry.name,
                source: advance?.source,
                personalNotes: entry.personalNotes,
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
                  onRemove={(uid) => removePackage(uid)}
                  removalNoun="Elite Advance"
                  removalBlockedMessage={removal.ok ? undefined : removal.warning.message}
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

      {showPicker && (
        <EliteUnlockedAllPicker
          title={editable ? "Add Elite Package" : "View Elite Packages"}
          onClose={closePicker}
          renderTab={renderTab}
          emptyMessage="No Elite Packages available."
          suspended={pendingPackage !== null}
        />
      )}
      {showPicker && pendingPackage && (
        <PackagePurchaseModal
          advance={pendingPackage}
          onBuy={(rolls) => purchasePackage(pendingPackage, rolls)}
          onBack={() => setPendingPackage(null)}
        />
      )}
    </div>
  );
}
