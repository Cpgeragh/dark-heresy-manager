import { useMemo, useState } from "react";

import type { Characteristics, SkillEntry } from "../../../../types/Character";
import type { CharField } from "../../../../utils/characterFactory";

import {
  GROUP_ORDER,
  CHAR_LABEL,
  CHAR_FULL_LABEL,
  computeTotal,
} from "./constants";

import { SkillCard } from "./SkillCard";
import { SkillsControlBar } from "./SkillsControlBar";
import { CategoryGroup } from "./CategoryGroup";
import { CharacteristicGroup } from "./CharacteristicGroup";

import type { SkillWithComputed } from "./constants";

type SortMode = "category" | "characteristic" | "name" | "total";

interface SkillsTabProps {
  skills: SkillEntry[];
  editable: boolean;
  onUpdate: (next: SkillEntry[]) => void;
  getCharField: (statKey: keyof Characteristics) => CharField;
}

export function SkillsTab({
  skills,
  editable,
  onUpdate,
  getCharField,
}: SkillsTabProps) {
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("characteristic");
  const [showOnlyTrained, setShowOnlyTrained] = useState(false);
  const [compact, setCompact] = useState(false);

  const [collapsedCategory, setCollapsedCategory] = useState<
    Record<string, boolean>
  >({});

  const [collapsedChar, setCollapsedChar] =
  useState<Partial<Record<keyof Characteristics, boolean>>>(() =>
    Object.fromEntries(
      GROUP_ORDER.map((k) => [k, true])
    )
  );

  //
  // COMPUTE SKILL TOTALS
  //
  const computedSkills: SkillWithComputed[] = useMemo(
    () =>
      skills.map((s) => ({
        ...s,
        total: computeTotal(s, getCharField),
        half:
          computeTotal(s, getCharField) !== null
            ? Math.floor(computeTotal(s, getCharField)! / 2)
            : null,
        full: computeTotal(s, getCharField),
        opposed: computeTotal(s, getCharField),
      })),
    [skills, getCharField]
  );

  //
  // CATEGORY LIST
  //
  const ALL_CATEGORIES = useMemo(() => {
    const set = new Set<string>();
    computedSkills.forEach((s) => set.add(s.category ?? "Other"));
    return Array.from(set).sort();
  }, [computedSkills]);

  //
  // UPDATE FUNCTIONS
  //
  function updateLevel(id: string, level: SkillEntry["level"]) {
    const next = skills.map((s) => (s.id === id ? { ...s, level } : s));
    onUpdate(next);
  }

  function updateMisc(id: string, value: number) {
    const next = skills.map((s) =>
      s.id === id ? { ...s, miscModifier: value } : s
    );
    onUpdate(next);
  }

  function updateNotes(id: string, notes: string) {
    const next = skills.map((s) => (s.id === id ? { ...s, notes } : s));
    onUpdate(next);
  }

  //
  // FILTER + SORT
  //
  const filteredAndSorted = useMemo(() => {
    const q = search.trim().toLowerCase();

    let arr = computedSkills.filter((s) => {
      if (showOnlyTrained && s.level === "untrained") return false;
      if (q && !s.name.toLowerCase().includes(q)) return false;
      return true;
    });

    if (sortMode === "name") {
      arr = [...arr].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortMode === "total") {
      arr = [...arr].sort(
        (a, b) => (b.total ?? -999) - (a.total ?? -999)
      );
    } else if (sortMode === "characteristic") {
      arr = [...arr].sort((a, b) => {
        const ai = GROUP_ORDER.indexOf(a.characteristic);
        const bi = GROUP_ORDER.indexOf(b.characteristic);
        if (ai !== bi) return ai - bi;
        return a.name.localeCompare(b.name);
      });
    } else if (sortMode === "category") {
      arr = [...arr].sort((a, b) => {
        const ac = a.category ?? "";
        const bc = b.category ?? "";
        if (ac !== bc) return ac.localeCompare(bc);
        return a.name.localeCompare(b.name);
      });
    }

    return arr;
  }, [computedSkills, search, showOnlyTrained, sortMode]);

  //
  // EXPAND / COLLAPSE ALL
  //
  function expandAllCategories() {
    const next: Record<string, boolean> = {};
    ALL_CATEGORIES.forEach((c) => (next[c] = false));
    setCollapsedCategory(next);
  }
  function collapseAllCategories() {
    const next: Record<string, boolean> = {};
    ALL_CATEGORIES.forEach((c) => (next[c] = true));
    setCollapsedCategory(next);
  }

  function expandAllCharacteristics() {
    const next: Partial<Record<keyof Characteristics, boolean>> = {};
    GROUP_ORDER.forEach((c) => (next[c] = false));
    setCollapsedChar(next);
  }
  function collapseAllCharacteristics() {
    const next: Partial<Record<keyof Characteristics, boolean>> = {};
    GROUP_ORDER.forEach((c) => (next[c] = true));
    setCollapsedChar(next);
  }

  //
  // RENDER
  //
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Skills</h2>

      <SkillsControlBar
        search={search}
        setSearch={setSearch}
        sortMode={sortMode}
        setSortMode={setSortMode}
        showOnlyTrained={showOnlyTrained}
        setShowOnlyTrained={setShowOnlyTrained}
        compact={compact}
        setCompact={setCompact}
      />

      {sortMode === "category" ? (
        <>
          <div className="flex gap-3 mb-3 text-xs">
            <button
              onClick={expandAllCategories}
              className="px-3 py-1 rounded border border-slate-600 bg-slate-800 text-slate-200"
            >
              Expand all
            </button>

            <button
              onClick={collapseAllCategories}
              className="px-3 py-1 rounded border border-slate-600 bg-slate-800 text-slate-200"
            >
              Collapse all
            </button>
          </div>

          <div className="space-y-5">
            {ALL_CATEGORIES.map((cat) => {
              const groupSkills = filteredAndSorted.filter(
                (s) => (s.category ?? "Other") === cat
              );

              if (groupSkills.length === 0) return null;

              return (
                <CategoryGroup
                  key={cat}
                  category={cat}
                  skills={groupSkills}
                  editable={editable}
                  compact={compact}
                  collapsed={collapsedCategory[cat] ?? false}
                  setCollapsed={(v) =>
                    setCollapsedCategory((p) => ({ ...p, [cat]: v }))
                  }
                  updateLevel={updateLevel}
                  updateMisc={updateMisc}
                  updateNotes={updateNotes}
                />
              );
            })}
          </div>
        </>
      ) : sortMode === "characteristic" ? (
        <>
          <div className="flex gap-3 mb-3 text-xs">
            <button
              onClick={expandAllCharacteristics}
              className="px-3 py-1 rounded border border-slate-600 bg-slate-800 text-slate-200"
            >
              Expand all
            </button>

            <button
              onClick={collapseAllCharacteristics}
              className="px-3 py-1 rounded border border-slate-600 bg-slate-800 text-slate-200"
            >
              Collapse all
            </button>
          </div>

          <div className="space-y-5">
            {GROUP_ORDER.map((charKey) => {
              const groupSkills = filteredAndSorted.filter(
                (s) => s.characteristic === charKey
              );

              if (groupSkills.length === 0) return null;

              const charField = getCharField(charKey);
              const charTotal = charField.base + charField.advances;

              return (
                <CharacteristicGroup
                  key={charKey}
                  charKey={charKey}
                  charLabel={CHAR_LABEL[charKey]}
                  charFullLabel={CHAR_FULL_LABEL[charKey]}
                  charTotal={charTotal}
                  skills={groupSkills}
                  editable={editable}
                  compact={compact}
                  collapsed={collapsedChar[charKey] ?? false}
                  setCollapsed={(v) =>
                    setCollapsedChar((p) => ({ ...p, [charKey]: v }))
                  }
                  updateLevel={updateLevel}
                  updateMisc={updateMisc}
                  updateNotes={updateNotes}
                />
              );
            })}
          </div>
        </>
      ) : (
        <div className="space-y-3">
          {filteredAndSorted.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              editable={editable}
              compact={compact}
              updateLevel={updateLevel}
              updateMisc={updateMisc}
              updateNotes={updateNotes}
            />
          ))}
        </div>
      )}
    </div>
  );
}