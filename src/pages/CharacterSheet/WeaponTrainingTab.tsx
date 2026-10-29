// src/pages/CharacterSheet/WeaponTrainingTab.tsx

import { useState, useCallback } from "react";
import type {
  AlternateRankSelection,
  TalentsAndTraitsBlock,
  WeaponTrainingBlock,
  WeaponTrainingExoticEntry,
  WeaponTrainingTalentId,
  XpPurchaseRecord,
} from "../../types/Character";
import {
  getExoticWeaponTrainingPurchases,
  getWeaponTrainingPurchase,
  makeCurrentRankPurchase,
  WEAPON_TRAINING_GROUPS,
  isPistolOnlyExoticWeaponTraining,
  type ExoticWeaponTrainingPurchase,
} from "shared-rules";
import {
  MELEE_WEAPON_REFERENCE,
  RANGED_WEAPON_REFERENCE,
} from "../../data/reference/weaponReference";
import type { PatchOptions } from "../../hooks/useOptimisticOverlay";
import { uiChipRow, uiStackPage } from "../../ui/styles/editableStyles";
import { sanitizeNonNegativeIntegerInput } from "../../utils/formInput";
import { canConfirmManualCostPurchase } from "../../utils/dmGatedPurchase";
import {
  getGrantedExoticWeapons,
  getGrantedWeaponTrainingIds,
} from "../../mechanics/talents/talentEffects";
import { colourAmberPlain } from "../../ui/styles/colourTokens";
import { GlowChip, type GlowChipColour } from "../../ui/chips/GlowChip";
import { ExoticCustomWeaponButton } from "./ExoticCustomWeaponButton";
import { OptionPickerScreen } from "../../ui/pickers/OptionPickerScreen";
import { XpCostForm } from "../../ui/forms/XpCostForm";
import { FormLabel } from "../../ui/forms/FormLabel";
import { ConfirmModal } from "../../ui/modals/ConfirmModal";
import { RemoveEntryModal } from "../../ui/modals/RemoveEntryModal";

const EXOTIC_WEAPON_TRAINING_OPTIONS = Array.from(
  new Set(
    [...RANGED_WEAPON_REFERENCE, ...MELEE_WEAPON_REFERENCE]
      .filter((weapon) => weapon.type === "Exotic")
      .map((weapon) => weapon.exoticTraining)
      .filter((name): name is string => Boolean(name))
  )
).sort((a, b) => a.localeCompare(b));

const WEAPON_TRAINING_GROUP_COLOUR: Record<string, GlowChipColour> = {
  "Basic Weapon Training": "teal",
  "Heavy Weapon Training": "violet",
  "Melee Weapon Training": "orange",
  "Pistol Training": "sky",
  "Thrown Weapon Training": "amber",
};

interface WeaponTrainingTabProps {
  weaponTraining: WeaponTrainingBlock;
  editable: boolean;
  onUpdate: (next: WeaponTrainingBlock, options?: PatchOptions) => void | Promise<boolean | void>;
  talents?: TalentsAndTraitsBlock;
  career?: string;
  rank?: string;
  alternateRanks?: readonly AlternateRankSelection[];
  isDM?: boolean;
}

interface PendingTrain {
  id: WeaponTrainingTalentId;
  display: string;
  group: string;
}

