// src/pages/characterSheet/SkillsTab.tsx

import { useMemo, useState } from "react";
import type { Characteristics, SkillEntry } from "../../types/Character";
import type { CharField } from "../../utils/characterFactory";

interface SkillsTabProps {
  skills: SkillEntry[];
  editable: boolean;
  onUpdate: (next: SkillEntry[]) => void;
  getCharField: (statKey: keyof Characteristics) => CharField;
}

type SortMode = "category" | "characteristic" | "name" | "total";

const GROUP_ORDER: (keyof Characteristics)[] = [
  "ws",
  "bs",
  "s",
  "t",
  "ag",
  "int",
  "per",
  "wp",
  "fel",
];

const CHAR_LABEL: Record<keyof Characteristics, string> = {
  ws: "WS",
  bs: "BS",
  s: "S",
  t: "T",
  ag: "Ag",
  int: "Int",
  per: "Per",
  wp: "WP",
  fel: "Fel",
};

const CHAR_FULL_LABEL: Record<keyof Characteristics, string> = {
  ws: "Weapon Skill (WS)",
  bs: "Ballistic Skill (BS)",
  s: "Strength (S)",
  t: "Toughness (T)",
  ag: "Agility (Ag)",
  int: "Intelligence (Int)",
  per: "Perception (Per)",
  wp: "Willpower (WP)",
  fel: "Fellowship (Fel)",
};

function getTotalColor(total: number | null): string {
  if (total === null) return "text-slate-400";
  if (total >= 40) return "text-green-400";
  if (total >= 30) return "text-amber-300";
  if (total >= 20) return "text-slate-200";
  return "text-red-400";
}

type SkillWithComputed = SkillEntry & {
  total: number | null;
  half: number | null;
  full: number | null;
  opposed: number | null;
};

