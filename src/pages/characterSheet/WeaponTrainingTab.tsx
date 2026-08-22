// src/pages/characterSheet/WeaponTrainingTab.tsx

import { useState, useCallback } from "react";
import type {
  TalentsAndTraitsBlock,
  WeaponTrainingBlock,
  WeaponTrainingExoticEntry,
  WeaponTrainingTalentId,
  XpPurchaseRecord,
} from "../../types/Character";
import { WEAPON_TRAINING_GROUPS } from "../../data/weaponTrainingData";
import { Button } from "../../ui/Button";
import { editableInputClass, uiFormLabel, uiTextBody } from "../../ui/editableStyles";
import { PickerBody, PickerModal } from "../../ui/PickerModal";
import { ArrowLeft } from "../../ui/PickerArrows";
import { sanitizeNonNegativeIntegerInput } from "../../utils/formInput";
import { canConfirmManualCostPurchase } from "../../utils/dmGatedPurchase";
import {
  EXOTIC_TRAINING_ACTIVE_STYLE,
  EXOTIC_TRAINING_INACTIVE_STYLE,
  EXOTIC_TRAINING_RGB,
  WEAPON_TRAINING_GROUP_ACTIVE_STYLE,
  WEAPON_TRAINING_GROUP_INACTIVE_STYLE,
  WEAPON_TRAINING_GROUP_RGB,
  weaponTrainingPulseVars,
} from "./weaponTrainingStyles";
import {
  getGrantedExoticWeapons,
  getGrantedWeaponTrainingIds,
} from "../../features/talents/talentEffects";
import {
  getUnlockedExoticWeaponSlots,
  getWeaponTrainingPurchase,
} from "../../features/experience/weaponTrainingAdvanceCosts";
import { makeCurrentRankPurchase } from "../../features/experience/purchaseAttribution";

