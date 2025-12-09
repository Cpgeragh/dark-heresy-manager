// src/pages/characterSheet/SkillsTab.tsx

import type { SkillEntry } from "../../types/Character";

interface SkillsTabProps {
  skills: SkillEntry[];
  editable: boolean;
  onUpdate: (next: SkillEntry[]) => void;
}

export function SkillsTab({ skills, editable, onUpdate }: SkillsTabProps) {
  if (!skills || skills.length === 0) {
    return <p className="text-slate-300">No skills recorded.</p>;
  }

  // Sorted for display only
  const sorted = [...skills].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );

  const updateSkill = (id: string, updated: SkillEntry) => {
    const next = sorted.map((s) => (s.id === id ? updated : s));
    onUpdate(next);
  };

  return (
    <div className="space-y-4 text-slate-300">
      {sorted.map((skill) => (
        <div
          key={skill.id}
          className="border border-slate-700 p-3 rounded bg-slate-900/40"
        >
          {/* NAME & CHARACTERISTIC */}
          <div className="flex justify-between mb-2">
            <h3 className="font-semibold text-slate-200">{skill.name}</h3>
            <span className="text-xs text-slate-500">
              Stat: {skill.characteristic.toUpperCase()}
            </span>
          </div>

          {/* LEVEL */}
          <label className="block mb-2">
            <span className="text-sm text-slate-400">Training Level:</span>
            <select
              disabled={!editable}
              value={skill.level}
              onChange={(e) =>
                updateSkill(skill.id, {
                  ...skill,
                  level: e.target.value as SkillEntry["level"],
                })
              }
              className="mt-1 p-1 bg-slate-800 border border-slate-600 rounded text-slate-100"
            >
              <option value="untrained">Untrained</option>
              <option value="trained">Trained</option>
              <option value="+10">+10</option>
              <option value="+20">+20</option>
            </select>
          </label>

          {/* MISC MODIFIER */}
          <label className="block mb-2">
            <span className="text-sm text-slate-400">Misc Modifier:</span>
            <input
              disabled={!editable}
              type="number"
              value={skill.miscModifier ?? 0}
              onChange={(e) =>
                updateSkill(skill.id, {
                  ...skill,
                  miscModifier: Number(e.target.value),
                })
              }
              className="mt-1 p-1 w-20 bg-slate-800 border border-slate-600 rounded text-slate-100"
            />
          </label>

          {/* NOTES */}
          <label className="block">
            <span className="text-sm text-slate-400">Notes:</span>
            <textarea
              disabled={!editable}
              value={skill.notes ?? ""}
              onChange={(e) =>
                updateSkill(skill.id, {
                  ...skill,
                  notes: e.target.value,
                })
              }
              className="mt-1 w-full h-16 p-1 bg-slate-800 border border-slate-600 rounded text-slate-100"
            />
          </label>
        </div>
      ))}
    </div>
  );
}