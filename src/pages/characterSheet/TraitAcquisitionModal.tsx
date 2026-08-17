import { useMemo, useState } from "react";
import { DEFAULT_SKILLS } from "../../data/defaultSkills";
import { CYBERNETICS_REFERENCE } from "../../data/reference/cyberneticsReference";
import { GEAR_REFERENCE } from "../../data/reference/gearReference";
import type { TraitData } from "../../data/traitData";
import { SANCTIONING_RESULTS } from "../../features/traits/sanctioningReference";
import { notesForSanctioning } from "../../features/traits/traitEffects";
import { InfoModal } from "../../components/InfoModal";
import type {
  ArmourLocationKey,
  CyberneticItem,
  GearItem,
  SanctioningAcquisition,
  TalentEntry,
} from "../../types/Character";
import { Button } from "../../ui/Button";
import { Chip } from "../../ui/Chip";
import { RequiredFieldsNote } from "../../ui/CustomFormFooter";
import { editableInputClass, uiFormLabel, uiInfoModalWrapper, uiItemName, uiTextBody, uiTextLabel } from "../../ui/editableStyles";
import { OptionPickerScreen, type PickerOption } from "../../ui/OptionPickerScreen";
import { PickerBody, PickerModal, PickerRow } from "../../ui/PickerModal";
import { PickerField } from "../../ui/PickerField";
import { RollChip } from "../../ui/RollChip";
import { sanitizePositiveIntegerInput } from "../../utils/formInput";

export interface TraitAcquisitionResult {
  entry: TalentEntry;
  cybernetics?: CyberneticItem[];
  gear?: GearItem[];
}

const CHARACTERISTICS: readonly { value: string; label: string }[] = [
  ["ws", "Weapon Skill"], ["bs", "Ballistic Skill"], ["s", "Strength"],
  ["t", "Toughness"], ["ag", "Agility"], ["int", "Intelligence"],
  ["per", "Perception"], ["wp", "Willpower"], ["fel", "Fellowship"],
].map(([value, label]) => ({ value, label }));

const SOUL_CONSEQUENCES: readonly { value: string; label: string }[] = [
  { value: "insanity", label: "Gain 1d10 Insanity Points" },
  { value: "blindness", label: "Permanent loss of sight" },
  { value: "characteristic", label: "Lose 1d10 from one Characteristic" },
  { value: "mutation", label: "Random mutation" },
];

type PickerKind = "soul-consequence" | "characteristic" | "sanctioning" | "skin-kind" | "skin-cybernetic" | "skin-upgrade" | "skin-location";

function requiredRollRange(resultId: string): { min: number; max: number; label: string } | null {
  if (resultId === "reconstructed-skull") return { min: 5, max: 50, label: "Throne Gelt gained (5d10)" };
  if (resultId === "hunted") return { min: 1, max: 10, label: "Insanity Points gained (1d10)" };
  if (["unlovely-memories", "the-horror"].includes(resultId)) return { min: 1, max: 5, label: "Insanity Points gained (1d5)" };
  return null;
}

