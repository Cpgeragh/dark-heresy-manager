import { useMemo, useRef, useState } from "react";
import { HOMEWORLD_LIST } from "../../data/homeworldData";
import { TALENT_LIST } from "../../data/talentData";
import { CYBERNETICS_REFERENCE } from "../../data/reference/cyberneticsReference";
import { PSYCHIC_DISCIPLINES } from "../../data/reference/psychicReference";
import { resolveMeleeWeaponReference } from "../../data/reference/weaponReference";
import type {
  ArcheotechItem,
  ArmourLocationKey,
  CyberneticItem,
  InsanityBlock,
  InsanityDisorderEntry,
  MeleeWeapon,
  RangedWeapon,
  TalentEntry,
  TalentsAndTraitsBlock,
  WeaponTrainingTalentId,
  WeaponTrainingBlock,
  HomeworldTraitChoices,
} from "../../types/Character";
import {
  isIntegratedMeleeWeapon,
  isIntegratedRangedWeapon,
} from "../../utils/weaponUtils";
import { Button } from "../../ui/Button";
import { Chip } from "../../ui/Chip";
import { colourAmberFaint, colourInactive, colourValue } from "../../ui/colourTokens";
import { RequiredFieldsNote } from "../../ui/CustomFormFooter";
import {
  editableInputClass,
  uiFormLabel,
  uiTextBody,
  uiTextError,
  uiTextPlaceholder,
  uiTextSubtle,
} from "../../ui/editableStyles";
import { OptionPickerScreen, type PickerOption } from "../../ui/OptionPickerScreen";
import { PickerField } from "../../ui/PickerField";
import { ArrowLeft } from "../../ui/PickerArrows";
import { PickerBody, PickerModal, PickerRow } from "../../ui/PickerModal";
import { defaultCraftsmanship } from "./CyberneticsTab/cyberneticsHelpers";
import {
  getGrantedTalentEntries,
  getGrantedWeaponTrainingIds,
} from "../../features/talents/talentEffects";
import {
  getPurityFatePoints,
  getPurityRemovalInventory,
  isPurityArcheotech,
} from "../../features/talents/purityOfFlesh";
import { getPsyRatingAcquisitionGrants } from "./talentUtils";
import {
  HomeworldTraitAcquisitionModal,
  homeworldNeedsTraitAcquisition,
} from "./HomeworldTraitAcquisitionModal";

export interface TalentAcquisitionResult {
  entry: TalentEntry;
  cybernetics?: CyberneticItem[];
  rangedWeapons?: RangedWeapon[];
  meleeWeapons?: MeleeWeapon[];
  archeotech?: ArcheotechItem[];
  insanity?: InsanityBlock;
  additionalTalentEntries?: TalentEntry[];
}

interface Props {
  entry: TalentEntry;
  talents: TalentsAndTraitsBlock;
  currentHomeworldId: string;
  cybernetics: CyberneticItem[];
  rangedWeapons: RangedWeapon[];
  meleeWeapons: MeleeWeapon[];
  archeotech: ArcheotechItem[];
  insanity: InsanityBlock;
  willpowerBonus: number;
  knownDisciplines: readonly string[];
  weaponTraining: WeaponTrainingBlock;
  onComplete: (result: TalentAcquisitionResult) => void;
  onClose: () => void;
}

const HERETEK_TALENTS = [
  ["autosanguine", "Autosanguine"],
  ["logis-implant", "Logis Implant"],
  ["orthoproxy", "Orthoproxy"],
  ["technical-knock", "Technical Knock"],
] as const;

const PEER_OPTIONS = (() => {
  const peer = TALENT_LIST.find((talent) => talent.id === "peer");
  return peer?.behaviour?.kind === "fixed-repeatable" ? peer.behaviour.options : [];
})();

const MELEE_OPTIONS: readonly { id: WeaponTrainingTalentId; label: string }[] = [
  { id: "melee-chain", label: "Chain" },
  { id: "melee-power", label: "Power" },
  { id: "melee-primitive", label: "Primitive" },
  { id: "melee-shock", label: "Shock" },
];

type AcquisitionPicker =
  | "granted-augmetic"
  | "augmetic-location"
  | "bionic-arm"
  | "concealed-weapon"
  | "heretek-talent"
  | "pleasure-talent"
  | "melee-training"
  | "homeworld"
  | "peer-group"
  | "toughness-loss"
  | "reformed-skin-cause"
  | "discipline"
  | "power-grant";

interface AcquisitionPickerConfig {
  title: string;
  options: readonly PickerOption[];
  selected: string;
  onSelect: (value: string) => void;
}

function ResultRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded border border-slate-700 bg-slate-900/40 px-3 py-2">
      <span className={uiFormLabel}>{label}</span>
      <Chip size="lg" className={colourValue}>{value}</Chip>
    </div>
  );
}

function structuredDisorders(insanity: InsanityBlock): InsanityDisorderEntry[] {
  return Array.isArray(insanity.disorders) ? insanity.disorders : [];
}

function locationOptions(kind: "arm" | "leg" | undefined): { value: ArmourLocationKey; label: string }[] {
  if (kind === "arm") return [
    { value: "rightArm", label: "Right Arm" },
    { value: "leftArm", label: "Left Arm" },
  ];
  if (kind === "leg") return [
    { value: "rightLeg", label: "Right Leg" },
    { value: "leftLeg", label: "Left Leg" },
  ];
  return [];
}