export function WeaponTrainingTab({
  weaponTraining,
  editable,
  onUpdate,
  talents,
  career,
  rank,
  alternateRanks = [],
  isDM = false,
}: WeaponTrainingTabProps) {
  const [pendingTrain, setPendingTrain] = useState<
    (PendingTrain & { purchase: XpPurchaseRecord }) | null
  >(null);
  const [pendingManualTrain, setPendingManualTrain] = useState<PendingTrain | null>(null);
  const [manualTrainCost, setManualTrainCost] = useState("");
  const [pendingRemoveTraining, setPendingRemoveTraining] = useState<PendingTrain | null>(null);
  const [pendingRemoveExotic, setPendingRemoveExotic] = useState<{
    index: number;
    name: string;
  } | null>(null);
  const [pendingExoticPurchase, setPendingExoticPurchase] =
    useState<ExoticWeaponTrainingPurchase | null>(null);

  const [showExoticPicker, setShowExoticPicker] = useState(false);
  const [showExoticForm, setShowExoticForm] = useState(false);
  const [newExoticName, setNewExoticName] = useState("");
  const [newExoticCost, setNewExoticCost] = useState("");

  const grantedTraining = talents ? getGrantedWeaponTrainingIds(talents, career) : [];
  const grantedExotics = talents ? getGrantedExoticWeapons(talents) : [];
  const hasKnaveOfPistols = alternateRanks.some(
    (selection) => selection.alternateRankId === "metallican-gunslinger"
  );
  const ownedExoticNames = new Set(
    [...weaponTraining.exoticWeapons.map((entry) => entry.name), ...grantedExotics].map((name) =>
      name.trim().toLocaleLowerCase()
    )
  );
  const careerExoticPurchases = getExoticWeaponTrainingPurchases(
    career,
    rank,
    alternateRanks
  ).filter((entry) => !ownedExoticNames.has(entry.name.toLocaleLowerCase()));

  const handleRemoveTraining = useCallback(
    (id: WeaponTrainingTalentId) => {
      const xpPurchases = { ...weaponTraining.xpPurchases };
      const manualCosts = { ...weaponTraining.manualCosts };
      const eliteAdvancePurchases = { ...weaponTraining.eliteAdvancePurchases };
      delete xpPurchases[id];
      delete manualCosts[id];
      delete eliteAdvancePurchases[id];
      return onUpdate({
        ...weaponTraining,
        trained: weaponTraining.trained.filter((t) => t !== id),
        xpPurchases: Object.keys(xpPurchases).length > 0 ? xpPurchases : undefined,
        manualCosts: Object.keys(manualCosts).length > 0 ? manualCosts : undefined,
        eliteAdvancePurchases:
          Object.keys(eliteAdvancePurchases).length > 0 ? eliteAdvancePurchases : undefined,
      });
    },
    [weaponTraining, onUpdate]
  );

  const confirmTrain = useCallback(async () => {
    if (!pendingTrain) return;
    const saved = await onUpdate({
      ...weaponTraining,
      trained: [...weaponTraining.trained, pendingTrain.id],
      xpPurchases: {
        ...weaponTraining.xpPurchases,
        [pendingTrain.id]: pendingTrain.purchase,
      },
    });
    if (saved !== false) setPendingTrain(null);
  }, [pendingTrain, weaponTraining, onUpdate, setPendingTrain]);

  const manualTrainCostNumber = Number(manualTrainCost);
  const canConfirmManualTrain = manualTrainCost.trim() !== "";

  const confirmManualTrain = useCallback(async () => {
    if (!pendingManualTrain || !canConfirmManualTrain) return;
    const saved = await onUpdate({
      ...weaponTraining,
      trained: [...weaponTraining.trained, pendingManualTrain.id],
      manualCosts: {
        ...weaponTraining.manualCosts,
        [pendingManualTrain.id]: manualTrainCostNumber,
      },
      xpPurchases: {
        ...weaponTraining.xpPurchases,
        [pendingManualTrain.id]: makeCurrentRankPurchase(career, rank, manualTrainCostNumber),
      },
    });
    if (saved === false) return;
    setPendingManualTrain(null);
    setManualTrainCost("");
  }, [
    pendingManualTrain,
    canConfirmManualTrain,
    manualTrainCostNumber,
    weaponTraining,
    career,
    rank,
    onUpdate,
    setPendingManualTrain,
    setManualTrainCost,
  ]);

  const availableExoticOptions = hasKnaveOfPistols
    ? EXOTIC_WEAPON_TRAINING_OPTIONS.filter(isPistolOnlyExoticWeaponTraining)
    : EXOTIC_WEAPON_TRAINING_OPTIONS;
  const canConfirmExotic =
    newExoticName.trim() !== "" &&
    newExoticCost.trim() !== "" &&
    (!hasKnaveOfPistols || isPistolOnlyExoticWeaponTraining(newExoticName));

  const closeExoticForm = useCallback(() => {
    setShowExoticForm(false);
    setNewExoticName("");
    setNewExoticCost("");
  }, [setShowExoticForm, setNewExoticName, setNewExoticCost]);

  const confirmAddExotic = useCallback(async () => {
    if (!canConfirmExotic) return;
    const entry: WeaponTrainingExoticEntry = {
      name: newExoticName.trim(),
      cost: Number(newExoticCost),
      xpPurchase: makeCurrentRankPurchase(career, rank, Number(newExoticCost)),
      bonus: true,
    };
    const saved = await onUpdate({
      ...weaponTraining,
      exoticWeapons: [...weaponTraining.exoticWeapons, entry],
    });
    if (saved !== false) closeExoticForm();
  }, [
    canConfirmExotic,
    newExoticName,
    newExoticCost,
    weaponTraining,
    career,
    rank,
    onUpdate,
    closeExoticForm,
  ]);

  const handleRemoveExotic = useCallback(
    (index: number) => {
      return onUpdate({
        ...weaponTraining,
        exoticWeapons: weaponTraining.exoticWeapons.filter((_, i) => i !== index),
      });
    },
    [weaponTraining, onUpdate]
  );

  const confirmExoticPurchase = useCallback(async () => {
    if (!pendingExoticPurchase) return;
    const entry: WeaponTrainingExoticEntry = {
      name: pendingExoticPurchase.name,
      cost: pendingExoticPurchase.purchase.cost,
      xpPurchase: pendingExoticPurchase.purchase,
    };
    const saved = await onUpdate({
      ...weaponTraining,
      exoticWeapons: [...weaponTraining.exoticWeapons, entry],
    });
    if (saved !== false) setPendingExoticPurchase(null);
  }, [pendingExoticPurchase, weaponTraining, onUpdate, setPendingExoticPurchase]);

  return (
    <div className={`${uiStackPage} text-center`}>
      {WEAPON_TRAINING_GROUPS.map((group) => (
        <fieldset key={group.label}>
          <FormLabel as="legend" className="block w-full mb-1.5">
            {group.label}
          </FormLabel>
          <div className={`${uiChipRow} justify-center`}>
            {group.items.map(({ id, display }) => {
              const trainingId = id as WeaponTrainingTalentId;
              const granted = grantedTraining.includes(trainingId);
              const owned = weaponTraining.trained.includes(trainingId);
              const active = owned || granted;
              const purchase = active
                ? undefined
                : getWeaponTrainingPurchase(career, rank, trainingId, alternateRanks);
              const cost = purchase?.cost;
              const pulsing = !active && purchase !== undefined;
              const restrictedByKnaveOfPistols =
                hasKnaveOfPistols &&
                !active &&
                (trainingId.startsWith("basic-") || trainingId.startsWith("heavy-"));
              const clickable =
                editable &&
                !granted &&
                !restrictedByKnaveOfPistols &&
                (active || purchase !== undefined || canConfirmManualCostPurchase(isDM));

              const handleClick = () => {
                if (!clickable) return;
                if (owned) {
                  setPendingRemoveTraining({ id: trainingId, display, group: group.label });
                  return;
                }
                if (purchase) {
                  setPendingTrain({ id: trainingId, display, group: group.label, purchase });
                  return;
                }
                setPendingManualTrain({ id: trainingId, display, group: group.label });
              };

              return (
                <GlowChip
                  as="button"
                  key={id}
                  active={active}
                  colour={WEAPON_TRAINING_GROUP_COLOUR[group.label]}
                  pulsing={pulsing}
                  disabled={!clickable}
                  onClick={handleClick}
                  aria-pressed={active}
                  aria-label={`${display}${typeof cost === "number" ? `, ${cost} XP` : ""}`}
                >
                  {display}
                </GlowChip>
              );
            })}
          </div>
          {group.items.some((item) => grantedTraining.includes(item.id)) && (
            <p className={`mt-1 text-xs ${colourAmberPlain}`}>
              Granted by a Talent, Trait, or Career effect:{" "}
              {group.items
                .filter((item) => grantedTraining.includes(item.id))
                .map((item) => item.display)
                .join(", ")}
            </p>
          )}
          {hasKnaveOfPistols &&
            (group.label === "Basic Weapon Training" ||
              group.label === "Heavy Weapon Training") && (
              <p className={`mt-1 text-xs ${colourAmberPlain}`}>
                Knave of Pistols prevents acquiring new training in this group.
              </p>
            )}
        </fieldset>
      ))}

      <fieldset>
        <FormLabel as="legend" className="block w-full mb-1.5">
          Exotic Weapon Training
        </FormLabel>

        <div className={`${uiChipRow} justify-center items-center max-w-xl mx-auto`}>
          {weaponTraining.exoticWeapons.map((weapon, index) => (
            <GlowChip
              as="button"
              key={`owned:${index}:${weapon.name}`}
              active
              colour="fuchsia"
              disabled={!editable}
              onClick={() => setPendingRemoveExotic({ index, name: weapon.name })}
              aria-label={`Remove ${weapon.name}`}
            >
              {weapon.name}
            </GlowChip>
          ))}
          {grantedExotics.map((weapon, index) => (
            <GlowChip key={`granted:${index}:${weapon}`} active colour="fuchsia">
              {weapon}
            </GlowChip>
          ))}
          {careerExoticPurchases.map((entry) => (
            <GlowChip
              as="button"
              key={`available:${entry.name}`}
              active={false}
              colour="fuchsia"
              pulsing
              disabled={!editable}
              onClick={() => setPendingExoticPurchase(entry)}
              aria-pressed="false"
              aria-label={`${entry.name}, ${entry.purchase.cost} XP`}
            >
              {entry.name}
            </GlowChip>
          ))}
          {isDM && <ExoticCustomWeaponButton onClick={() => setShowExoticPicker(true)} />}
        </div>
        {grantedExotics.length > 0 && (
          <p className={`mt-1 text-xs ${colourAmberPlain}`}>
            Granted by Sicarius Tutoring (Guardsman)
          </p>
        )}
      </fieldset>

      {pendingTrain && (
        <ConfirmModal
          title="Train Weapon Group"
          message={`Train ${pendingTrain.group} (${pendingTrain.display}) for ${pendingTrain.purchase.cost} XP?`}
          confirmLabel="Train"
          onConfirm={confirmTrain}
          onCancel={() => setPendingTrain(null)}
        />
      )}

      {pendingManualTrain && (
        <XpCostForm
          title={`Train ${pendingManualTrain.group} (${pendingManualTrain.display})`}
          submitLabel="Train"
          cost={manualTrainCost}
          onCostChange={(value) => setManualTrainCost(sanitizeNonNegativeIntegerInput(value))}
          canSubmit={canConfirmManualTrain}
          onClose={() => setPendingManualTrain(null)}
          onSubmit={confirmManualTrain}
        />
      )}

      {pendingRemoveTraining && (
        <RemoveEntryModal
          kind="Weapon Training"
          name={`${pendingRemoveTraining.group} (${pendingRemoveTraining.display})`}
          onRemove={() => handleRemoveTraining(pendingRemoveTraining.id)}
          onCancel={() => setPendingRemoveTraining(null)}
        />
      )}

      {pendingRemoveExotic && (
        <RemoveEntryModal
          kind="Exotic Weapon"
          name={pendingRemoveExotic.name}
          onRemove={() => handleRemoveExotic(pendingRemoveExotic.index)}
          onCancel={() => setPendingRemoveExotic(null)}
        />
      )}

      {pendingExoticPurchase && (
        <ConfirmModal
          title="Train Exotic Weapon"
          message={`Train Exotic Weapon Training (${pendingExoticPurchase.name}) for ${pendingExoticPurchase.purchase.cost} XP?`}
          confirmLabel="Train"
          onConfirm={confirmExoticPurchase}
          onCancel={() => setPendingExoticPurchase(null)}
        />
      )}

      {showExoticPicker && (
        <OptionPickerScreen
          title="Exotic Weapon Training"
          options={availableExoticOptions}
          selected={newExoticName}
          onSelect={(value) => {
            setNewExoticName(value);
            setShowExoticPicker(false);
            setShowExoticForm(true);
          }}
          onClose={() => setShowExoticPicker(false)}
        />
      )}

      {showExoticForm && (
        <XpCostForm
          title={`Add ${newExoticName}`}
          submitLabel="Add Exotic"
          showBack
          cost={newExoticCost}
          onCostChange={(value) => setNewExoticCost(sanitizeNonNegativeIntegerInput(value))}
          canSubmit={canConfirmExotic}
          onClose={closeExoticForm}
          onSubmit={confirmAddExotic}
        >
          {hasKnaveOfPistols && (
            <p className={`text-xs ${colourAmberPlain}`}>
              Knave of Pistols limits this list to pistol-only specialisations.
            </p>
          )}
        </XpCostForm>
      )}
    </div>
  );
}
