// src/pages/characterSheet/TalentsTab.tsx

import { useCallback, useMemo, useState } from "react";
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

import { WEAPON_TRAINING_GROUPS } from "../../data/weaponTrainingData";
import type { SkillSource } from "../../types/SkillSource";
import {
  editableInputClass,
  sectionContainerClass,
} from "../../ui/editableStyles";
import { FormField } from "../../components/FormField";
import { InfoModal } from "../../components/InfoModal";
import { TALENT_DESCRIPTIONS } from "../../data/talentDescriptions";
import { TRAIT_DESCRIPTIONS } from "../../data/traitDescriptions";
import { sourceColour } from "../../ui/sourceStyles";

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

function normaliseSources(s: SkillSource | SkillSource[]): SkillSource[] {
  return Array.isArray(s) ? s : [s];
}

// ─── Faith Talent constants ───────────────────────────────────────────────────

const FAITH_GROUP_LABELS: Record<string, string> = {
  sign:  "Emperor's Sign",
  mercy: "Emperor's Mercy",
  wrath: "Emperor's Wrath",
};

const FAITH_GROUP_ORDER = ["sign", "mercy", "wrath"] as const;

const REGULAR_TALENT_LIST = TALENT_LIST.filter((t) => !t.faithGroup);
const FAITH_TALENT_LIST   = TALENT_LIST.filter((t) => !!t.faithGroup);
const FAITH_TALENT_IDS    = new Set(FAITH_TALENT_LIST.map((t) => t.id));

function getFaithGroup(talentId: string): string | undefined {
  return FAITH_TALENT_LIST.find((t) => t.id === talentId)?.faithGroup;
}

// ─── TalentPickerModal ────────────────────────────────────────────────────────

