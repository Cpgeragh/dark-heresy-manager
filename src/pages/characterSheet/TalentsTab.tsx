// src/pages/characterSheet/TalentsTab.tsx

import { useCallback, useState } from "react";
import type {
  TalentsAndTraitsBlock,
  TalentEntry,
  WeaponTrainingBlock,
  WeaponTrainingTalentId,
} from "../../types/Character";
import type { TalentData } from "../../data/talentData";
import type { TraitData } from "../../data/traitData";
import { HOMEWORLD_LIST } from "../../data/homeworldData";
import { TALENT_LIST } from "../../data/talentData";
import { TRAIT_LIST } from "../../data/traitData";
import { BOOK_METADATA } from "../../data/bookMetadata";
import { WEAPON_TRAINING_GROUPS } from "../../data/weaponTrainingData";
import type { SkillSource } from "../../types/SkillSource";
import {
  editableInputClass,
  sectionContainerClass,
} from "../../ui/editableStyles";
import { FormField } from "../../components/FormField";
import { Tooltip } from "../../components/Tooltip";
import { TALENT_DESCRIPTIONS } from "../../data/talentDescriptions";
import { TRAIT_DESCRIPTIONS } from "../../data/traitDescriptions";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TalentsTabProps {
  talents: TalentsAndTraitsBlock;
  weaponTraining: WeaponTrainingBlock;
  editable: boolean;
  onUpdateTalents: (next: TalentsAndTraitsBlock) => void;
  onUpdateTraining: (next: WeaponTrainingBlock) => void;
}

type AnyListItem = TalentData | TraitData;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function groupBySource(items: readonly AnyListItem[]): Record<string, AnyListItem[]> {
  return items.reduce<Record<string, AnyListItem[]>>((acc, item) => {
    (acc[item.source] ??= []).push(item);
    return acc;
  }, {});
}

function bookLabel(source: string): string {
  return BOOK_METADATA[source as SkillSource]?.name ?? source;
}

// ─── AddEntryForm ─────────────────────────────────────────────────────────────

interface AddEntryFormProps {
  listData: readonly AnyListItem[];
  singular: string;
  onAdd: (entry: TalentEntry) => void;
  onCancel: () => void;
}