export function TraitAcquisitionModal({
  trait,
  entry,
  cybernetics,
  gear = [],
  ownedTraitEntries = [],
  onComplete,
  onClose,
}: {
  trait: TraitData;
  entry: TalentEntry;
  cybernetics: CyberneticItem[];
  gear?: GearItem[];
  ownedTraitEntries?: TalentEntry[];
  onComplete: (result: TraitAcquisitionResult) => void;
  onClose: () => void;
}) {
  const [picker, setPicker] = useState<PickerKind | null>(null);
  const [entity, setEntity] = useState("");
  const [consequence, setConsequence] = useState("");
  const [characteristic, setCharacteristic] = useState("");
  const [rolledValue, setRolledValue] = useState("");
  const [mutationName, setMutationName] = useState("");
  const [blankSkills, setBlankSkills] = useState<string[]>([]);
  const [sanctionResultId, setSanctionResultId] = useState("");
  const [ageIncrease, setAgeIncrease] = useState("");
  const [skinCyberneticId, setSkinCyberneticId] = useState("");
  const [skinKind, setSkinKind] = useState<"new" | "upgrade">(
    ownedTraitEntries.length === 0 ? "new" : "new"
  );
  const [skinLocation, setSkinLocation] = useState<ArmourLocationKey | "">("");

  const eligibleBlankSkills = useMemo(
    () => DEFAULT_SKILLS.filter((skill) => ["Common Lore", "Forbidden Lore", "Scholastic Lore", "Trade"].includes(skill.category)),
    []
  );
  const selectedSanction = SANCTIONING_RESULTS.find((result) => result.id === sanctionResultId);
  const sanctionRange = requiredRollRange(sanctionResultId);
  const selectedCybernetic = CYBERNETICS_REFERENCE.find((item) => item.id === skinCyberneticId);
  const skinRank = ([1, 3, 5, 7] as const)[Math.min(ownedTraitEntries.length, 3)];
  const upgradeCandidates = cybernetics.filter((item) => item.craftsmanship !== "Good");
  const selectedUpgrade = upgradeCandidates.find((item) => item.id === skinCyberneticId);

  if (picker === "soul-consequence") {
    return <OptionPickerScreen title="Binding Consequence" options={SOUL_CONSEQUENCES} selected={consequence} onSelect={(value) => { setConsequence(value); setPicker(null); }} onClose={() => setPicker(null)} />;
  }
  if (picker === "characteristic") {
    return <OptionPickerScreen title="Characteristic" options={CHARACTERISTICS} selected={characteristic} onSelect={(value) => { setCharacteristic(value); setPicker(null); }} onClose={() => setPicker(null)} />;
  }
  if (picker === "sanctioning") {
    return (
      <PickerModal title="Sanctioning Side Effect" query="" onQueryChange={() => undefined} onClose={() => setPicker(null)} hideSearch isEmpty={false}>
        <PickerBody>
          {SANCTIONING_RESULTS.map((result) => (
            <PickerRow
              key={result.id}
              onClick={() => { setSanctionResultId(result.id); setRolledValue(""); setPicker(null); }}
              selected={result.id === sanctionResultId}
            >
              <span className={`${uiItemName} group-hover:text-white`}>{result.name}</span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <RollChip>{result.roll}</RollChip>
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className={uiTextLabel}>Rules</span>
                <span onClick={(event) => event.stopPropagation()} className={uiInfoModalWrapper}>
                  <InfoModal title={result.name} content={result.effect} as="span" />
                </span>
              </div>
            </PickerRow>
          ))}
        </PickerBody>
      </PickerModal>
    );
  }
  if (picker === "skin-kind") {
    return <OptionPickerScreen title={`Rank ${skinRank} Benefit`} options={[{ value: "new", label: "Gain a new Common cybernetic" }, { value: "upgrade", label: "Upgrade an existing cybernetic to Good" }]} selected={skinKind} onSelect={(value) => { setSkinKind(value as "new" | "upgrade"); setSkinCyberneticId(""); setSkinLocation(""); setPicker(null); }} onClose={() => setPicker(null)} />;
  }
  if (picker === "skin-cybernetic") {
    return <OptionPickerScreen title="Common Cybernetic" options={CYBERNETICS_REFERENCE.map((item) => ({ value: item.id, label: item.name }))} selected={skinCyberneticId} onSelect={(value) => { setSkinCyberneticId(value); setSkinLocation(""); setPicker(null); }} onClose={() => setPicker(null)} />;
  }
  if (picker === "skin-upgrade") {
    return <OptionPickerScreen title="Cybernetic to Upgrade" options={upgradeCandidates.map((item) => ({ value: item.id, label: `${item.name} (${item.craftsmanship})` }))} selected={skinCyberneticId} onSelect={(value) => { setSkinCyberneticId(value); setPicker(null); }} onClose={() => setPicker(null)} />;
  }
  if (picker === "skin-location" && selectedCybernetic?.requiresLocation) {
    const options: PickerOption[] = selectedCybernetic.requiresLocation === "arm"
      ? [{ value: "leftArm", label: "Left Arm" }, { value: "rightArm", label: "Right Arm" }]
      : [{ value: "leftLeg", label: "Left Leg" }, { value: "rightLeg", label: "Right Leg" }];
    return <OptionPickerScreen title="Body Location" options={options} selected={skinLocation} onSelect={(value) => { setSkinLocation(value as ArmourLocationKey); setPicker(null); }} onClose={() => setPicker(null)} />;
  }

  if (trait.acquisition === "blank-slate") {
    const canSubmit = blankSkills.length === 3;
    return (
      <PickerModal title="Blank Slate Imprinting" query="" onQueryChange={() => undefined} onClose={onClose} hideSearch isEmpty={false}>
        <PickerBody>
          <div className="space-y-3">
            <p className={uiTextBody}>Choose exactly three Lore or Trade Skills. The selected Skills count as Trained and gain +10 while this imprint remains active.</p>
            <div className="space-y-2">
              {eligibleBlankSkills.map((skill) => {
                const selected = blankSkills.includes(skill.id);
                return (
                  <PickerRow key={skill.id} card interactive onClick={() => setBlankSkills((current) => selected ? current.filter((id) => id !== skill.id) : current.length < 3 ? [...current, skill.id] : current)}>
                    <span className="flex-1">{skill.name}</span>
                    {selected && <Chip>Selected</Chip>}
                  </PickerRow>
                );
              })}
            </div>
            {!canSubmit && <RequiredFieldsNote />}
            <Button fullWidth disabled={!canSubmit} onClick={() => onComplete({ entry: { ...entry, notes: `Imprinted Skills: ${blankSkills.map((id) => DEFAULT_SKILLS.find((skill) => skill.id === id)?.name).join(", ")}.`, acquisition: { ...entry.acquisition, trait: { blankSlateSkillIds: blankSkills } } } })}>Apply and add Trait</Button>
          </div>
        </PickerBody>
      </PickerModal>
    );
  }

  if (trait.acquisition === "soul-bound") {
    const roll = Number(rolledValue);
    const rollRequired = consequence === "insanity" || consequence === "characteristic";
    const canSubmit = entity.trim().length > 0 && !!consequence && (!rollRequired || (Number.isInteger(roll) && roll >= 1 && roll <= 10)) && (consequence !== "characteristic" || !!characteristic) && (consequence !== "mutation" || mutationName.trim().length > 0);
    return (
      <PickerModal title="Soul-bound Acquisition" query="" onQueryChange={() => undefined} onClose={onClose} hideSearch isEmpty={false} maxWidth="max-w-lg">
        <PickerBody><div className="space-y-3">
          <div><label htmlFor="soul-bound-entity" className={uiFormLabel}>Bound entity <span className="text-red-500">*</span></label><input id="soul-bound-entity" value={entity} onChange={(event) => setEntity(event.target.value)} placeholder="Enter entity…" className={`${editableInputClass(true)} mt-0.5`} /></div>
          <PickerField id="soul-bound-consequence" label="Permanent consequence" value={SOUL_CONSEQUENCES.find((option) => option.value === consequence)?.label ?? ""} placeholder="Choose consequence…" required onClick={() => setPicker("soul-consequence")} />
          {consequence === "characteristic" && <PickerField id="soul-bound-characteristic" label="Characteristic" value={CHARACTERISTICS.find((option) => option.value === characteristic)?.label ?? ""} placeholder="Choose Characteristic…" required onClick={() => setPicker("characteristic")} />}
          {rollRequired && <div><label htmlFor="soul-bound-roll" className={uiFormLabel}>Rolled result (1d10) <span className="text-red-500">*</span></label><input id="soul-bound-roll" type="text" inputMode="numeric" value={rolledValue} onChange={(event) => setRolledValue(sanitizePositiveIntegerInput(event.target.value))} placeholder="1–10" className={`${editableInputClass(true)} mt-0.5`} /></div>}
          {consequence === "mutation" && <div><label htmlFor="soul-bound-mutation" className={uiFormLabel}>Mutation <span className="text-red-500">*</span></label><input id="soul-bound-mutation" value={mutationName} onChange={(event) => setMutationName(event.target.value)} placeholder="Enter mutation…" className={`${editableInputClass(true)} mt-0.5`} /></div>}
          {!canSubmit && <RequiredFieldsNote />}
          <Button fullWidth disabled={!canSubmit} onClick={() => onComplete({ entry: { ...entry, notes: `Bound to ${entity.trim()}; ${SOUL_CONSEQUENCES.find((option) => option.value === consequence)?.label}.`, acquisition: { ...entry.acquisition, trait: { soulBound: { entity: entity.trim(), consequence: consequence as "insanity" | "blindness" | "characteristic" | "mutation", ...(characteristic ? { characteristic: characteristic as "ws" } : {}), ...(rollRequired ? { rolledValue: roll } : {}), ...(mutationName.trim() ? { mutationName: mutationName.trim() } : {}) } } } } })}>Apply and add Trait</Button>
        </div></PickerBody>
      </PickerModal>
    );
  }

  if (trait.acquisition === "sanctioned-psyker") {
    const roll = Number(rolledValue);
    const age = Number(ageIncrease);
    const rollValid = !sanctionRange || (Number.isInteger(roll) && roll >= sanctionRange.min && roll <= sanctionRange.max);
    const canSubmit = !!selectedSanction && Number.isInteger(age) && age >= 3 && age <= 30 && rollValid;
    return (
      <PickerModal title="Sanctioned Psyker Acquisition" query="" onQueryChange={() => undefined} onClose={onClose} hideSearch isEmpty={false} maxWidth="max-w-lg">
        <PickerBody><div className="space-y-3">
          <PickerField id="sanctioning-result" label="Sanctioning side effect" value={selectedSanction ? `${selectedSanction.roll} — ${selectedSanction.name}` : ""} placeholder="Choose result…" required onClick={() => setPicker("sanctioning")} />
          {sanctionRange && <div><label htmlFor="sanction-roll" className={uiFormLabel}>{sanctionRange.label} <span className="text-red-500">*</span></label><input id="sanction-roll" type="text" inputMode="numeric" value={rolledValue} onChange={(event) => setRolledValue(sanitizePositiveIntegerInput(event.target.value))} placeholder={`${sanctionRange.min}–${sanctionRange.max}`} className={`${editableInputClass(true)} mt-0.5`} /></div>}
          <div><label htmlFor="sanction-age" className={uiFormLabel}>Starting age increase (3d10) <span className="text-red-500">*</span></label><input id="sanction-age" type="text" inputMode="numeric" value={ageIncrease} onChange={(event) => setAgeIncrease(sanitizePositiveIntegerInput(event.target.value))} placeholder="3–30" className={`${editableInputClass(true)} mt-0.5`} /></div>
          {!canSubmit && <RequiredFieldsNote />}
          <Button fullWidth disabled={!canSubmit} onClick={() => {
            if (!selectedSanction) return;
            const sanctioning: SanctioningAcquisition = { resultId: selectedSanction.id, resultName: selectedSanction.name, ageIncrease: age, ...(sanctionRange && sanctionResultId === "reconstructed-skull" ? { thronesGained: roll } : sanctionRange ? { rolledValue: roll } : {}) };
            const senseRef = CYBERNETICS_REFERENCE.find((item) => item.id === "cr-cybernetic-senses");
            const addedSense = sanctionResultId === "optical-rupture" && senseRef ? [{ id: crypto.randomUUID(), referenceId: senseRef.id, name: senseRef.name, craftsmanship: "Common" as const, value: senseRef.value, availability: senseRef.availability, source: senseRef.source, notes: "Eyes replaced through Sanctioned Psyker (Optical Rupture).", grantedByTalentEntryUid: entry.uid, grantedByTalentName: "Sanctioned Psyker" }] : [];
            const gearRefId = sanctionResultId === "dental-probes" ? "cr-carven-dentures" : sanctionResultId === "throne-wed" ? "cr-chattallium-ring" : null;
            const gearRef = gearRefId ? GEAR_REFERENCE.find((item) => item.id === gearRefId) : undefined;
            const addedGear = gearRef ? [{ id: crypto.randomUUID(), referenceId: gearRef.id, name: gearRef.name, description: gearRef.description, weight: gearRef.weight, value: gearRef.value, availability: gearRef.availability, source: gearRef.source, grantedByTalentEntryUid: entry.uid, grantedByTalentName: "Sanctioned Psyker" }] : [];
            onComplete({
              entry: { ...entry, notes: notesForSanctioning(sanctioning), acquisition: { ...entry.acquisition, trait: { sanctioning } } },
              cybernetics: [
                ...cybernetics.filter((item) => item.grantedByTalentEntryUid !== entry.uid),
                ...addedSense,
              ],
              gear: [
                ...gear.filter((item) => item.grantedByTalentEntryUid !== entry.uid),
                ...addedGear,
              ],
            });
          }}>Apply and add Trait</Button>
        </div></PickerBody>
      </PickerModal>
    );
  }

  const canSubmitSkin = skinKind === "upgrade"
    ? !!selectedUpgrade
    : !!selectedCybernetic && (!selectedCybernetic.requiresLocation || !!skinLocation);
  return (
    <PickerModal title={`Skin of Iron — Rank ${skinRank}`} query="" onQueryChange={() => undefined} onClose={onClose} hideSearch isEmpty={false} maxWidth="max-w-lg">
      <PickerBody><div className="space-y-3">
        {ownedTraitEntries.length === 0 ? (
          <p className={uiTextBody}>Choose the Common-Quality cybernetic gained when this Trait is acquired.</p>
        ) : (
          <PickerField id="skin-kind" label={`Rank ${skinRank} benefit`} value={skinKind === "new" ? "Gain a new Common cybernetic" : "Upgrade an existing cybernetic to Good"} placeholder="Choose benefit…" required onClick={() => setPicker("skin-kind")} />
        )}
        {skinKind === "new" ? (
          <>
            <PickerField id="skin-cybernetic" label="Cybernetic" value={selectedCybernetic?.name ?? ""} placeholder="Choose cybernetic…" required onClick={() => setPicker("skin-cybernetic")} />
            {selectedCybernetic?.requiresLocation && <PickerField id="skin-location" label="Body location" value={skinLocation ? skinLocation.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase()) : ""} placeholder="Choose location…" required onClick={() => setPicker("skin-location")} />}
          </>
        ) : (
          <>
            <PickerField id="skin-upgrade" label="Cybernetic to upgrade" value={selectedUpgrade ? `${selectedUpgrade.name} (${selectedUpgrade.craftsmanship})` : ""} placeholder="Choose installed cybernetic…" required onClick={() => setPicker("skin-upgrade")} disabled={upgradeCandidates.length === 0} />
            {upgradeCandidates.length === 0 && <p className="text-sm text-red-400">No installed Poor or Common cybernetic can be upgraded.</p>}
          </>
        )}
        {!canSubmitSkin && <RequiredFieldsNote />}
        <Button fullWidth disabled={!canSubmitSkin} onClick={() => {
          if (skinKind === "upgrade") {
            if (!selectedUpgrade) return;
            onComplete({
              entry: { ...entry, notes: `${selectedUpgrade.name} upgraded from ${selectedUpgrade.craftsmanship} to Good.`, acquisition: { ...entry.acquisition, trait: { skinOfIronGrants: [{ rank: skinRank, kind: "upgrade", cyberneticId: selectedUpgrade.id, cyberneticReferenceId: selectedUpgrade.referenceId, previousCraftsmanship: selectedUpgrade.craftsmanship }] } } },
              cybernetics: cybernetics.map((item) => item.id === selectedUpgrade.id ? { ...item, craftsmanship: "Good" } : item),
            });
            return;
          }
          if (!selectedCybernetic) return;
          const item: CyberneticItem = { id: crypto.randomUUID(), referenceId: selectedCybernetic.id, name: selectedCybernetic.name, craftsmanship: "Common", value: selectedCybernetic.value, availability: selectedCybernetic.availability, source: selectedCybernetic.source, ...(skinLocation ? { bodyLocation: [skinLocation] } : {}), grantedByTalentEntryUid: entry.uid, grantedByTalentName: "Skin of Iron" };
          onComplete({ entry: { ...entry, notes: `Common ${selectedCybernetic.name} gained at Rank ${skinRank}.`, acquisition: { ...entry.acquisition, trait: { skinOfIronGrants: [{ rank: skinRank, kind: "new", cyberneticId: item.id, cyberneticReferenceId: selectedCybernetic.id }] } } }, cybernetics: [...cybernetics, item] });
        }}>Apply and add Trait</Button>
      </div></PickerBody>
    </PickerModal>
  );
}
