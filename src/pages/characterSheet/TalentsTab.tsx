// src/pages/characterSheet/TalentsTab.tsx

import { useCallback, useMemo, useState } from "react";
import type {
  TalentsAndTraitsBlock,
  TalentEntry,
  WeaponTrainingBlock,
  WeaponTrainingTalentId,
} from "../../types/Character";
import { TALENT_LIST } from "../../data/talentData";
import { WEAPON_TRAINING_GROUPS } from "../../data/weaponTrainingData";
import { editableInputClass, sectionContainerClass, uiSectionHeader } from "../../ui/editableStyles";
import { EntryCard, EntrySection, TalentPickerModal } from "./talentComponents";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TalentsTabProps {
  talents: TalentsAndTraitsBlock;
  weaponTraining: WeaponTrainingBlock;
  editable: boolean;
  onUpdateTalents: (next: TalentsAndTraitsBlock) => void;
  onUpdateTraining: (next: WeaponTrainingBlock) => void;
}

// ─── Faith Talent constants ───────────────────────────────────────────────────

const FAITH_GROUP_LABELS: Record<string, string> = {
  sign:  "Emperor's Sign",
  mercy: "Emperor's Mercy",
  wrath: "Emperor's Wrath",
};

const FAITH_GROUP_ORDER = ["mercy", "sign", "wrath"] as const;

const REGULAR_TALENT_LIST = TALENT_LIST.filter((t) => !t.faithGroup);
const FAITH_TALENT_LIST   = TALENT_LIST.filter((t) => !!t.faithGroup);
const FAITH_TALENT_IDS    = new Set(FAITH_TALENT_LIST.map((t) => t.id));

function getFaithGroup(talentId: string): string | undefined {
  return FAITH_TALENT_LIST.find((t) => t.id === talentId)?.faithGroup;
}

// ─── FaithTalentSection ───────────────────────────────────────────────────────