function AddEntryForm({ listData, singular, onAdd, onCancel }: AddEntryFormProps) {
  const [selectedId, setSelectedId] = useState("");
  const [specialisation, setSpecialisation] = useState("");
  const [notes, setNotes] = useState("");

  const selected = listData.find((t) => t.id === selectedId) as
    | (TalentData & TraitData)
    | undefined;
  const grouped = groupBySource(listData);

  const canAdd =
    !!selectedId &&
    (!selected?.hasSpecialisation || specialisation.trim().length > 0);

  const handleAdd = () => {
    if (!selected || !canAdd) return;
    const displayName =
      selected.hasSpecialisation && specialisation.trim()
        ? `${selected.name} (${specialisation.trim()})`
        : selected.name;
    const entry: TalentEntry = {
      uid: crypto.randomUUID(),
      talentId: selected.id,
      name: displayName,
    };
    if (specialisation.trim()) entry.specialisation = specialisation.trim();
    if (notes.trim()) entry.notes = notes.trim();
    onAdd(entry);
    // keep form open for multi-adding — reset selections only
    setSelectedId("");
    setSpecialisation("");
    setNotes("");
  };

  return (
    <div className="rounded border border-amber-700/40 bg-slate-900/60 p-3 space-y-2 mt-2">
      <p className="text-xs font-medium text-amber-400/80">Add {singular}</p>

      <div className="flex flex-wrap gap-2 items-end">
        {/* Selector */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-slate-400 mb-1">Select</label>
          <select
            value={selectedId}
            onChange={(e) => {
              setSelectedId(e.target.value);
              setSpecialisation("");
            }}
            className={editableInputClass(true) + " appearance-none"}
          >
            <option value="">— Choose —</option>
            {Object.entries(grouped).map(([source, items]) => (
              <optgroup key={source} label={bookLabel(source)}>
                {items.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Specialisation input (conditional) */}
        {selected?.hasSpecialisation && (
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs text-slate-400 mb-1">
              {selected.specialisationLabel ?? "Specialisation"}
            </label>
            <input
              type="text"
              value={specialisation}
              onChange={(e) => setSpecialisation(e.target.value)}
              placeholder={selected.specialisationLabel ?? ""}
              className={editableInputClass(true)}
            />
          </div>
        )}
      </div>

      {/* Prerequisites hint */}
      {selected && "prerequisites" in selected && selected.prerequisites && (
        <p className="text-xs text-slate-500">
          Prerequisites: {selected.prerequisites}
        </p>
      )}

      {/* Optional notes */}
      <div>
        <label className="block text-xs text-slate-400 mb-1">Notes (optional)</label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes…"
          className={editableInputClass(true)}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={handleAdd}
          disabled={!canAdd}
          className="px-3 py-1 text-sm rounded border border-amber-500 bg-amber-600 text-white hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Add
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1 text-sm rounded border border-slate-600 text-slate-400 hover:bg-slate-800 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── EntryCard ────────────────────────────────────────────────────────────────

interface EntryCardProps {
  entry: TalentEntry;
  editable: boolean;
  onRemove: (uid: string) => void;
}

function EntryCard({ entry, editable, onRemove }: EntryCardProps) {
  const description = TALENT_DESCRIPTIONS[entry.talentId] ?? TRAIT_DESCRIPTIONS[entry.talentId];

  return (
    <div className="flex items-start justify-between gap-2 rounded border border-slate-700 bg-slate-900/30 px-3 py-2 text-sm">
      <div className="space-y-0.5 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-slate-200 break-words">{entry.name}</span>
          {description && (
            <Tooltip content={description}>ⓘ</Tooltip>
          )}
        </div>
        {entry.notes && (
          <p className="text-xs text-slate-400 break-words">{entry.notes}</p>
        )}
      </div>
      {editable && (
        <button
          onClick={() => onRemove(entry.uid)}
          aria-label={`Remove ${entry.name}`}
          className="shrink-0 mt-0.5 text-slate-500 hover:text-red-400 transition text-xs"
        >
          ✕
        </button>
      )}
    </div>
  );
}

// ─── EntrySection ─────────────────────────────────────────────────────────────

interface EntrySectionProps {
  title: string;
  singular: string;
  entries: TalentEntry[];
  listData: readonly AnyListItem[];
  editable: boolean;
  onAdd: (entry: TalentEntry) => void;
  onRemove: (uid: string) => void;
}

function EntrySection({
  title,
  singular,
  entries,
  listData,
  editable,
  onAdd,
  onRemove,
}: EntrySectionProps) {
  const [adding, setAdding] = useState(false);

  return (
    <section className={sectionContainerClass(editable) + " space-y-2"}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <span className="text-xs text-slate-500">
          {entries.length} {entries.length === 1 ? singular.toLowerCase() : title.toLowerCase()}
        </span>
      </div>

      {entries.length === 0 && !adding && (
        <p className="text-sm text-slate-500 italic">None added yet.</p>
      )}

      <div className="space-y-1.5">
        {entries.map((entry) => (
          <EntryCard
            key={entry.uid}
            entry={entry}
            editable={editable}
            onRemove={onRemove}
          />
        ))}
      </div>

      {editable &&
        (adding ? (
          <AddEntryForm
            listData={listData}
            singular={singular}
            onAdd={onAdd}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="mt-1 px-3 py-1 text-xs rounded border border-slate-600 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
          >
            + Add {singular}
          </button>
        ))}
    </section>
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
  const selectedHomeworld = HOMEWORLD_LIST.find((hw) => hw.id === talents.homeworld);

  // ── Homeworld ──
  const handleHomeworldChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (!editable) return;
      onUpdateTalents({ ...talents, homeworld: e.target.value });
    },
    [editable, talents, onUpdateTalents]
  );

  const handleHomeworldNotesChange = useCallback(
    (v: string) => {
      if (!editable) return;
      onUpdateTalents({ ...talents, homeworldNotes: v });
    },
    [editable, talents, onUpdateTalents]
  );

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

  // ── Traits ──
  const handleAddTrait = useCallback(
    (entry: TalentEntry) => {
      onUpdateTalents({ ...talents, traits: [...talents.traits, entry] });
    },
    [talents, onUpdateTalents]
  );

  const handleRemoveTrait = useCallback(
    (uid: string) => {
      onUpdateTalents({
        ...talents,
        traits: talents.traits.filter((t) => t.uid !== uid),
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
    <div className="space-y-8 text-slate-300">
      <h2 className="text-xl font-semibold">Talents & Traits</h2>

      {/* HOMEWORLD */}
      <section className={sectionContainerClass(editable) + " space-y-3"}>
        <h3 className="text-lg font-semibold">Homeworld</h3>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Homeworld</label>
          <select
            disabled={!editable}
            value={talents.homeworld}
            onChange={handleHomeworldChange}
            className={editableInputClass(editable) + " appearance-none"}
          >
            <option value="">— Select homeworld —</option>
            {HOMEWORLD_LIST.map((hw) => (
              <option key={hw.id} value={hw.id}>
                {hw.name} ({hw.source})
              </option>
            ))}
          </select>
        </div>

        {selectedHomeworld && (
          <p className="text-xs text-slate-400 italic px-1">
            {selectedHomeworld.description}
          </p>
        )}

        <FormField
          label="Background Notes"
          value={talents.homeworldNotes ?? ""}
          onChange={handleHomeworldNotesChange}
          editable={editable}
          type="textarea"
          rows={2}
          placeholder="Additional background notes…"
        />
      </section>

      {/* TALENTS */}
      <EntrySection
        title="Talents"
        singular="Talent"
        entries={talents.talents}
        listData={TALENT_LIST}
        editable={editable}
        onAdd={handleAddTalent}
        onRemove={handleRemoveTalent}
      />

      {/* TRAITS */}
      <EntrySection
        title="Traits"
        singular="Trait"
        entries={talents.traits}
        listData={TRAIT_LIST}
        editable={editable}
        onAdd={handleAddTrait}
        onRemove={handleRemoveTrait}
      />

      {/* WEAPON TRAINING */}
      <section className={sectionContainerClass(editable) + " space-y-4"}>
        <h3 className="text-lg font-semibold">Weapon Training</h3>

        {WEAPON_TRAINING_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
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
                        ? "border-slate-600 text-slate-300 hover:bg-slate-800"
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
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
            Exotic Weapon Training
          </p>

          {weaponTraining.exoticWeapons.length === 0 && !editable && (
            <p className="text-sm text-slate-500 italic">None.</p>
          )}

          <div className="space-y-1.5 mb-2">
            {weaponTraining.exoticWeapons.map((weapon, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded border border-slate-700 bg-slate-900/30 px-3 py-1.5 text-sm"
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
  );
}
