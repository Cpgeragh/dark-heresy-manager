// src/pages/characterSheet/tabs/skills/SkillsTab.tsx

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
      Object.fromEntries(GROUP_ORDER.map((k) => [k, true]))
    );

  // ------------------------------
  // COMPUTE TOTALS
  // ------------------------------
  const computedSkills: SkillWithComputed[] = useMemo(
    () =>
      skills.map((s) => {
        const total = computeTotal(s, getCharField);
        return {
          ...s,
          total,
          half: total !== null ? Math.floor(total / 2) : null,
          full: total,
          opposed: total,
        };
      }),
    [skills, getCharField]
  );

  // ------------------------------
  // CATEGORY LIST
  // ------------------------------
  const ALL_CATEGORIES = useMemo(() => {
    const set = new Set<string>();
    computedSkills.forEach((s) => set.add(s.category ?? "Other"));
    return Array.from(set).sort();
  }, [computedSkills]);

  // ------------------------------
  // UPDATE HELPERS
  // ------------------------------
  function updateLevel(id: string, level: SkillEntry["level"]) {
    onUpdate(skills.map((s) => (s.id === id ? { ...s, level } : s)));
  }

  function updateMisc(id: string, value: number) {
    onUpdate(
      skills.map((s) =>
        s.id === id ? { ...s, miscModifier: value } : s
      )
    );
  }

  function updateNotes(id: string, notes: string) {
    onUpdate(skills.map((s) => (s.id === id ? { ...s, notes } : s)));
  }

  // ------------------------------
  // FILTER + SORT
  // ------------------------------
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

  // ------------------------------
  // EXPAND / COLLAPSE HELPERS
  // ------------------------------
  function expandAllCategories() {
    setCollapsedCategory(
      Object.fromEntries(ALL_CATEGORIES.map((c) => [c, false]))
    );
  }

  function collapseAllCategories() {
    setCollapsedCategory(
      Object.fromEntries(ALL_CATEGORIES.map((c) => [c, true]))
    );
  }

  function expandAllCharacteristics() {
    setCollapsedChar(
      Object.fromEntries(GROUP_ORDER.map((c) => [c, false]))
    );
  }

  function collapseAllCharacteristics() {
    setCollapsedChar(
      Object.fromEntries(GROUP_ORDER.map((c) => [c, true]))
    );
  }

  // ------------------------------
  // RENDER
  // ------------------------------
  return (
    <div className="space-y-6 text-slate-300">
      <h2 className="text-xl font-semibold">Skills</h2>

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
          <div className="flex gap-2 text-xs">
            <button
              onClick={expandAllCategories}
              className="px-3 py-1 rounded border border-slate-600 bg-slate-800"
            >
              Expand all
            </button>
            <button
              onClick={collapseAllCategories}
              className="px-3 py-1 rounded border border-slate-600 bg-slate-800"
            >
              Collapse all
            </button>
          </div>

          <div className="space-y-4">
            {ALL_CATEGORIES.map((cat) => {
              const groupSkills = filteredAndSorted.filter(
                (s) => (s.category ?? "Other") === cat
              );
              if (!groupSkills.length) return null;

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
          <div className="flex gap-2 text-xs">
            <button
              onClick={expandAllCharacteristics}
              className="px-3 py-1 rounded border border-slate-600 bg-slate-800"
            >
              Expand all
            </button>
            <button
              onClick={collapseAllCharacteristics}
              className="px-3 py-1 rounded border border-slate-600 bg-slate-800"
            >
              Collapse all
            </button>
          </div>

          <div className="space-y-4">
            {GROUP_ORDER.map((charKey) => {
              const groupSkills = filteredAndSorted.filter(
                (s) => s.characteristic === charKey
              );
              if (!groupSkills.length) return null;

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