function TalentPickerModal({
  title,
  listData,
  selectedIds,
  onAdd,
  onClose,
}: {
  title: string;
  listData: readonly AnyListItem[];
  selectedIds: ReadonlySet<string>;
  onAdd: (entry: TalentEntry) => void;
  onClose: () => void;
}) {
  const [query, setQuery]         = useState("");
  const [picked, setPicked]       = useState<AnyListItem | null>(null);
  const [specialisation, setSpec] = useState("");

  const filtered = useMemo(() => {
    const seen = new Set<string>();
    const q = query.trim().toLowerCase();
    return [...listData]
      .filter((t) => {
        if (seen.has(t.id)) return false;
        seen.add(t.id);
        const repeatable = "repeatable" in t ? (t as TalentData).repeatable : false;
        if (!repeatable && selectedIds.has(t.id)) return false;
        return !q || t.name.toLowerCase().includes(q);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [listData, selectedIds, query]);

  const td = picked as TalentData | null;

  // Numeric specialisation: signalled by specialisationMin being defined on the item.
  const isNumeric = td?.specialisationMin !== undefined;

  const numericValid = (): boolean => {
    const raw = specialisation.trim();
    if (!raw) return false;
    const v = Number(raw);
    if (!Number.isInteger(v)) return false;
    if (td!.specialisationMin !== undefined && v < td!.specialisationMin) return false;
    if (td!.specialisationMax !== undefined && v > td!.specialisationMax) return false;
    return true;
  };

  const canAdd = !!picked && td?.hasSpecialisation
    ? (isNumeric ? numericValid() : specialisation.trim().length > 0)
    : false;

  const addImmediate = (item: AnyListItem) => {
    onAdd({ uid: crypto.randomUUID(), talentId: item.id, name: item.name });
  };

  const handleSpecAdd = () => {
    if (!picked || !canAdd) return;
    const entry: TalentEntry = {
      uid: crypto.randomUUID(),
      talentId: picked.id,
      name: `${picked.name} (${specialisation.trim()})`,
      specialisation: specialisation.trim(),
    };
    onAdd(entry);
    setPicked(null);
    setSpec("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col max-h-[80vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-lg leading-none">×</button>
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b border-slate-800">
          <input
            type="text"
            autoFocus
            placeholder="Search…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPicked(null); setSpec(""); }}
            className={editableInputClass(true)}
          />
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 divide-y divide-slate-800">
          {filtered.length === 0 && (
            <p className="p-4 text-sm text-slate-500 text-center">No matches.</p>
          )}
          {filtered.map((t) => {
            const row = t as TalentData;
            const sources = normaliseSources(t.source as SkillSource | SkillSource[]);
            const isSelected = picked?.id === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  if ((t as TalentData).hasSpecialisation) {
                    setPicked(t);
                    setSpec("");
                  } else {
                    addImmediate(t);
                  }
                }}
                className={`w-full text-left px-4 py-3 hover:bg-slate-800 transition group ${
                  isSelected ? "bg-slate-800 ring-1 ring-inset ring-amber-500/40" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-slate-200 group-hover:text-white">
                    {t.name}
                  </span>
                  <div className="flex gap-1 shrink-0">
                    {sources.map((src) => (
                      <span key={src} className={`text-xs rounded border bg-slate-800/40 px-1.5 py-0.5 font-mono ${sourceColour(src)}`}>
                        {src}
                      </span>
                    ))}
                  </div>
                </div>
                {row.prerequisites && (
                  <div className="text-xs text-slate-500 mt-0.5">
                    Prerequisites: {row.prerequisites}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer — specialisation confirm (only when needed) */}
        {picked && td?.hasSpecialisation && (
          <div className="px-4 py-3 border-t border-slate-700 space-y-2">
            <p className="text-xs text-slate-400">
              Adding: <span className="text-slate-200 font-medium">{picked.name}</span>
            </p>

            {isNumeric ? (
              <>
                <input
                  type="number"
                  value={specialisation}
                  onChange={(e) => setSpec(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && canAdd) handleSpecAdd(); }}
                  min={td.specialisationMin}
                  max={td.specialisationMax}
                  step={1}
                  placeholder={td.specialisationLabel ?? "Value…"}
                  className={editableInputClass(true)}
                  autoFocus
                />
                <p className="text-xs text-slate-500">
                  {td.specialisationMax !== undefined
                    ? `Whole number ${td.specialisationMin}–${td.specialisationMax}.`
                    : `Whole number, ${td.specialisationMin} or higher.`}
                </p>
              </>
            ) : (
              <input
                type="text"
                value={specialisation}
                onChange={(e) => setSpec(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && canAdd) handleSpecAdd(); }}
                placeholder={td.specialisationLabel ?? "Specialisation…"}
                className={editableInputClass(true)}
                autoFocus
              />
            )}

            <button
              onClick={handleSpecAdd}
              disabled={!canAdd}
              className="w-full px-3 py-1.5 text-sm rounded border border-amber-500 bg-amber-600 text-white hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Add {picked.name}
            </button>
          </div>
        )}

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
  const refData = ([...TALENT_LIST, ...TRAIT_LIST] as Array<{ id: string; source: SkillSource | SkillSource[] }>)
    .find((r) => r.id === entry.talentId);
  const refSources = refData ? normaliseSources(refData.source) : [];

  return (
    <div className="flex items-start justify-between gap-2 rounded border border-slate-700 bg-slate-900/30 px-3 py-2 text-sm">
      <div className="space-y-0.5 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-slate-200 break-words">{entry.name}</span>
          {refSources.map((src) => (
            <span key={src} className={`text-xs rounded border bg-slate-800/40 px-1.5 py-0.5 font-mono ${sourceColour(src)}`}>
              {src}
            </span>
          ))}
          {description && (
            <InfoModal title={entry.name} content={description} />
          )}
        </div>
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
  const [showPicker, setShowPicker] = useState(false);

  const selectedIds = useMemo(
    () => new Set(entries.map((e) => e.talentId)),
    [entries]
  );

  return (
    <section className={sectionContainerClass(editable) + " space-y-2"}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <span className="text-xs text-slate-500">
          {entries.length} {entries.length === 1 ? singular.toLowerCase() : title.toLowerCase()}
        </span>
      </div>

      {entries.length === 0 && (
        <p className="text-sm text-slate-500 italic">None added yet.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {entries.map((entry) => (
          <EntryCard
            key={entry.uid}
            entry={entry}
            editable={editable}
            onRemove={onRemove}
          />
        ))}
      </div>

      {editable && (
        <button
          onClick={() => setShowPicker(true)}
          className="mt-1 px-3 py-1 text-xs rounded border border-slate-600 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
        >
          + Add {singular}
        </button>
      )}

      {showPicker && (
        <TalentPickerModal
          title={`Add ${singular}`}
          listData={listData}
          selectedIds={selectedIds}
          onAdd={onAdd}
          onClose={() => setShowPicker(false)}
        />
      )}
    </section>
  );
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
    <section className={sectionContainerClass(editable) + " space-y-4"}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Faith Talents</h3>
        <span className="text-xs text-slate-500">
          {entries.length} {entries.length === 1 ? "talent" : "faith talents"}
        </span>
      </div>

      {FAITH_GROUP_ORDER.map((group) => {
        const groupEntries = entries.filter((e) => getFaithGroup(e.talentId) === group);
        return (
          <div key={group}>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
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

      {editable && (
        <button
          onClick={() => setShowPicker(true)}
          className="mt-1 px-3 py-1 text-xs rounded border border-slate-600 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
        >
          + Add Faith Talent
        </button>
      )}

      {showPicker && (
        <TalentPickerModal
          title="Add Faith Talent"
          listData={FAITH_TALENT_LIST}
          selectedIds={selectedIds}
          onAdd={onAdd}
          onClose={() => setShowPicker(false)}
        />
      )}
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
            {[...HOMEWORLD_LIST].sort((a, b) => a.name.localeCompare(b.name)).map((hw) => (
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
