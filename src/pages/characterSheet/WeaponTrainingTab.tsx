// src/pages/characterSheet/WeaponTrainingTab.tsx

import { useState, useCallback } from "react";
import type { TalentsAndTraitsBlock, WeaponTrainingBlock, WeaponTrainingTalentId } from "../../types/Character";
import { WEAPON_TRAINING_GROUPS } from "../../data/weaponTrainingData";
import { Button } from "../../ui/Button";
import { AddButton } from "../../ui/AddButton";
import { editableInputClass, uiFormLabel, uiTextPlaceholder } from "../../ui/editableStyles";
import { uiDismissButton } from "../../ui/buttonStyles";
import { ModalHeader } from "../../ui/ModalHeader";
import { ModalShell } from "../../ui/ModalShell";
import { CloseIcon } from "../../ui/CloseButton";
import {
  colourActiveOutlineTeal,
  colourActiveOutlineViolet,
  colourActiveOutlineOrange,
  colourActiveOutlineSky,
  colourActiveOutlineAmber,
  colourOutlineFuchsia,
} from "../../ui/colourTokens";
import {
  getGrantedExoticWeapons,
  getGrantedWeaponTrainingIds,
} from "../../features/talents/talentEffects";

interface WeaponTrainingTabProps {
  weaponTraining: WeaponTrainingBlock;
  editable: boolean;
  onUpdate: (next: WeaponTrainingBlock) => void;
  talents?: TalentsAndTraitsBlock;
  career?: string;
}

const GROUP_ACTIVE_STYLE: Record<string, string> = {
  "Basic Weapon Training": colourActiveOutlineTeal,
  "Heavy Weapon Training": colourActiveOutlineViolet,
  "Melee Weapon Training": colourActiveOutlineOrange,
  "Pistol Training": colourActiveOutlineSky,
  "Thrown Weapon Training": colourActiveOutlineAmber,
};

export function WeaponTrainingTab({ weaponTraining, editable, onUpdate, talents, career }: WeaponTrainingTabProps) {
  const [newExotic, setNewExotic] = useState("");
  const [showExoticModal, setShowExoticModal] = useState(false);
  const grantedTraining = talents ? getGrantedWeaponTrainingIds(talents, career) : [];
  const grantedExotics = talents ? getGrantedExoticWeapons(talents) : [];

  const handleToggleTraining = useCallback(
    (id: WeaponTrainingTalentId) => {
      if (!editable) return;
      const current = weaponTraining.trained;
      const next = current.includes(id) ? current.filter((t) => t !== id) : [...current, id];
      onUpdate({ ...weaponTraining, trained: next });
    },
    [editable, weaponTraining, onUpdate]
  );

  const handleAddExotic = useCallback(() => {
    if (!newExotic.trim()) return;
    onUpdate({
      ...weaponTraining,
      exoticWeapons: [...weaponTraining.exoticWeapons, newExotic.trim()],
    });
    setNewExotic("");
  }, [newExotic, weaponTraining, onUpdate]);

  const handleRemoveExotic = useCallback(
    (index: number) => {
      onUpdate({
        ...weaponTraining,
        exoticWeapons: weaponTraining.exoticWeapons.filter((_, i) => i !== index),
      });
    },
    [weaponTraining, onUpdate]
  );

  const closeModal = useCallback(() => {
    setNewExotic("");
    setShowExoticModal(false);
  }, []);

  return (
    <div className="space-y-6 text-center">
      {WEAPON_TRAINING_GROUPS.map((group) => (
        <div key={group.label}>
          <p className={`${uiFormLabel} mb-1.5`}>
            {group.label}
          </p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {group.items.map(({ id, display }) => {
              const trainingId = id as WeaponTrainingTalentId;
              const granted = grantedTraining.includes(trainingId);
              const active = weaponTraining.trained.includes(trainingId) || granted;
              return (
                <button type="button"
                  key={id}
                  disabled={!editable || granted}
                  onClick={() => handleToggleTraining(trainingId)}
                  aria-pressed={active}
                  title={granted ? "Granted by Cult Briefing (Blood)" : undefined}
                  className={`px-2.5 lg:px-3 py-1 lg:py-1.5 rounded border text-xs lg:text-sm transition ${
                    active
                      ? GROUP_ACTIVE_STYLE[group.label]
                      : editable
                        ? "border-slate-500 text-slate-100 hover:bg-slate-800"
                        : "border-slate-700 text-slate-500 opacity-60 cursor-not-allowed"
                  }`}
                >
                  {display}
                </button>
              );
            })}
          </div>
          {group.items.some((item) => grantedTraining.includes(item.id)) && (
            <p className="mt-1 text-xs text-amber-300">
              Granted by Cult Briefing (Blood): {group.items.filter((item) => grantedTraining.includes(item.id)).map((item) => item.display).join(", ")}
            </p>
          )}
        </div>
      ))}

      <div>
        <p className={`${uiFormLabel} mb-1.5`}>
          <span className="relative">
            Exotic Weapon Training
            {editable && (
              <AddButton
                label="Add Exotic Weapon"
                onClick={() => setShowExoticModal(true)}
                className="absolute left-full ml-2 top-1/2 -translate-y-1/2 -mt-px"
              />
            )}
          </span>
        </p>

        {weaponTraining.exoticWeapons.length === 0 && !editable && (
          <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>None.</p>
        )}

        <div className="flex flex-wrap justify-center gap-1.5 max-w-xl mx-auto">
          {[...weaponTraining.exoticWeapons, ...grantedExotics].map((weapon, index) => {
            const granted = index >= weaponTraining.exoticWeapons.length;
            return (
            <span
              key={`${granted ? "granted" : "owned"}:${index}:${weapon}`}
              title={granted ? "Granted by Sicarius Tutoring (Guardsman)" : undefined}
              className={`inline-flex items-center gap-2.5 lg:gap-3 px-2.5 lg:px-3 py-1 lg:py-1.5 rounded border text-xs lg:text-sm ${colourOutlineFuchsia}`}
            >
              {weapon}
              {editable && !granted && (
                <button type="button"
                  onClick={() => handleRemoveExotic(index)}
                  aria-label={`Remove ${weapon}`}
                  className={uiDismissButton}
                >
                  <CloseIcon />
                </button>
              )}
            </span>
            );
          })}
        </div>
        {grantedExotics.length > 0 && (
          <p className="mt-1 text-xs text-amber-300">Granted by Sicarius Tutoring (Guardsman)</p>
        )}
      </div>

      {showExoticModal && (
        <ModalShell
          ariaLabel="Add Exotic Weapon"
          onClose={closeModal}
          className="max-w-sm overflow-y-auto"
        >
          <ModalHeader title="Add Exotic Weapon" onClose={closeModal} />
          <div className="p-5 space-y-4">
            <input
              autoFocus
              type="text"
              value={newExotic}
              onChange={(e) => setNewExotic(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newExotic.trim()) { handleAddExotic(); setShowExoticModal(false); }
              }}
              placeholder="e.g. Needle Pistol"
              className={editableInputClass(true)}
            />
            <Button
              size="sm"
              fullWidth
              onClick={() => { handleAddExotic(); setShowExoticModal(false); }}
              disabled={!newExotic.trim()}
            >
              + Add Exotic
            </Button>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