function FaithTalentSection({
  entries,
  editable,
  onAdd,
  onRemove,
}: {
  entries: TalentEntry[];
  editable: boolean;
  onAdd: (entry: TalentEntry) => void;
  onRemove: (uid: string) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);

  const selectedIds = useMemo(
    () => new Set(entries.map((e) => e.talentId)),
    [entries]
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className={uiSectionHeader}>Faith Talents</h3>
        <span className="text-xs text-slate-500">
          {entries.length} {entries.length === 1 ? "talent" : "faith talents"}
        </span>
      </div>

      <section className={sectionContainerClass(editable) + " space-y-4"}>
      {FAITH_GROUP_ORDER.map((group) => {
        const groupEntries = entries.filter((e) => getFaithGroup(e.talentId) === group);
        return (
          <div key={group}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-100 mb-1.5">
              {FAITH_GROUP_LABELS[group]}
            </p>
            {groupEntries.length === 0 && (
              <p className="text-sm text-slate-500 italic">None.</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {groupEntries.map((entry) => (
                <EntryCard
                  key={entry.uid}
                  entry={entry}
                  editable={editable}
                  onRemove={onRemove}
                />
              ))}
            </div>
          </div>
        );
      })}

      <button
        onClick={() => setShowPicker(true)}
        className="mt-1 px-3 py-1 text-xs rounded border border-slate-600 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
      >
        {editable ? "+ Add Faith Talent" : "View Faith Talents"}
      </button>

      {showPicker && (
        <TalentPickerModal
          title="Add Faith Talent"
          listData={FAITH_TALENT_LIST}
          selectedIds={selectedIds}
          editable={editable}
          onAdd={onAdd}
          onClose={() => setShowPicker(false)}
        />
      )}
      </section>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function TalentsTab({
  talents,
  weaponTraining,
  editable,
  onUpdateTalents,
  onUpdateTraining,
}: TalentsTabProps) {
  // ── Talents ──
  const handleAddTalent = useCallback(
    (entry: TalentEntry) => {
      onUpdateTalents({ ...talents, talents: [...talents.talents, entry] });
    },
    [talents, onUpdateTalents]
  );

  const handleRemoveTalent = useCallback(
    (uid: string) => {
      onUpdateTalents({
        ...talents,
        talents: talents.talents.filter((t) => t.uid !== uid),
      });
    },
    [talents, onUpdateTalents]
  );

  // ── Weapon Training ──
  const handleToggleTraining = useCallback(
    (id: WeaponTrainingTalentId) => {
      if (!editable) return;
      const current = weaponTraining.trained;
      const next = current.includes(id)
        ? current.filter((t) => t !== id)
        : [...current, id];
      onUpdateTraining({ ...weaponTraining, trained: next });
    },
    [editable, weaponTraining, onUpdateTraining]
  );

  const [newExotic, setNewExotic] = useState("");

  const handleAddExotic = useCallback(() => {
    if (!newExotic.trim()) return;
    onUpdateTraining({
      ...weaponTraining,
      exoticWeapons: [...weaponTraining.exoticWeapons, newExotic.trim()],
    });
    setNewExotic("");
  }, [newExotic, weaponTraining, onUpdateTraining]);

  const handleRemoveExotic = useCallback((index: number) => {
    onUpdateTraining({
      ...weaponTraining,
      exoticWeapons: weaponTraining.exoticWeapons.filter((_, i) => i !== index),
    });
  }, [weaponTraining, onUpdateTraining]);

  return (
    <div className="space-y-8">
      {/* TALENTS */}
      <EntrySection
        title="Talents"
        singular="Talent"
        entries={talents.talents.filter((e) => !FAITH_TALENT_IDS.has(e.talentId))}
        listData={REGULAR_TALENT_LIST}
        editable={editable}
        onAdd={handleAddTalent}
        onRemove={handleRemoveTalent}
      />

      {/* FAITH TALENTS */}
      <FaithTalentSection
        entries={talents.talents.filter((e) => FAITH_TALENT_IDS.has(e.talentId))}
        editable={editable}
        onAdd={handleAddTalent}
        onRemove={handleRemoveTalent}
      />

      {/* WEAPON TRAINING */}
      <div>
      <h3 className={`${uiSectionHeader} mb-3`}>Weapon Training</h3>
      <section className={sectionContainerClass(editable) + " space-y-4"}>

        {WEAPON_TRAINING_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-100 mb-1.5">
              {group.label}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {group.items.map(({ id, display }) => {
                const active = weaponTraining.trained.includes(
                  id as WeaponTrainingTalentId
                );
                return (
                  <button
                    key={id}
                    disabled={!editable}
                    onClick={() => handleToggleTraining(id as WeaponTrainingTalentId)}
                    aria-pressed={active}
                    className={`px-2.5 py-1 rounded border text-xs transition ${
                      active
                        ? "bg-amber-500 border-amber-400 text-slate-900 font-semibold"
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

        {/* Exotic Weapon Training */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-100 mb-1.5">
            Exotic Weapon Training
          </p>

          {weaponTraining.exoticWeapons.length === 0 && !editable && (
            <p className="text-sm text-slate-500 italic">None.</p>
          )}

          <div className="space-y-1.5 mb-2">
            {weaponTraining.exoticWeapons.map((weapon, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded border border-slate-500 bg-slate-900/60 px-3 py-1.5 text-sm"
              >
                <span className="text-slate-200">{weapon}</span>
                {editable && (
                  <button
                    onClick={() => handleRemoveExotic(index)}
                    aria-label={`Remove ${weapon}`}
                    className="text-slate-500 hover:text-red-400 transition text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {editable && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newExotic}
                onChange={(e) => setNewExotic(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddExotic(); }}
                placeholder="e.g. Needle Pistol"
                className={editableInputClass(true) + " flex-1"}
              />
              <button
                onClick={handleAddExotic}
                disabled={!newExotic.trim()}
                className="px-3 py-1 text-sm rounded border border-amber-500 bg-amber-600 text-white hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Add
              </button>
            </div>
          )}
        </div>
      </section>
      </div>
    </div>
  );
}
