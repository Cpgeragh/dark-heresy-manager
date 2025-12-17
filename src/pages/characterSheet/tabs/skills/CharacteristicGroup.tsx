// src/pages/characterSheet/tabs/skills/CharacteristicGroup.tsx

import { useCallback } from "react";
import type { SkillWithComputed } from "./constants";
import type { Characteristics } from "../../../../types/Character";
import { SkillCard } from "./SkillCard";
import {
  SKILL_EXPERT_THRESHOLD,
  SKILL_TRAINED_THRESHOLD,
  SKILL_BASIC_THRESHOLD,
} from "../../../../constants/gameRules";

interface CharacteristicGroupProps {
  charKey: keyof Characteristics;
  charLabel: string;
  charFullLabel: string;
  charTotal: number;

  skills: SkillWithComputed[];
  editable: boolean;
  compact: boolean;

  collapsed: boolean;
  setCollapsed: (next: boolean) => void;

  updateLevel: (id: string, lvl: SkillWithComputed["level"]) => void;
  updateMisc: (id: string, val: number) => void;
  updateNotes: (id: string, notes: string) => void;
}

export function CharacteristicGroup({
  charLabel,
  charFullLabel,
  charTotal,
  skills,
  editable,
  compact,
  collapsed,
  setCollapsed,
  updateLevel,
  updateMisc,
  updateNotes,
}: CharacteristicGroupProps) {
  const trainedCount = skills.filter((s) => s.level !== "untrained").length;

  const handleToggle = useCallback(() => {
    setCollapsed(!collapsed);
  }, [collapsed, setCollapsed]);

  return (
    <div className="border border-slate-700 rounded bg-slate-950/40">
      {/* HEADER */}
      <button
        onClick={handleToggle}
        className="w-full flex justify-between items-center px-3 py-2 bg-slate-900 hover:bg-slate-800 border-b border-slate-700"
      >
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded border border-slate-600 text-[11px] font-mono text-slate-200 bg-slate-800">
            {charLabel}
          </span>
          <span className="font-semibold text-slate-100">
            {charFullLabel}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-300">
          <span className={
            charTotal >= SKILL_EXPERT_THRESHOLD ? "text-green-400" :
            charTotal >= SKILL_TRAINED_THRESHOLD ? "text-amber-300" :
            charTotal >= SKILL_BASIC_THRESHOLD ? "text-slate-200" :
            "text-red-400"
          }>
            Base total: {charTotal}
          </span>

          <span>{trainedCount} trained</span>

          <span className="text-slate-500">
            {collapsed ? "▼" : "▲"}
          </span>
        </div>
      </button>

      {/* BODY */}
      {!collapsed && (
        <div className="p-3 space-y-3">
          {skills
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((skill) => (
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