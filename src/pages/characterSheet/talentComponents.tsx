// src/pages/characterSheet/talentComponents.tsx
// Shared picker, card, and section components used by TalentsTab and TraitsTab.

import { useState, useMemo } from "react";
import type { TalentEntry } from "../../types/Character";
import type { TalentData } from "../../data/talentData";
import type { TraitData } from "../../data/traitData";
import { TALENT_LIST } from "../../data/talentData";
import { TRAIT_LIST } from "../../data/traitData";
import type { SkillSource } from "../../types/SkillSource";
import { editableInputClass, sectionContainerClass } from "../../ui/editableStyles";
import { InfoModal } from "../../components/InfoModal";
import { TALENT_DESCRIPTIONS } from "../../data/talentDescriptions";
import { TRAIT_DESCRIPTIONS } from "../../data/traitDescriptions";
import { sourceColour } from "../../ui/sourceStyles";

// ─── Types ───────────────────────────────────────────────────────────────────

export type AnyListItem = TalentData | TraitData;

export function normaliseSources(s: SkillSource | SkillSource[]): SkillSource[] {
  return Array.isArray(s) ? s : [s];
}

// ─── TalentPickerModal ────────────────────────────────────────────────────────

export function TalentPickerModal({
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
    const normalizedQuery = query.trim().toLowerCase();
    return [...listData]
      .filter((t) => {
        if (seen.has(t.id)) return false;
        seen.add(t.id);
        const repeatable = "repeatable" in t ? (t as TalentData).repeatable : false;
        if (!repeatable && selectedIds.has(t.id)) return false;
        return !normalizedQuery || t.name.toLowerCase().includes(normalizedQuery);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [listData, selectedIds, query]);

  const td = picked as TalentData | null;

  const isNumeric = td?.specialisationMin !== undefined;

  const numericValid = (): boolean => {
    const raw = specialisation.trim();
    if (!raw) return false;
    const numericValue = Number(raw);
    if (!Number.isInteger(numericValue)) return false;
    if (td!.specialisationMin !== undefined && numericValue < td!.specialisationMin) return false;
    if (td!.specialisationMax !== undefined && numericValue > td!.specialisationMax) return false;
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

        {/* Footer — specialisation confirm */}
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

export function EntryCard({ entry, editable, onRemove }: EntryCardProps) {
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

export function EntrySection({
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