export function needsTalentAcquisition(entry: TalentEntry, talents: TalentsAndTraitsBlock): boolean {
  if (/^psy-rating-[3-6]$/.test(entry.talentId)) return true;
  if (entry.talentId === "cult-briefing") {
    return ["Heretek", "Pleasure", "Blood", "Culture"].includes(entry.specialisation ?? "");
  }
  if (entry.talentId === "sicarius-tutoring") {
    return ["Guardsman", "Scum"].includes(entry.specialisation ?? "");
  }
  if (["touched-by-the-fates", "purity-of-flesh", "rite-of-pure-thought"].includes(entry.talentId)) {
    return true;
  }
  if (entry.talentId === "reformed-skin") {
    return talents.talents.some(
      (owned) => owned.talentId === "purity-of-flesh" && (owned.acquisition?.purity?.fatePointsGained ?? 0) > 0
    );
  }
  return false;
}

export function TalentAcquisitionModal({
  entry,
  talents,
  currentHomeworldId,
  cybernetics,
  rangedWeapons,
  meleeWeapons,
  archeotech,
  insanity,
  willpowerBonus,
  knownDisciplines,
  weaponTraining,
  onComplete,
  onClose,
}: Props) {
  const [primaryChoice, setPrimaryChoice] = useState("");
  const [secondaryChoice, setSecondaryChoice] = useState("");
  const [toughnessLoss, setToughnessLoss] = useState(1);
  const [replacement, setReplacement] = useState("");
  const [concealedWeaponChoice, setConcealedWeaponChoice] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [removedDisorderIds, setRemovedDisorderIds] = useState<string[]>([]);
  const [replacementDisorders, setReplacementDisorders] = useState<Record<string, string>>({});
  const [showFatalRemovalPicker, setShowFatalRemovalPicker] = useState(false);
  const [fatalRemovalQuery, setFatalRemovalQuery] = useState("");
  const [fatalRemovalKeys, setFatalRemovalKeys] = useState<string[]>([]);
  const [fatalReplacements, setFatalReplacements] = useState<Record<string, string>>({});
  const [purityStage, setPurityStage] = useState<"purity" | "reformed-skin">("purity");
  const [activePicker, setActivePicker] = useState<AcquisitionPicker | null>(null);
  const [homeworldTraitChoices, setHomeworldTraitChoices] = useState<HomeworldTraitChoices | undefined>();
  const [showHomeworldTraitAcquisition, setShowHomeworldTraitAcquisition] = useState(false);
  const acquisitionScrollPositionRef = useRef(0);

  const homeworldOptions = HOMEWORLD_LIST.filter(
    (homeworld) => homeworld.id !== currentHomeworldId
  );
  const selectedCybernetic = CYBERNETICS_REFERENCE.find((item) => item.id === primaryChoice);
  const selectedLocations = locationOptions(selectedCybernetic?.requiresLocation);
  const selectingConcealedWeapon = selectedCybernetic?.id === "ih-concealed-weapon-bionic";
  const bionicArms = cybernetics.filter((item) => item.referenceId === "cr-bionic-arm");
  const eligibleConcealedWeapons = [
    ...rangedWeapons
      .filter((weapon) => weapon.class?.toLocaleLowerCase().includes("pistol") && !weapon.concealedBionic)
      .map((weapon) => ({ value: `ranged:${weapon.id}`, label: `${weapon.name} (Ranged)` })),
    ...meleeWeapons
      .filter((weapon) => !weapon.concealedBionic && !resolveMeleeWeaponReference(weapon.referenceId)?.twoHanded)
      .map((weapon) => ({ value: `melee:${weapon.id}`, label: `${weapon.name} (Melee)` })),
  ].sort((a, b) => a.label.localeCompare(b.label));
  const disorders = structuredDisorders(insanity);
  const ownedTalentEntries = [...talents.talents, ...getGrantedTalentEntries(talents)];
  const ownsTalent = (talentId: string, specialisation?: string) => ownedTalentEntries.some(
    (owned) =>
      owned.talentId === talentId &&
      (!specialisation || owned.specialisation?.toLocaleLowerCase() === specialisation.toLocaleLowerCase())
  );
  const ownedTraining = new Set([
    ...weaponTraining.trained,
    ...getGrantedWeaponTrainingIds(talents),
  ]);
  const pleasureTalents = [
    ["chem-geld", "Chem Geld"],
    ["decadence", "Decadence"],
  ] as const;
  const purityEntries = talents.talents.filter(
    (owned) => owned.talentId === "purity-of-flesh" && (owned.acquisition?.purity?.fatePointsGained ?? 0) > 0
  );
  const purityEntry = purityEntries[0];
  const majorDisciplines = PSYCHIC_DISCIPLINES.filter((discipline) => discipline !== "Minor");
  const knownDisciplineKeys = new Set(
    knownDisciplines.map((discipline) => discipline.toLocaleLowerCase())
  );
  const knownDisciplineOptions = majorDisciplines.filter((discipline) =>
    knownDisciplineKeys.has(discipline.toLocaleLowerCase())
  );
  const newDisciplineOptions = majorDisciplines.filter((discipline) =>
    !knownDisciplineKeys.has(discipline.toLocaleLowerCase())
  );
  const psyRating = /^psy-rating-[3-6]$/.test(entry.talentId)
    ? Number(entry.talentId.slice(-1))
    : 0;
  const halfWillpowerBonus = Math.ceil(willpowerBonus / 2);
  const psyRatingGrant = getPsyRatingAcquisitionGrants(
    psyRating,
    willpowerBonus,
    secondaryChoice === "new" ? "new" : "known"
  );
  const psyRatingUsesNewDiscipline = psyRatingGrant.newDiscipline;
  const psyRatingMinorGrants = secondaryChoice || psyRating === 3 ? psyRatingGrant.minor : 0;
  const psyRatingMajorGrants = secondaryChoice || psyRating === 3 ? psyRatingGrant.major : 0;
  const purityInventory = getPurityRemovalInventory(
    cybernetics,
    rangedWeapons,
    meleeWeapons,
    archeotech
  );
  const qualifyingBionics = purityInventory.filter((item) => item.qualifiesForFate).length;
  const purityFatePoints = getPurityFatePoints(purityInventory);
  const fatalRemovalItems = purityInventory.filter((item) => fatalRemovalKeys.includes(item.key));
  const hasFatalRemovals = fatalRemovalItems.length > 0;
  const filteredFatalRemovalItems = purityInventory.filter((item) =>
    item.name.toLocaleLowerCase().includes(fatalRemovalQuery.trim().toLocaleLowerCase())
  );

  const title = entry.talentId === "purity-of-flesh" && purityStage === "reformed-skin"
    ? "Reformed Skin Acquisition"
    : `${entry.name} Acquisition`;

  const canComplete = useMemo(() => {
    if (entry.talentId === "cult-briefing") {
      if (entry.specialisation === "Heretek") {
        return Boolean(
          primaryChoice &&
          secondaryChoice &&
          (!selectedCybernetic?.requiresLocation || replacement) &&
          (!selectingConcealedWeapon || (replacement && concealedWeaponChoice))
        );
      }
      if (entry.specialisation === "Culture" && homeworldNeedsTraitAcquisition(primaryChoice)) {
        return Boolean(primaryChoice && homeworldTraitChoices);
      }
      return Boolean(primaryChoice);
    }
    if (entry.talentId === "sicarius-tutoring") return Boolean(primaryChoice.trim());
    if (entry.talentId === "touched-by-the-fates") return confirmed;
    if (entry.talentId === "purity-of-flesh") {
      return purityStage === "reformed-skin"
        ? fatalRemovalItems.every((item) => fatalReplacements[item.key]?.trim())
        : true;
    }
    if (entry.talentId === "rite-of-pure-thought") {
      return confirmed && removedDisorderIds.every((id) => replacementDisorders[id]?.trim());
    }
    if (entry.talentId === "reformed-skin") return Boolean(primaryChoice);
    if (/^psy-rating-[3-6]$/.test(entry.talentId)) {
      const rating = Number(entry.talentId.slice(-1));
      return Boolean(primaryChoice && (rating === 3 || secondaryChoice));
    }
    return true;
  }, [
    entry,
    primaryChoice,
    secondaryChoice,
    selectedCybernetic,
    replacement,
    concealedWeaponChoice,
    selectingConcealedWeapon,
    confirmed,
    purityStage,
    fatalRemovalItems,
    fatalReplacements,
    removedDisorderIds,
    replacementDisorders,
    homeworldTraitChoices,
  ]);

  const complete = () => {
    if (!canComplete) return;
    let completedEntry = entry;
    let nextCybernetics: CyberneticItem[] | undefined;
    let nextRangedWeapons: RangedWeapon[] | undefined;
    let nextMeleeWeapons: MeleeWeapon[] | undefined;
    let nextArcheotech: ArcheotechItem[] | undefined;
    let nextInsanity: InsanityBlock | undefined;
    const additionalTalentEntries: TalentEntry[] = [];

    if (entry.talentId === "cult-briefing") {
      if (entry.specialisation === "Heretek" && selectedCybernetic) {
        const granted = HERETEK_TALENTS.find(([id]) => id === secondaryChoice);
        const bodyLocation = selectedCybernetic.requiresLocation && replacement
          ? [replacement as ArmourLocationKey]
          : undefined;
        const craftsmanship = defaultCraftsmanship(selectedCybernetic);
        const cyberneticId = crypto.randomUUID();
        const [concealedWeaponType, concealedWeaponId] = concealedWeaponChoice.split(":") as [
          "ranged" | "melee",
          string,
        ];
        const augmetic: CyberneticItem = {
          id: cyberneticId,
          referenceId: selectedCybernetic.id,
          name: selectedCybernetic.name,
          craftsmanship,
          value: selectedCybernetic.value,
          availability: selectedCybernetic.availability,
          source: selectedCybernetic.source,
          grantedByTalentEntryUid: entry.uid,
          grantedByTalentName: entry.name,
          ...(bodyLocation ? { bodyLocation } : {}),
          ...(selectingConcealedWeapon ? {
            concealedWeapon: {
              armId: replacement,
              weaponId: concealedWeaponId,
              weaponType: concealedWeaponType,
            },
          } : {}),
        };
        nextCybernetics = [...cybernetics, augmetic];
        if (selectingConcealedWeapon && concealedWeaponType === "ranged") {
          nextRangedWeapons = rangedWeapons.map((weapon) =>
            weapon.id === concealedWeaponId
              ? { ...weapon, concealedBionic: { cyberneticId, craftsmanship } }
              : weapon
          );
        }
        if (selectingConcealedWeapon && concealedWeaponType === "melee") {
          nextMeleeWeapons = meleeWeapons.map((weapon) =>
            weapon.id === concealedWeaponId
              ? { ...weapon, concealedBionic: { cyberneticId, craftsmanship } }
              : weapon
          );
        }
        completedEntry = {
          ...entry,
          acquisition: {
            grantedTalentId: granted?.[0],
            grantedTalentName: granted?.[1],
            augmeticName: selectedCybernetic.name,
            augmeticReferenceId: selectedCybernetic.id,
          },
        };
      } else if (entry.specialisation === "Pleasure") {
        const reference = primaryChoice === "chem-geld" ? "Chem Geld" : "Decadence";
        completedEntry = { ...entry, acquisition: { grantedTalentId: primaryChoice, grantedTalentName: reference } };
      } else if (entry.specialisation === "Blood") {
        completedEntry = { ...entry, acquisition: { weaponTrainingId: primaryChoice as WeaponTrainingTalentId } };
      } else if (entry.specialisation === "Culture") {
        completedEntry = {
          ...entry,
          acquisition: {
            homeworldId: primaryChoice,
            ...(homeworldTraitChoices ? { homeworldTraitChoices } : {}),
          },
        };
      }
    } else if (entry.talentId === "sicarius-tutoring") {
      completedEntry = entry.specialisation === "Guardsman"
        ? { ...entry, acquisition: { exoticWeapon: primaryChoice.trim() } }
        : {
            ...entry,
            acquisition: {
              grantedTalentId: "peer",
              grantedTalentName: "Peer",
              grantedTalentSpecialisation: primaryChoice,
            },
          };
    } else if (entry.talentId === "touched-by-the-fates") {
      completedEntry = {
        ...entry,
        acquisition: { touchedByFatesPoints: Math.ceil(willpowerBonus / 2) },
      };
    } else if (entry.talentId === "purity-of-flesh") {
      const fatePointsGained = purityFatePoints;
      const removedCyberneticIds = new Set(cybernetics.map((item) => item.id));
      const removedIntegratedRangedWeapons = rangedWeapons.filter(isIntegratedRangedWeapon);
      const removedIntegratedMeleeWeapons = meleeWeapons.filter(isIntegratedMeleeWeapon);
      const removedArcheotech = archeotech.filter(isPurityArcheotech);
      const removedConcealedWeaponLinks = [
        ...rangedWeapons.flatMap((weapon) =>
          weapon.concealedBionic && removedCyberneticIds.has(weapon.concealedBionic.cyberneticId)
            ? [{
                weaponId: weapon.id,
                weaponType: "ranged" as const,
                ...weapon.concealedBionic,
              }]
            : []
        ),
        ...meleeWeapons.flatMap((weapon) =>
          weapon.concealedBionic && removedCyberneticIds.has(weapon.concealedBionic.cyberneticId)
            ? [{
                weaponId: weapon.id,
                weaponType: "melee" as const,
                ...weapon.concealedBionic,
              }]
            : []
        ),
      ];
      completedEntry = {
        ...entry,
        acquisition: {
          purity: {
            removedCyberneticIds: cybernetics.map((item) => item.id),
            removedCybernetics: cybernetics,
            ...(removedIntegratedRangedWeapons.length > 0 ? { removedIntegratedRangedWeapons } : {}),
            ...(removedIntegratedMeleeWeapons.length > 0 ? { removedIntegratedMeleeWeapons } : {}),
            ...(removedArcheotech.length > 0 ? { removedArcheotech } : {}),
            ...(removedConcealedWeaponLinks.length > 0 ? { removedConcealedWeaponLinks } : {}),
            qualifyingBionicsRemoved: qualifyingBionics,
            fatePointsGained,
            ...(hasFatalRemovals ? { toughnessLoss, woundsLoss: 1 } : {}),
          },
        },
      };
      nextCybernetics = [];
      nextRangedWeapons = rangedWeapons
        .filter((weapon) => !isIntegratedRangedWeapon(weapon))
        .map((weapon) =>
          weapon.concealedBionic && removedCyberneticIds.has(weapon.concealedBionic.cyberneticId)
            ? { ...weapon, concealedBionic: undefined }
            : weapon
        );
      nextMeleeWeapons = meleeWeapons
        .filter((weapon) => !isIntegratedMeleeWeapon(weapon))
        .map((weapon) =>
          weapon.concealedBionic && removedCyberneticIds.has(weapon.concealedBionic.cyberneticId)
            ? { ...weapon, concealedBionic: undefined }
            : weapon
        );
      nextArcheotech = archeotech.filter((item) => !isPurityArcheotech(item));
      if (hasFatalRemovals) {
        for (const fatalItem of fatalRemovalItems) {
          const fatalReplacement = fatalReplacements[fatalItem.key].trim();
          additionalTalentEntries.push({
            uid: crypto.randomUUID(),
            talentId: "reformed-skin",
            name: `Reformed Skin (${fatalReplacement})`,
            specialisation: fatalReplacement,
            notes: `Immediate replacement required after removing ${fatalItem.name} through Purity of Flesh.`,
            acquisition: {
              reformedSkinPurityReplacement: true,
              purityTalentEntryUid: entry.uid,
            },
          });
        }
      }
    } else if (entry.talentId === "reformed-skin") {
      completedEntry = primaryChoice === "purity"
        ? {
            ...entry,
            acquisition: {
              ...entry.acquisition,
              reformedSkinPurityReplacement: true,
              purityTalentEntryUid: purityEntry?.uid,
            },
          }
        : {
            ...entry,
            acquisition: {
              ...entry.acquisition,
              reformedSkinPurityReplacement: false,
            },
          };
    } else if (entry.talentId === "rite-of-pure-thought") {
      const retained = disorders.filter((disorder) => !removedDisorderIds.includes(disorder.id));
      const replacements = disorders
        .filter((disorder) => removedDisorderIds.includes(disorder.id))
        .map((disorder) => ({
          ...disorder,
          id: crypto.randomUUID(),
          referenceId: undefined,
          name: replacementDisorders[disorder.id].trim(),
          notes: `Replacement for ${disorder.name} through Rite of Pure Thought.`,
          custom: true,
        }));
      nextInsanity = { ...insanity, disorders: [...retained, ...replacements] };
      completedEntry = {
        ...entry,
        acquisition: {
          riteOfPureThoughtReviewed: true,
          riteOriginalDisorders: disorders.filter((disorder) => removedDisorderIds.includes(disorder.id)),
          riteReplacementDisorderIds: replacements.map((disorder) => disorder.id),
        },
      };
    } else if (/^psy-rating-[3-6]$/.test(entry.talentId)) {
      completedEntry = {
        ...entry,
        acquisition: {
          ...entry.acquisition,
          psyRatingWillpowerBonus: willpowerBonus,
          psyRatingMinorPowerGrants: psyRatingMinorGrants,
          psyRatingMajorPowerGrants: psyRatingMajorGrants,
          psyRatingDiscipline: primaryChoice,
          psyRatingNewDiscipline: psyRatingUsesNewDiscipline,
        },
      };
    }

    onComplete({
      entry: completedEntry,
      ...(nextCybernetics ? { cybernetics: nextCybernetics } : {}),
      ...(nextRangedWeapons ? { rangedWeapons: nextRangedWeapons } : {}),
      ...(nextMeleeWeapons ? { meleeWeapons: nextMeleeWeapons } : {}),
      ...(nextArcheotech ? { archeotech: nextArcheotech } : {}),
      ...(nextInsanity ? { insanity: nextInsanity } : {}),
      ...(additionalTalentEntries.length > 0 ? { additionalTalentEntries } : {}),
    });
  };

  const handleApply = () => {
    if (!canComplete) return;
    if (
      entry.talentId === "purity-of-flesh" &&
      purityStage === "purity" &&
      hasFatalRemovals
    ) {
      setPurityStage("reformed-skin");
      return;
    }
    complete();
  };

  let pickerConfig: AcquisitionPickerConfig | null = null;
  switch (activePicker) {
    case "granted-augmetic":
      pickerConfig = {
        title: "Granted Augmetic",
        options: CYBERNETICS_REFERENCE.map((item) => ({ value: item.id, label: item.name })),
        selected: primaryChoice,
        onSelect: (value) => {
          setPrimaryChoice(value);
          setReplacement("");
          setConcealedWeaponChoice("");
        },
      };
      break;
    case "augmetic-location":
      pickerConfig = {
        title: "Augmetic Location",
        options: selectedLocations,
        selected: replacement,
        onSelect: setReplacement,
      };
      break;
    case "bionic-arm":
      pickerConfig = {
        title: "Existing Bionic Arm",
        options: bionicArms.map((item) => ({ value: item.id, label: item.name })),
        selected: replacement,
        onSelect: setReplacement,
      };
      break;
    case "concealed-weapon":
      pickerConfig = {
        title: "Eligible Weapon",
        options: eligibleConcealedWeapons,
        selected: concealedWeaponChoice,
        onSelect: setConcealedWeaponChoice,
      };
      break;
    case "heretek-talent":
      pickerConfig = {
        title: "Granted Talent",
        options: HERETEK_TALENTS.map(([value, label]) => ({ value, label, owned: ownsTalent(value) })),
        selected: secondaryChoice,
        onSelect: setSecondaryChoice,
      };
      break;
    case "pleasure-talent":
      pickerConfig = {
        title: "Granted Talent",
        options: pleasureTalents.map(([value, label]) => ({ value, label, owned: ownsTalent(value) })),
        selected: primaryChoice,
        onSelect: setPrimaryChoice,
      };
      break;
    case "melee-training":
      pickerConfig = {
        title: "Melee Weapon Training",
        options: MELEE_OPTIONS.map((item) => ({
          value: item.id,
          label: item.label,
          owned: ownedTraining.has(item.id),
        })),
        selected: primaryChoice,
        onSelect: setPrimaryChoice,
      };
      break;
    case "homeworld":
      pickerConfig = {
        title: "Another Home World",
        options: homeworldOptions.map((item) => ({ value: item.id, label: item.name })),
        selected: primaryChoice,
        onSelect: (value) => {
          setPrimaryChoice(value);
          setHomeworldTraitChoices(undefined);
          if (homeworldNeedsTraitAcquisition(value)) {
            setShowHomeworldTraitAcquisition(true);
          }
        },
      };
      break;
    case "peer-group":
      pickerConfig = {
        title: "Peer Group",
        options: PEER_OPTIONS.map((option) => ({
          value: option,
          label: option,
          owned: ownsTalent("peer", option),
        })),
        selected: primaryChoice,
        onSelect: setPrimaryChoice,
      };
      break;
    case "toughness-loss":
      pickerConfig = {
        title: "Permanent Toughness Loss",
        options: [1, 2, 3, 4, 5].map(String),
        selected: String(toughnessLoss),
        onSelect: (value) => setToughnessLoss(Number(value)),
      };
      break;
    case "reformed-skin-cause":
      pickerConfig = {
        title: "Cause of Replacement",
        options: [
          { value: "purity", label: "Purity of Flesh" },
          { value: "critical", label: "Critical Damage" },
        ],
        selected: primaryChoice,
        onSelect: setPrimaryChoice,
      };
      break;
    case "discipline":
      pickerConfig = {
        title: "Discipline",
        options: psyRatingUsesNewDiscipline ? newDisciplineOptions : knownDisciplineOptions,
        selected: primaryChoice,
        onSelect: setPrimaryChoice,
      };
      break;
    case "power-grant":
      pickerConfig = {
        title: "Power Grant",
        options: [
          ...(knownDisciplineOptions.length > 0
            ? [{ value: "existing", label: `Known Discipline: ${halfWillpowerBonus} powers` }]
            : []),
          ...(newDisciplineOptions.length > 0
            ? [{ value: "new", label: "New Discipline: 1 power" }]
            : []),
        ],
        selected: secondaryChoice,
        onSelect: (value) => {
          setSecondaryChoice(value);
          setPrimaryChoice("");
        },
      };
      break;
  }

  if (pickerConfig) {
    return (
      <OptionPickerScreen
        title={pickerConfig.title}
        options={pickerConfig.options}
        selected={pickerConfig.selected}
        onSelect={(value) => {
          pickerConfig?.onSelect(value);
          setActivePicker(null);
        }}
        onClose={() => setActivePicker(null)}
      />
    );
  }

  if (showHomeworldTraitAcquisition && primaryChoice) {
    return (
      <HomeworldTraitAcquisitionModal
        homeworldId={primaryChoice}
        onComplete={(choices) => {
          setHomeworldTraitChoices(choices);
          setShowHomeworldTraitAcquisition(false);
        }}
        onClose={() => {
          setShowHomeworldTraitAcquisition(false);
          setActivePicker("homeworld");
        }}
      />
    );
  }

  if (showFatalRemovalPicker) {
    return (
      <PickerModal
        title="Life-Critical Removals"
        closeLabel={<ArrowLeft />}
        closeAriaLabel="Back"
        placeholder="Search installed items…"
        query={fatalRemovalQuery}
        onQueryChange={setFatalRemovalQuery}
        onClose={() => setShowFatalRemovalPicker(false)}
        isEmpty={filteredFatalRemovalItems.length === 0}
        maxWidth="max-w-lg"
        footer={
          <Button fullWidth onClick={() => setShowFatalRemovalPicker(false)}>
            Done ({fatalRemovalItems.length} selected)
          </Button>
        }
      >
        <div className="space-y-2 p-3 lg:p-4">
          {filteredFatalRemovalItems.map((item) => {
            const selected = fatalRemovalKeys.includes(item.key);
            return (
              <PickerRow
                key={item.key}
                card
                selected={selected}
                aria-pressed={selected}
                onClick={() => setFatalRemovalKeys((current) =>
                  current.includes(item.key)
                    ? current.filter((key) => key !== item.key)
                    : [...current, item.key]
                )}
                className="rounded-lg border border-slate-600"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className={uiTextBody}>{item.name}</p>
                    <p className={uiTextSubtle}>{item.kind}</p>
                  </div>
                  {selected && <Chip size="sm" className={colourAmberFaint}>Life-critical</Chip>}
                </div>
              </PickerRow>
            );
          })}
        </div>
      </PickerModal>
    );
  }

  return (
    <PickerModal
      title={title}
      query=""
      onQueryChange={() => undefined}
      onClose={onClose}
      closeLabel={<ArrowLeft />}
      closeAriaLabel="Back"
      isEmpty={false}
      hideSearch
      maxWidth="max-w-lg"
      scrollPositionRef={acquisitionScrollPositionRef}
      footer={
        <div className="space-y-2">
          {!canComplete && <RequiredFieldsNote />}
          <Button fullWidth onClick={handleApply} disabled={!canComplete}>
            {entry.talentId === "purity-of-flesh" && purityStage === "purity" && hasFatalRemovals
              ? "Continue to Reformed Skin"
              : "Apply and add Talent"}
          </Button>
        </div>
      }
    >
      <PickerBody>
        {entry.talentId === "cult-briefing" && entry.specialisation === "Heretek" && (
          <>
            <PickerField
              id="cult-briefing-augmetic"
              label="Granted Augmetic"
              value={selectedCybernetic?.name}
              placeholder="Choose augmetic to receive…"
              onClick={() => setActivePicker("granted-augmetic")}
              required
            />
            {selectedLocations.length > 0 && (
              <PickerField
                id="cult-briefing-augmetic-location"
                label="Augmetic Location"
                value={selectedLocations.find((item) => item.value === replacement)?.label}
                placeholder="Choose location…"
                onClick={() => setActivePicker("augmetic-location")}
                required
              />
            )}
            {selectingConcealedWeapon && (
              <>
                <PickerField
                  id="cult-briefing-bionic-arm"
                  label="Existing Bionic Arm"
                  value={bionicArms.find((item) => item.id === replacement)?.name}
                  placeholder="Choose existing Bionic Arm…"
                  onClick={() => setActivePicker("bionic-arm")}
                  disabled={bionicArms.length === 0}
                  required
                />
                {bionicArms.length === 0 && <p className={uiTextError}>Install a Bionic Arm first.</p>}
                <PickerField
                  id="cult-briefing-concealed-weapon"
                  label="Eligible Weapon"
                  value={eligibleConcealedWeapons.find((item) => item.value === concealedWeaponChoice)?.label}
                  placeholder="Choose eligible weapon…"
                  onClick={() => setActivePicker("concealed-weapon")}
                  disabled={eligibleConcealedWeapons.length === 0}
                  required
                />
                {eligibleConcealedWeapons.length === 0 && <p className={uiTextError}>Add an unmodified pistol or one-handed melee weapon first.</p>}
              </>
            )}
            <PickerField
              id="cult-briefing-granted-talent"
              label="Granted Talent"
              value={HERETEK_TALENTS.find(([id]) => id === secondaryChoice)?.[1]}
              placeholder="Choose Talent…"
              onClick={() => setActivePicker("heretek-talent")}
              required
            />
            <p className={`text-sm ${uiTextBody}`}>Tech-Use will also count as Trained.</p>
          </>
        )}

        {entry.talentId === "cult-briefing" && entry.specialisation === "Pleasure" && (
          <PickerField
            id="cult-briefing-pleasure-talent"
            label="Granted Talent"
            value={pleasureTalents.find(([id]) => id === primaryChoice)?.[1]}
            placeholder="Choose granted Talent…"
            onClick={() => setActivePicker("pleasure-talent")}
            required
          />
        )}

        {entry.talentId === "cult-briefing" && entry.specialisation === "Blood" && (
          <PickerField
            id="cult-briefing-melee-training"
            label="Melee Weapon Training"
            value={MELEE_OPTIONS.find((item) => item.id === primaryChoice)?.label}
            placeholder="Choose Melee Weapon Training…"
            onClick={() => setActivePicker("melee-training")}
            required
          />
        )}

        {entry.talentId === "cult-briefing" && entry.specialisation === "Culture" && (
          <PickerField
            id="cult-briefing-homeworld"
            label="Another Home World"
            value={homeworldOptions.find((item) => item.id === primaryChoice)?.name}
            placeholder="Choose another Home World…"
            onClick={() => setActivePicker("homeworld")}
            disabled={homeworldOptions.length === 0}
            required
          />
        )}

        {entry.talentId === "sicarius-tutoring" && entry.specialisation === "Guardsman" && (
          <input className={editableInputClass(true)} value={primaryChoice} onChange={(event) => setPrimaryChoice(event.target.value)} placeholder="Exotic weapon name…" />
        )}

        {entry.talentId === "sicarius-tutoring" && entry.specialisation === "Scum" && (
          <PickerField
            id="sicarius-peer-group"
            label="Peer Group"
            value={primaryChoice}
            placeholder="Choose Peer group…"
            onClick={() => setActivePicker("peer-group")}
            required
          />
        )}

        {entry.talentId === "touched-by-the-fates" && (
          <label className={`flex items-start gap-3 text-sm ${uiTextBody}`}>
            <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
            <span>Set this NPC’s Fate Points to {Math.ceil(willpowerBonus / 2)} (half Willpower Bonus {willpowerBonus}, rounded up).</span>
          </label>
        )}

        {entry.talentId === "purity-of-flesh" && purityStage === "purity" && (
          <>
            <p className={`text-sm ${uiTextBody}`}>
              All {purityInventory.length} installed cybernetics, bionics, and integrated weapons will be removed.
            </p>
            {purityInventory.length === 0 ? (
              <p className={`text-sm ${uiTextPlaceholder}`}>No removable items are currently installed.</p>
            ) : (
              <div className="space-y-2 rounded border border-slate-700 p-3">
                {purityInventory.map((item) => (
                  <div key={item.key} className="flex items-start justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className={uiTextBody}>{item.name}</p>
                      <p className={uiTextSubtle}>{item.kind}</p>
                    </div>
                    <Chip
                      size="sm"
                      className={`shrink-0 ${item.qualifiesForFate ? colourAmberFaint : colourInactive}`}
                    >
                      {item.qualifiesForFate ? "Qualifies for Fate" : "Removed — no Fate"}
                    </Chip>
                  </div>
                ))}
              </div>
            )}
            <ResultRow label="Fate Points Gained:" value={purityFatePoints} />
            <PickerField
              id="purity-life-critical-removals"
              label="Life-Critical Removals"
              value={fatalRemovalItems.length > 0 ? `${fatalRemovalItems.length} selected` : ""}
              placeholder="None selected"
              onClick={() => setShowFatalRemovalPicker(true)}
            />
            {hasFatalRemovals && (
              <>
                <PickerField
                  id="purity-toughness-loss"
                  label="Permanent Toughness Loss (1d5)"
                  value={String(toughnessLoss)}
                  placeholder="Choose rolled loss…"
                  onClick={() => setActivePicker("toughness-loss")}
                  required
                />
                <ResultRow label="Wounds Lost:" value={1} />
              </>
            )}
          </>
        )}

        {entry.talentId === "purity-of-flesh" && purityStage === "reformed-skin" && (
          <>
            <p className={`text-sm ${uiTextBody}`}>
              Record one immediate Reformed Skin replacement for each life-critical removal.
            </p>
            {fatalRemovalItems.map((item) => (
              <div key={item.key} className="space-y-1.5 rounded border border-slate-700 p-3">
                <label className={uiFormLabel}>{item.name}</label>
                <input
                  className={editableInputClass(true)}
                  value={fatalReplacements[item.key] ?? ""}
                  onChange={(event) => setFatalReplacements((current) => ({
                    ...current,
                    [item.key]: event.target.value,
                  }))}
                  placeholder="Replacement limb, organ, or system…"
                />
              </div>
            ))}
            <Button fullWidth variant="ghost" onClick={() => setPurityStage("purity")}>
              Back to Purity of Flesh
            </Button>
          </>
        )}

        {entry.talentId === "reformed-skin" && (
          <>
            <PickerField
              id="reformed-skin-cause"
              label="Cause of Replacement"
              value={primaryChoice === "purity"
                ? "Purity of Flesh"
                : primaryChoice === "critical"
                  ? "Critical Damage"
                  : ""}
              placeholder="Choose cause…"
              onClick={() => setActivePicker("reformed-skin-cause")}
              required
            />
            {primaryChoice === "purity" && (
              <p className={`text-sm ${uiTextBody}`}>
                All Fate Points gained from Purity of Flesh will be lost.
              </p>
            )}
          </>
        )}

        {entry.talentId === "rite-of-pure-thought" && (
          <>
            <p className={`text-sm ${uiTextBody}`}>Select only disorders the GM says are no longer relevant. Each must be replaced at the same severity.</p>
            {disorders.length === 0 && <p className={`text-sm ${uiTextPlaceholder}`}>No structured disorders are currently recorded.</p>}
            {disorders.map((disorder) => {
              const selected = removedDisorderIds.includes(disorder.id);
              return (
                <div key={disorder.id} className="space-y-2 rounded border border-slate-700 p-3">
                  <label className={`flex items-center gap-3 text-sm ${uiTextBody}`}>
                    <input type="checkbox" checked={selected} onChange={(event) => setRemovedDisorderIds((current) => event.target.checked ? [...current, disorder.id] : current.filter((id) => id !== disorder.id))} />
                    <span>{disorder.name} ({disorder.severity})</span>
                  </label>
                  {selected && <input className={editableInputClass(true)} value={replacementDisorders[disorder.id] ?? ""} onChange={(event) => setReplacementDisorders((current) => ({ ...current, [disorder.id]: event.target.value }))} placeholder={`Replacement ${disorder.severity} disorder…`} />}
                </div>
              );
            })}
            <label className={`flex items-start gap-3 text-sm ${uiTextBody}`}>
              <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
              <span>The GM has reviewed these changes.</span>
            </label>
          </>
        )}

        {/^psy-rating-[3-6]$/.test(entry.talentId) && (
          <>
            {entry.talentId !== "psy-rating-3" && (
              <PickerField
                id="psy-rating-power-grant"
                label="Power Grant"
                value={secondaryChoice === "existing"
                  ? `Known Discipline: ${halfWillpowerBonus} powers`
                  : secondaryChoice === "new"
                    ? "New Discipline: 1 power"
                    : ""}
                placeholder="Choose route…"
                onClick={() => setActivePicker("power-grant")}
                required
              />
            )}
            <PickerField
              id="psy-rating-discipline"
              label="Discipline"
              value={primaryChoice}
              placeholder={entry.talentId === "psy-rating-3" || secondaryChoice
                ? "Choose Discipline…"
                : "Choose a power grant first"}
              onClick={() => setActivePicker("discipline")}
              disabled={entry.talentId !== "psy-rating-3" && !secondaryChoice}
              required
            />
            <ResultRow label="Willpower Bonus Recorded:" value={willpowerBonus} />
            <ResultRow label="Minor Powers Granted:" value={psyRatingMinorGrants} />
            <ResultRow label="Major Powers Granted:" value={psyRatingMajorGrants} />
          </>
        )}
      </PickerBody>
    </PickerModal>
  );
}