interface WeaponTrainingTabProps {
  weaponTraining: WeaponTrainingBlock;
  editable: boolean;
  onUpdate: (next: WeaponTrainingBlock) => void;
  talents?: TalentsAndTraitsBlock;
  career?: string;
  rank?: string;
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
  isDM = false,
}: WeaponTrainingTabProps) {
  const [pendingTrain, setPendingTrain] = useState<
    (PendingTrain & { purchase: XpPurchaseRecord }) | null
  >(null);
  const [pendingManualTrain, setPendingManualTrain] = useState<PendingTrain | null>(null);
  const [manualTrainCost, setManualTrainCost] = useState("");
  const [pendingRemoveTraining, setPendingRemoveTraining] = useState<PendingTrain | null>(null);
  const [pendingRemoveExotic, setPendingRemoveExotic] = useState<{ index: number; name: string } | null>(null);

  const [showExoticChoice, setShowExoticChoice] = useState(false);
  const [exoticFormMode, setExoticFormMode] = useState<"slot" | "bonus" | null>(null);
  const [newExoticName, setNewExoticName] = useState("");
  const [newExoticCost, setNewExoticCost] = useState("");

  const grantedTraining = talents ? getGrantedWeaponTrainingIds(talents, career) : [];
  const grantedExotics = talents ? getGrantedExoticWeapons(talents) : [];

  const handleRemoveTraining = useCallback(
    (id: WeaponTrainingTalentId) => {
      const xpPurchases = { ...weaponTraining.xpPurchases };
      const manualCosts = { ...weaponTraining.manualCosts };
      delete xpPurchases[id];
      delete manualCosts[id];
      onUpdate({
        ...weaponTraining,
        trained: weaponTraining.trained.filter((t) => t !== id),
        xpPurchases: Object.keys(xpPurchases).length > 0 ? xpPurchases : undefined,
        manualCosts: Object.keys(manualCosts).length > 0 ? manualCosts : undefined,
      });
    },
    [weaponTraining, onUpdate]
  );

  const confirmRemoveTraining = useCallback(() => {
    if (!pendingRemoveTraining) return;
    handleRemoveTraining(pendingRemoveTraining.id);
    setPendingRemoveTraining(null);
  }, [pendingRemoveTraining, handleRemoveTraining]);

  const confirmTrain = useCallback(() => {
    if (!pendingTrain) return;
    onUpdate({
      ...weaponTraining,
      trained: [...weaponTraining.trained, pendingTrain.id],
      xpPurchases: {
        ...weaponTraining.xpPurchases,
        [pendingTrain.id]: pendingTrain.purchase,
      },
    });
    setPendingTrain(null);
  }, [pendingTrain, weaponTraining, onUpdate]);

  const manualTrainCostNumber = Number(manualTrainCost);
  const canConfirmManualTrain = manualTrainCost.trim() !== "";

  const confirmManualTrain = useCallback(() => {
    if (!pendingManualTrain || !canConfirmManualTrain) return;
    onUpdate({
      ...weaponTraining,
      trained: [...weaponTraining.trained, pendingManualTrain.id],
      manualCosts: { ...weaponTraining.manualCosts, [pendingManualTrain.id]: manualTrainCostNumber },
      xpPurchases: {
        ...weaponTraining.xpPurchases,
        [pendingManualTrain.id]: makeCurrentRankPurchase(career, rank, manualTrainCostNumber),
      },
    });
    setPendingManualTrain(null);
    setManualTrainCost("");
  }, [pendingManualTrain, canConfirmManualTrain, manualTrainCostNumber, weaponTraining, career, rank, onUpdate]);

  const nonBonusExoticCount = weaponTraining.exoticWeapons.filter((weapon) => !weapon.bonus).length;
  const unlockedExoticSlots = getUnlockedExoticWeaponSlots(career, rank);
  const hasAvailableExoticSlot = nonBonusExoticCount < unlockedExoticSlots;
  const exoticTriggerClickable = editable && (isDM || hasAvailableExoticSlot);

  const openExoticForm = useCallback((mode: "slot" | "bonus") => {
    setExoticFormMode(mode);
    setShowExoticChoice(false);
  }, []);

  const handleExoticTriggerClick = useCallback(() => {
    if (!editable) return;
    if (hasAvailableExoticSlot && !isDM) {
      openExoticForm("slot");
      return;
    }
    if (hasAvailableExoticSlot && isDM) {
      setShowExoticChoice(true);
      return;
    }
    if (canConfirmManualCostPurchase(isDM)) {
      openExoticForm("bonus");
    }
  }, [editable, isDM, hasAvailableExoticSlot, openExoticForm]);

  const canConfirmExotic = newExoticName.trim() !== "" && newExoticCost.trim() !== "";

  const closeExoticForm = useCallback(() => {
    setExoticFormMode(null);
    setNewExoticName("");
    setNewExoticCost("");
  }, []);

  const confirmAddExotic = useCallback(() => {
    if (!canConfirmExotic || !exoticFormMode) return;
    const entry: WeaponTrainingExoticEntry = {
      name: newExoticName.trim(),
      cost: Number(newExoticCost),
      xpPurchase: makeCurrentRankPurchase(career, rank, Number(newExoticCost)),
      ...(exoticFormMode === "bonus" ? { bonus: true } : {}),
    };
    onUpdate({ ...weaponTraining, exoticWeapons: [...weaponTraining.exoticWeapons, entry] });
    closeExoticForm();
  }, [canConfirmExotic, exoticFormMode, newExoticName, newExoticCost, weaponTraining, career, rank, onUpdate, closeExoticForm]);

  const handleRemoveExotic = useCallback(
    (index: number) => {
      onUpdate({
        ...weaponTraining,
        exoticWeapons: weaponTraining.exoticWeapons.filter((_, i) => i !== index),
      });
    },
    [weaponTraining, onUpdate]
  );

  const confirmRemoveExotic = useCallback(() => {
    if (!pendingRemoveExotic) return;
    handleRemoveExotic(pendingRemoveExotic.index);
    setPendingRemoveExotic(null);
  }, [pendingRemoveExotic, handleRemoveExotic]);

  return (
    <div className="space-y-6 text-center">
      {WEAPON_TRAINING_GROUPS.map((group) => (
        <div key={group.label}>
          <p className={`${uiFormLabel} mb-1.5`}>{group.label}</p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {group.items.map(({ id, display }) => {
              const trainingId = id as WeaponTrainingTalentId;
              const granted = grantedTraining.includes(trainingId);
              const owned = weaponTraining.trained.includes(trainingId);
              const active = owned || granted;
              const purchase = active ? undefined : getWeaponTrainingPurchase(career, rank, trainingId);
              const cost = purchase?.cost;
              const pulsing = !active && purchase !== undefined;
              const clickable = editable && !granted && (active || purchase !== undefined || canConfirmManualCostPurchase(isDM));

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
                <button
                  key={id}
                  type="button"
                  disabled={!clickable}
                  onClick={handleClick}
                  aria-pressed={active}
                  aria-label={`${display}${typeof cost === "number" ? `, ${cost} XP` : ""}`}
                  style={pulsing ? weaponTrainingPulseVars(WEAPON_TRAINING_GROUP_RGB[group.label]) : undefined}
                  className={`px-2.5 lg:px-3 py-1 lg:py-1.5 rounded border text-xs lg:text-sm transition ${
                    pulsing ? "animate-psy-pulse" : ""
                  } ${
                    active
                      ? `${WEAPON_TRAINING_GROUP_ACTIVE_STYLE[group.label]} ${clickable ? "hover:bg-slate-800" : "cursor-not-allowed"}`
                      : `${WEAPON_TRAINING_GROUP_INACTIVE_STYLE[group.label]} ${clickable ? "hover:bg-slate-800" : "cursor-not-allowed"}`
                  }`}
                >
                  {display}
                </button>
              );
            })}
          </div>
          {group.items.some((item) => grantedTraining.includes(item.id)) && (
            <p className="mt-1 text-xs text-amber-300">
              Granted by a Talent, Trait, or Career effect: {group.items.filter((item) => grantedTraining.includes(item.id)).map((item) => item.display).join(", ")}
            </p>
          )}
        </div>
      ))}

      <div>
        <p className={`${uiFormLabel} mb-1.5`}>Exotic Weapon Training</p>

        <div className="flex flex-wrap justify-center items-center gap-1.5 max-w-xl mx-auto">
          {weaponTraining.exoticWeapons.map((weapon, index) => (
            <button
              key={`owned:${index}:${weapon.name}`}
              type="button"
              disabled={!editable}
              onClick={() => setPendingRemoveExotic({ index, name: weapon.name })}
              aria-label={`Remove ${weapon.name}`}
              className={`px-2.5 lg:px-3 py-1 lg:py-1.5 rounded border text-xs lg:text-sm ${EXOTIC_TRAINING_ACTIVE_STYLE} ${
                editable ? "hover:bg-slate-800" : "cursor-not-allowed"
              }`}
            >
              {weapon.name}
            </button>
          ))}
          {grantedExotics.map((weapon, index) => (
            <button
              key={`granted:${index}:${weapon}`}
              type="button"
              disabled
              className={`px-2.5 lg:px-3 py-1 lg:py-1.5 rounded border text-xs lg:text-sm ${EXOTIC_TRAINING_ACTIVE_STYLE} cursor-not-allowed`}
            >
              {weapon}
            </button>
          ))}
          <button
            type="button"
            disabled={!exoticTriggerClickable}
            onClick={handleExoticTriggerClick}
            aria-label="Add Exotic Weapon"
            style={hasAvailableExoticSlot ? weaponTrainingPulseVars(EXOTIC_TRAINING_RGB) : undefined}
            className={`px-2.5 lg:px-3 py-1 lg:py-1.5 min-w-20 rounded border-2 border-dashed text-xs lg:text-sm ${EXOTIC_TRAINING_INACTIVE_STYLE} ${
              hasAvailableExoticSlot ? "animate-psy-pulse" : ""
            } ${exoticTriggerClickable ? "hover:bg-slate-800" : "cursor-not-allowed"}`}
          >
            <span aria-hidden="true">&nbsp;</span>
          </button>
        </div>
        {grantedExotics.length > 0 && (
          <p className="mt-1 text-xs text-amber-300">Granted by Sicarius Tutoring (Guardsman)</p>
        )}
      </div>

      {pendingTrain && (
        <PickerModal
          title="Train Weapon Group"
          query=""
          onQueryChange={() => undefined}
          onClose={() => setPendingTrain(null)}
          isEmpty={false}
          hideSearch
          maxWidth="max-w-sm"
          footer={
            <div className="grid grid-cols-2 gap-2">
              <Button variant="primary" onClick={confirmTrain}>Train</Button>
              <Button variant="ghost" onClick={() => setPendingTrain(null)}>Cancel</Button>
            </div>
          }
        >
          <PickerBody>
            <p className={`text-sm lg:text-base ${uiTextBody} text-center`}>
              Train {pendingTrain.group} ({pendingTrain.display}) for {pendingTrain.purchase.cost} XP?
            </p>
          </PickerBody>
        </PickerModal>
      )}

      {pendingManualTrain && (
        <PickerModal
          title="Train Weapon Group"
          query=""
          onQueryChange={() => undefined}
          onClose={() => setPendingManualTrain(null)}
          isEmpty={false}
          hideSearch
          maxWidth="max-w-sm"
          footer={
            <div className="grid grid-cols-2 gap-2">
              <Button variant="primary" disabled={!canConfirmManualTrain} onClick={confirmManualTrain}>Train</Button>
              <Button variant="ghost" onClick={() => setPendingManualTrain(null)}>Cancel</Button>
            </div>
          }
        >
          <PickerBody>
            <label className={uiFormLabel}>
              XP Cost to train {pendingManualTrain.group} ({pendingManualTrain.display})
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={manualTrainCost}
              onChange={(event) => setManualTrainCost(sanitizeNonNegativeIntegerInput(event.target.value))}
              placeholder="0"
              className={editableInputClass(true) + " mt-0.5"}
            />
          </PickerBody>
        </PickerModal>
      )}

      {pendingRemoveTraining && (
        <PickerModal
          title="Remove Weapon Training"
          query=""
          onQueryChange={() => undefined}
          onClose={() => setPendingRemoveTraining(null)}
          isEmpty={false}
          hideSearch
          maxWidth="max-w-sm"
          footer={
            <div className="grid grid-cols-2 gap-2">
              <Button variant="primary" onClick={confirmRemoveTraining}>Remove</Button>
              <Button variant="ghost" onClick={() => setPendingRemoveTraining(null)}>Cancel</Button>
            </div>
          }
        >
          <PickerBody>
            <p className={`text-sm lg:text-base ${uiTextBody} text-center`}>
              Remove {pendingRemoveTraining.group} ({pendingRemoveTraining.display})?
            </p>
          </PickerBody>
        </PickerModal>
      )}

      {pendingRemoveExotic && (
        <PickerModal
          title="Remove Exotic Weapon"
          query=""
          onQueryChange={() => undefined}
          onClose={() => setPendingRemoveExotic(null)}
          isEmpty={false}
          hideSearch
          maxWidth="max-w-sm"
          footer={
            <div className="grid grid-cols-2 gap-2">
              <Button variant="primary" onClick={confirmRemoveExotic}>Remove</Button>
              <Button variant="ghost" onClick={() => setPendingRemoveExotic(null)}>Cancel</Button>
            </div>
          }
        >
          <PickerBody>
            <p className={`text-sm lg:text-base ${uiTextBody} text-center`}>
              Remove {pendingRemoveExotic.name}?
            </p>
          </PickerBody>
        </PickerModal>
      )}

      {showExoticChoice && (
        <PickerModal
          title="Add Exotic Weapon"
          query=""
          onQueryChange={() => undefined}
          onClose={() => setShowExoticChoice(false)}
          isEmpty={false}
          hideSearch
          maxWidth="max-w-sm"
        >
          <PickerBody>
            <Button className="w-full" onClick={() => openExoticForm("slot")}>
              Use an available training slot
            </Button>
            <Button className="w-full" variant="ghost" onClick={() => openExoticForm("bonus")}>
              Add as a bonus (doesn't use a slot)
            </Button>
          </PickerBody>
        </PickerModal>
      )}

      {exoticFormMode && (
        <PickerModal
          title="Add Exotic Weapon"
          closeLabel={<ArrowLeft />}
          closeAriaLabel="Back"
          query=""
          onQueryChange={() => undefined}
          onClose={closeExoticForm}
          isEmpty={false}
          hideSearch
          maxWidth="max-w-sm"
          footer={
            <Button className="w-full" disabled={!canConfirmExotic} onClick={confirmAddExotic}>
              + Add Exotic
            </Button>
          }
        >
          <PickerBody>
            <label className={uiFormLabel}>Weapon Name</label>
            <input
              autoFocus
              type="text"
              value={newExoticName}
              onChange={(event) => setNewExoticName(event.target.value)}
              placeholder="e.g. Needle Pistol"
              className={editableInputClass(true) + " mt-0.5"}
            />
            <label className={uiFormLabel}>XP Cost</label>
            <input
              type="text"
              inputMode="numeric"
              value={newExoticCost}
              onChange={(event) => setNewExoticCost(sanitizeNonNegativeIntegerInput(event.target.value))}
              placeholder="0"
              className={editableInputClass(true) + " mt-0.5"}
            />
          </PickerBody>
        </PickerModal>
      )}
    </div>
  );
}
