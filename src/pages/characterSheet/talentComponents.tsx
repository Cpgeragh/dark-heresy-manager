// src/pages/characterSheet/talentComponents.tsx
// Shared picker, card, and section components used by TalentsTab and TraitsTab.

import { useState, useMemo } from "react";
import type { TalentEntry } from "../../types/Character";
import type { TalentData } from "../../data/talentData";
import type { TraitData } from "../../data/traitData";
import { TALENT_LIST } from "../../data/talentData";
import { TRAIT_LIST } from "../../data/traitData";
import type { SkillSource } from "../../types/SkillSource";
import { editableInputClass, uiSection } from "../../ui/editableStyles";
import { SectionHeader } from "../../ui/SectionHeader";
import { Button } from "../../ui/Button";
import { InfoModal } from "../../components/InfoModal";
import { TALENT_DESCRIPTIONS } from "../../data/talentDescriptions";
import { TRAIT_DESCRIPTIONS } from "../../data/traitDescriptions";
import { sourceColour } from "../../ui/sourceStyles";
import { PickerModal } from "../../ui/PickerModal";

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
  editable = true,
  onAdd,
  onClose,
}: {
  title: string;
  listData: readonly AnyListItem[];
  selectedIds: ReadonlySet<string>;
  editable?: boolean;
  onAdd: (entry: TalentEntry) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<AnyListItem | null>(null);
  const [specialisation, setSpecialisation] = useState("");

  const filtered = useMemo(() => {
    const seen = new Set<string>();
    const normalizedQuery = query.trim().toLowerCase();
    return [...listData]
      .filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        const repeatable = "repeatable" in item ? (item as TalentData).repeatable : false;
        if (!repeatable && selectedIds.has(item.id)) return false;
        return !normalizedQuery || item.name.toLowerCase().includes(normalizedQuery);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [listData, selectedIds, query]);

  const talentData = picked && "hasSpecialisation" in picked ? (picked as TalentData) : null;

  const isNumeric = talentData?.specialisationMin !== undefined;
  const specialisationOptions = talentData?.specialisationOptions;

  const numericValid = (): boolean => {
    const raw = specialisation.trim();
    if (!raw) return false;
    const numericValue = Number(raw);
    if (!Number.isInteger(numericValue)) return false;
    if (talentData!.specialisationMin !== undefined && numericValue < talentData!.specialisationMin)
      return false;
    if (talentData!.specialisationMax !== undefined && numericValue > talentData!.specialisationMax)
      return false;
    return true;
  };

  const canAdd =
    !!picked && talentData?.hasSpecialisation
      ? isNumeric
        ? numericValid()
        : specialisation.trim().length > 0
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
    setSpecialisation("");
  };

  const specialisationFooter =
    editable && picked && talentData?.hasSpecialisation ? (
      <div className="space-y-2">
        <p className="text-xs text-slate-400">
          Adding: <span className="text-slate-200 font-medium">{picked.name}</span>
        </p>

        {specialisationOptions ? (
          <select
            value={specialisation}
            onChange={(e) => setSpecialisation(e.target.value)}
            className={editableInputClass(true)}
          >
            <option value="">{talentData.specialisationLabel ?? "Specialisation"}…</option>
            {specialisationOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : isNumeric ? (
          <>
            <input
              type="number"
              value={specialisation}
              onChange={(e) => setSpecialisation(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canAdd) handleSpecAdd();
              }}
              min={talentData.specialisationMin}
              max={talentData.specialisationMax}
              step={1}
              placeholder={talentData.specialisationLabel ?? "Value…"}
              className={editableInputClass(true)}
            />
            <p className="text-xs text-slate-500">
              {talentData.specialisationMax !== undefined
                ? `Whole number ${talentData.specialisationMin}–${talentData.specialisationMax}.`
                : `Whole number, ${talentData.specialisationMin} or higher.`}
            </p>
          </>
        ) : (
          <input
            type="text"
            value={specialisation}
            onChange={(e) => setSpecialisation(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canAdd) handleSpecAdd();
            }}
            placeholder={talentData.specialisationLabel ?? "Specialisation…"}
            className={editableInputClass(true)}
          />
        )}

        <Button fullWidth onClick={handleSpecAdd} disabled={!canAdd}>
          Add {picked.name}
        </Button>
      </div>
    ) : undefined;

  return (
    <PickerModal
      title={title}
      placeholder="Search…"
      query={query}
      onQueryChange={(q) => {
        setQuery(q);
        setPicked(null);
        setSpecialisation("");
      }}
      onClose={onClose}
      isEmpty={filtered.length === 0}
      footer={specialisationFooter}
    >
      {filtered.map((item) => {
        const row = item as TalentData;
        const sources = normaliseSources(item.source as SkillSource | SkillSource[]);
        const isSelected = picked?.id === item.id;
        return (
          <button
            key={item.id}
            onClick={
              editable
                ? () => {
                    if ((item as TalentData).hasSpecialisation) {
                      setPicked(item);
                      setSpecialisation("");
                    } else {
                      addImmediate(item);
                    }
                  }
                : undefined
            }
            className={`w-full text-left px-4 lg:px-5 py-3 lg:py-4 transition group ${editable ? "hover:bg-slate-800 cursor-pointer" : "cursor-default"} ${
              isSelected ? "bg-slate-800 ring-1 ring-inset ring-red-500/40" : ""
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <span
                  className={`text-sm font-medium text-slate-200 truncate ${editable ? "group-hover:text-white" : ""}`}
                >
                  {item.name}
                </span>
                {(TALENT_DESCRIPTIONS[item.id] ?? TRAIT_DESCRIPTIONS[item.id]) && (
                  <span
                    className="inline-flex items-center leading-[0]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <InfoModal
                      title={item.name}
                      content={TALENT_DESCRIPTIONS[item.id] ?? TRAIT_DESCRIPTIONS[item.id]}
                    />
                  </span>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                {sources.map((src) => (
                  <span
                    key={src}
                    className={`text-xs lg:text-sm rounded border bg-slate-800/40 px-1.5 lg:px-2 py-0.5 font-code ${sourceColour(src)}`}
                  >
                    {src}
                  </span>
                ))}
              </div>
            </div>
            {row.prerequisites && (
              <div className="text-xs lg:text-sm text-slate-500 mt-0.5">
                Prerequisites: {row.prerequisites}
              </div>
            )}
          </button>
        );
      })}
    </PickerModal>
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
  const refData = (
    [...TALENT_LIST, ...TRAIT_LIST] as Array<{ id: string; source: SkillSource | SkillSource[] }>
  ).find((r) => r.id === entry.talentId);
  const refSources = refData ? normaliseSources(refData.source) : [];

  return (
    <div className="flex items-start justify-between gap-2 rounded border border-slate-500 bg-slate-900/60 px-3 lg:px-4 py-2 lg:py-3 text-sm lg:text-base">
      <div className="space-y-0.5 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-slate-100 break-words">{entry.name}</span>
          {refSources.map((src) => (
            <span
              key={src}
              className={`text-xs lg:text-sm rounded border bg-slate-800/40 px-1.5 lg:px-2 py-0.5 font-code ${sourceColour(src)}`}
            >
              {src}
            </span>
          ))}
          {description && <InfoModal title={entry.name} content={description} />}
        </div>
      </div>
      {editable && (
        <button
          onClick={() => onRemove(entry.uid)}
          aria-label={`Remove ${entry.name}`}
          className="shrink-0 mt-0.5 text-slate-500 hover:text-red-400 transition text-xs lg:text-sm"
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

  const selectedIds = useMemo(() => new Set(entries.map((e) => e.talentId)), [entries]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <SectionHeader>{title}</SectionHeader>
        <span className="text-xs lg:text-sm text-slate-500">
          {entries.length} {entries.length === 1 ? singular.toLowerCase() : title.toLowerCase()}
        </span>
      </div>

      <section className={uiSection + " space-y-2"}>
        {entries.length === 0 && <p className="text-sm lg:text-base text-slate-500 italic">None added yet.</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[...entries]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((entry) => (
              <EntryCard key={entry.uid} entry={entry} editable={editable} onRemove={onRemove} />
            ))}
        </div>

        <button
          onClick={() => setShowPicker(true)}
          className="mt-1 px-3 lg:px-4 py-1 text-xs lg:text-sm rounded border border-slate-500 text-slate-100 hover:bg-slate-800 transition"
        >
          {editable ? `+ Add ${singular}` : `View ${singular}s`}
        </button>

        {showPicker && (
          <TalentPickerModal
            title={`Add ${singular}`}
            listData={listData}
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
