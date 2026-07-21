// src/pages/characterSheet/WeaponTrainingTab.tsx

import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { WeaponTrainingBlock, WeaponTrainingTalentId } from "../../types/Character";
import { WEAPON_TRAINING_GROUPS } from "../../data/weaponTrainingData";
import { Button } from "../../ui/Button";
import { CloseButton } from "../../ui/CloseButton";
import { editableInputClass, uiFormLabel, uiTextPlaceholder } from "../../ui/editableStyles";
import { uiDismissButton } from "../../ui/buttonStyles";
import {
  colourActiveOutlineTeal,
  colourActiveOutlineViolet,
  colourActiveOutlineOrange,
  colourActiveOutlineSky,
  colourActiveOutlineAmber,
  colourOutlineFuchsia,
} from "../../ui/colourTokens";

interface WeaponTrainingTabProps {
  weaponTraining: WeaponTrainingBlock;
  editable: boolean;
  onUpdate: (next: WeaponTrainingBlock) => void;
}

const GROUP_ACTIVE_STYLE: Record<string, string> = {
  "Basic Weapon Training": colourActiveOutlineTeal,
  "Heavy Weapon Training": colourActiveOutlineViolet,
  "Melee Weapon Training": colourActiveOutlineOrange,
  "Pistol Training": colourActiveOutlineSky,
  "Thrown Weapon Training": colourActiveOutlineAmber,
};

export function WeaponTrainingTab({ weaponTraining, editable, onUpdate }: WeaponTrainingTabProps) {
  const [newExotic, setNewExotic] = useState("");
  const [showExoticModal, setShowExoticModal] = useState(false);

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

  const dialogRef = useRef<HTMLDialogElement | null>(null);
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    d.showModal();
    return () => { if (d.open) d.close(); };
  }, [showExoticModal]);

  return (
    <div className="space-y-6 text-center">
      {WEAPON_TRAINING_GROUPS.map((group) => (
        <div key={group.label}>
          <p className={`${uiFormLabel} mb-1.5`}>
            {group.label}
          </p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {group.items.map(({ id, display }) => {
              const active = weaponTraining.trained.includes(id as WeaponTrainingTalentId);
              return (
                <button
                  key={id}
                  disabled={!editable}
                  onClick={() => handleToggleTraining(id as WeaponTrainingTalentId)}
                  aria-pressed={active}
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
        </div>
      ))}

      <div>
        <p className={`${uiFormLabel} mb-1.5`}>
          <span className="relative">
            Exotic Weapon Training
            {editable && (
              <Button
                size="xs"
                onClick={() => setShowExoticModal(true)}
                className="absolute left-full ml-2 top-1/2 -translate-y-1/2 -mt-px"
              >
                + Add
              </Button>
            )}
          </span>
        </p>

        {weaponTraining.exoticWeapons.length === 0 && !editable && (
          <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>None.</p>
        )}

        <div className="flex flex-wrap justify-center gap-1.5 max-w-xl mx-auto">
          {weaponTraining.exoticWeapons.map((weapon, index) => (
            <span
              key={index}
              className={`inline-flex items-center gap-1 px-2.5 lg:px-3 py-1 lg:py-1.5 rounded border text-xs lg:text-sm ${colourOutlineFuchsia}`}
            >
              {weapon}
              {editable && (
                <button
                  onClick={() => handleRemoveExotic(index)}
                  aria-label={`Remove ${weapon}`}
                  className={uiDismissButton}
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      </div>

      {showExoticModal && createPortal(
        <dialog
          ref={dialogRef}
          onClose={closeModal}
          onClick={(e) => { if (e.target === dialogRef.current) closeModal(); }}
          className="m-auto w-[calc(100%-2rem)] max-w-sm bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-5 backdrop:bg-black/50 backdrop:backdrop-blur-sm"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-100">Add Exotic Weapon</span>
              <CloseButton onClick={closeModal} />
            </div>
            <input
              autoFocus
              type="text"
              value={newExotic}
              onChange={(e) => setNewExotic(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newExotic.trim()) { handleAddExotic(); setShowExoticModal(false); }
                if (e.key === "Escape") closeModal();
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
        </dialog>,
        document.body
      )}
    </div>
  );
}
