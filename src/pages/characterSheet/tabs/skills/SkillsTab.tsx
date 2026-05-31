// src/pages/characterSheet/tabs/skills/SkillsTab.tsx

import { useMemo, useState, useCallback } from "react";
import type { Characteristics, SkillEntry } from "../../../../types/Character";
import type { CharField } from "../../../../utils/characterFactory";
import { CHARACTERISTIC_ADVANCE_INCREMENT } from "../../../../constants/gameRules";

// Import our new hooks
import { useSkillComputation } from "../../../../hooks/useSkillComputation";
import { useSkillFiltering } from "../../../../hooks/useSkillFiltering";
import { useSkillSorting } from "../../../../hooks/useSkillSorting";
import { useSkillGroupCollapse } from "../../../../hooks/useSkillGroupCollapse";

import {
  GROUP_ORDER,
  CHAR_LABEL,
  CHAR_FULL_LABEL,
} from "./constants";

import { SkillCard } from "./SkillCard";
import { SkillsControlBar } from "./SkillsControlBar";
import { CategoryGroup } from "./CategoryGroup";
import { CharacteristicGroup } from "./CharacteristicGroup";

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

  // ------------------------------
  // COMPUTE, FILTER, SORT using hooks
  // ------------------------------
  const computedSkills = useSkillComputation({ skills, getCharField });
  const filteredSkills = useSkillFiltering({
    skills: computedSkills,
    searchQuery: search,
    showOnlyTrained,
  });
  const sortedSkills = useSkillSorting({
    skills: filteredSkills,
    sortMode,
  });

  // ------------------------------
  // CATEGORY LIST
  // ------------------------------
  const ALL_CATEGORIES = useMemo(() => {
    const seen = new Set<string>();
    computedSkills.forEach((s) => seen.add(s.category ?? "Other"));
    return Array.from(seen).sort();
  }, [computedSkills]);

  const categoryCollapse = useSkillGroupCollapse(ALL_CATEGORIES);
  const charCollapse = useSkillGroupCollapse(GROUP_ORDER);

  // ------------------------------
  // MEMOIZED COLLAPSE HANDLERS
  // ------------------------------
  const handleCategoryCollapse = useCallback(
    (category: string) => (value: boolean) => {
      categoryCollapse.setGroupCollapsed(category, value);
    },
    [categoryCollapse]
  );

  const handleCharCollapse = useCallback(
    (charKey: string) => (value: boolean) => {
      charCollapse.setGroupCollapsed(charKey, value);
    },
    [charCollapse]
  );

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
              onClick={categoryCollapse.expandAll}
              className="px-3 py-1 rounded border border-slate-600 bg-slate-800"
              aria-label="Expand all skill categories"
            >
              Expand all
            </button>
            <button
              onClick={categoryCollapse.collapseAll}
              className="px-3 py-1 rounded border border-slate-600 bg-slate-800"
              aria-label="Collapse all skill categories"
            >
              Collapse all
            </button>
          </div>

          <div className="space-y-4">
            {ALL_CATEGORIES.map((cat) => {
              const groupSkills = sortedSkills.filter(
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
                  collapsed={categoryCollapse.collapsed[cat] ?? false}
                  setCollapsed={handleCategoryCollapse(cat)}
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
              onClick={charCollapse.expandAll}
              className="px-3 py-1 rounded border border-slate-600 bg-slate-800"
            >
              Expand all
            </button>
            <button
              onClick={charCollapse.collapseAll}
              className="px-3 py-1 rounded border border-slate-600 bg-slate-800"
            >
              Collapse all
            </button>
          </div>

          <div className="space-y-4">
            {GROUP_ORDER.map((charKey) => {
              const groupSkills = sortedSkills.filter(
                (s) => s.characteristic === charKey
              );
              if (!groupSkills.length) return null;

              const charField = getCharField(charKey);
              const charTotal = charField.base + charField.advances * CHARACTERISTIC_ADVANCE_INCREMENT;

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
                  collapsed={charCollapse.collapsed[charKey] ?? false}
                  setCollapsed={handleCharCollapse(charKey)}
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
          {sortedSkills.map((skill) => (
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