export function SkillsTab({
  skills,
  editable,
  onUpdate,
  getCharField,
}: SkillsTabProps) {
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("category");
  const [showOnlyTrained, setShowOnlyTrained] = useState(false);
  const [compact, setCompact] = useState(false);

  const [collapsedCategory, setCollapsedCategory] = useState<Record<string, boolean>>({});
  const [collapsedChar, setCollapsedChar] =
    useState<Partial<Record<keyof Characteristics, boolean>>>({});

  // Expand/Collapse All (Category mode)
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

  // Expand/Collapse All (Characteristic mode)
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

  function computeTotal(skill: SkillEntry): number | null {
    const charField = getCharField(skill.characteristic);
    const charTotal = charField.base + charField.advances;
    const misc = skill.miscModifier ?? 0;

    const levelMod =
      skill.level === "trained"
        ? 0
        : skill.level === "+10"
        ? 10
        : skill.level === "+20"
        ? 20
        : -20;

    return charTotal + levelMod + misc;
  }

  const computedSkills: SkillWithComputed[] = useMemo(
    () =>
      skills.map((s) => {
        const total = computeTotal(s);
        return {
          ...s,
          total,
          half: total !== null ? Math.floor(total / 2) : null,
          full: total,
          opposed: total,
        };
      }),
    [skills]
  );

  const ALL_CATEGORIES = useMemo(() => {
    const set = new Set<string>();
    computedSkills.forEach((s) => set.add(s.category ?? "Other"));
    return Array.from(set).sort();
  }, [computedSkills]);

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
      arr = [...arr].sort((a, b) => {
        const at = a.total ?? -999;
        const bt = b.total ?? -999;
        return bt - at;
      });
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

  function renderSkillCard(skill: SkillWithComputed) {
    const totalColor = getTotalColor(skill.total);

    return (
      <div
        key={skill.id}
        className="border border-slate-700 bg-slate-900/40 rounded px-3 py-2 space-y-1"
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="font-semibold text-slate-200">{skill.name}</div>

          <span className="px-1.5 py-0.5 rounded border border-slate-600 text-[10px] font-mono text-slate-200 bg-slate-800">
            {CHAR_LABEL[skill.characteristic]}
          </span>

          {skill.category && (
            <span className="px-1.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] text-slate-300">
              {skill.category}
            </span>
          )}

          {/* SOURCE BADGE */}
          {skill.source && (
            <span className="px-1.5 py-0.5 rounded-full bg-slate-700 border border-slate-600 text-[10px] text-slate-200">
              {skill.source}
            </span>
          )}

          <span
            className={`px-1.5 py-0.5 rounded text-[10px] ${
              skill.advanced
                ? "bg-purple-700/40 border border-purple-500 text-purple-300"
                : "bg-slate-800 border border-slate-600 text-slate-300"
            }`}
          >
            {skill.advanced ? "Advanced" : "Basic"}
          </span>
        </div>

        {compact ? (
          <div className="flex flex-wrap gap-3 text-xs text-slate-400 mt-1">
            <div>
              Total: <span className={totalColor}>{skill.total ?? "--"}</span>
            </div>
            <div>
              Half:{" "}
              <span className={getTotalColor(skill.half)}>
                {skill.half ?? "--"}
              </span>
            </div>
            <div>
              Opposed:{" "}
              <span className={getTotalColor(skill.opposed)}>
                {skill.opposed ?? "--"}
              </span>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mt-2 text-xs">
              {["untrained", "trained", "+10", "+20"].map((lvl) => (
                <button
                  key={lvl}
                  disabled={!editable}
                  onClick={() =>
                    updateLevel(skill.id, lvl as SkillEntry["level"])
                  }
                  className={`px-2 py-1 rounded border ${
                    skill.level === lvl
                      ? "bg-amber-500 text-slate-900 border-amber-400"
                      : "border-slate-600 text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 items-center text-xs text-slate-400 mt-2">
              <div className="flex items-center gap-1">
                <span>Misc:</span>
                <input
                  type="number"
                  disabled={!editable}
                  value={skill.miscModifier ?? 0}
                  onChange={(e) => updateMisc(skill.id, Number(e.target.value))}
                  className="w-16 bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-slate-200 text-xs"
                />
              </div>

              <div>
                Total: <span className={totalColor}>{skill.total ?? "--"}</span>
              </div>
              <div>
                Half:{" "}
                <span className={getTotalColor(skill.half)}>
                  {skill.half ?? "--"}
                </span>
              </div>
              <div>
                Opposed:{" "}
                <span className={getTotalColor(skill.opposed)}>
                  {skill.opposed ?? "--"}
                </span>
              </div>
            </div>

            <div className="mt-2">
              <textarea
                placeholder="Notes (optional)…"
                disabled={!editable}
                value={skill.notes ?? ""}
                onChange={(e) => updateNotes(skill.id, e.target.value)}
                className="w-full min-h-[40px] text-xs bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 resize-y"
              />
            </div>
          </>
        )}
      </div>
    );
  }

  // CATEGORY GROUP MODE
  const renderCategoryGroups = () => (
    <div className="space-y-5">
      <div className="flex gap-3 mb-2 text-xs">
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

      {ALL_CATEGORIES.map((cat) => {
        const groupSkills = filteredAndSorted.filter(
          (s) => (s.category ?? "Other") === cat
        );
        if (groupSkills.length === 0) return null;

        const trainedCount = groupSkills.filter(
          (s) => s.level !== "untrained"
        ).length;

        return (
          <div
            key={cat}
            className="border border-slate-700 rounded bg-slate-950/40"
          >
            <button
              onClick={() =>
                setCollapsedCategory((prev) => ({
                  ...prev,
                  [cat]: !prev[cat],
                }))
              }
              className="w-full flex justify-between items-center px-3 py-2 bg-slate-900 hover:bg-slate-800 border-b border-slate-700"
            >
              <span className="font-semibold text-slate-100">{cat}</span>

              <div className="flex items-center gap-4 text-xs text-slate-300">
                <span>{trainedCount} trained</span>
                <span className="text-slate-500">
                  {collapsedCategory[cat] ? "▼" : "▲"}
                </span>
              </div>
            </button>

            {!collapsedCategory[cat] && (
              <div className="p-3 space-y-3">
                {groupSkills
                  .slice()
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((skill) => renderSkillCard(skill))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // CHARACTERISTIC GROUP MODE
  const renderCharacteristicGroups = () => (
    <div className="space-y-5">
      <div className="flex gap-3 mb-2 text-xs">
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

      {GROUP_ORDER.map((charKey) => {
        const groupSkills = filteredAndSorted.filter(
          (s) => s.characteristic === charKey
        );

        if (groupSkills.length === 0) return null;

        const charField = getCharField(charKey);
        const charTotal = charField.base + charField.advances;

        const trainedCount = groupSkills.filter(
          (s) => s.level !== "untrained"
        ).length;

        return (
          <div
            key={charKey}
            className="border border-slate-700 rounded bg-slate-950/40"
          >
            <button
              onClick={() =>
                setCollapsedChar((prev) => ({
                  ...prev,
                  [charKey]: !prev[charKey],
                }))
              }
              className="w-full flex justify-between items-center px-3 py-2 bg-slate-900 hover:bg-slate-800 border-b border-slate-700"
            >
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded border border-slate-600 text-[11px] font-mono text-slate-200 bg-slate-800">
                  {CHAR_LABEL[charKey]}
                </span>
                <span className="font-semibold text-slate-100">
                  {CHAR_FULL_LABEL[charKey]}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-300">
                <span className={getTotalColor(charTotal)}>
                  Base total: {charTotal}
                </span>
                <span>{trainedCount} trained</span>
                <span className="text-slate-500">
                  {collapsedChar[charKey] ? "▼" : "▲"}
                </span>
              </div>
            </button>

            {!collapsedChar[charKey] && (
              <div className="p-3 space-y-3">
                {groupSkills
                  .slice()
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((skill) => renderSkillCard(skill))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Skills</h2>

      {/* CONTROL BAR */}
      <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">
        <input
          type="text"
          placeholder="Search skills…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200"
        />

        <select
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value as SortMode)}
          className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200"
        >
          <option value="category">Sort: by category</option>
          <option value="characteristic">Sort: by characteristic</option>
          <option value="name">Sort: alphabetical</option>
          <option value="total">Sort: by total</option>
        </select>

        <label className="inline-flex items-center gap-1 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={showOnlyTrained}
            onChange={(e) => setShowOnlyTrained(e.target.checked)}
            className="mr-1"
          />
          Trained only
        </label>

        <button
          onClick={() => setCompact((prev) => !prev)}
          className="px-3 py-1 border border-slate-600 rounded bg-slate-900 text-slate-200 hover:bg-slate-800 text-xs"
        >
          {compact ? "Detailed mode" : "Compact mode"}
        </button>
      </div>

      {sortMode === "category"
        ? renderCategoryGroups()
        : sortMode === "characteristic"
        ? renderCharacteristicGroups()
        : (
          <div className="space-y-3">
            {filteredAndSorted.map((skill) => renderSkillCard(skill))}
          </div>
        )}
    </div>
  );
}