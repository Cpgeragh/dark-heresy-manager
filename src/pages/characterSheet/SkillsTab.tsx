// src/pages/characterSheet/SkillsTab.tsx

import type { Character } from "../../types/Character";
import type { CharField } from "../../utils/characterFactory";

interface SkillsTabProps {
  skills: Character["skills"]; // SkillEntry[]
  editable: boolean;
  onUpdate: (next: Character["skills"]) => void;
  getCharField: (statKey: keyof Character["characteristics"]) => CharField;
}

export function SkillsTab({
  skills,
  editable,
  onUpdate,
  getCharField,
}: SkillsTabProps) {

  // Sorted COPY for display only (do NOT mutate original)
  const sortedSkills = [...skills].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  function updateLevel(skillId: string, newLevel: string) {
    const next = skills.map((s) =>
      s.id === skillId ? { ...s, level: newLevel as any } : s
    );
    onUpdate(next);
  }

  function computeSkillTotal(skill: Character["skills"][number]) {
    const { characteristic, level, miscModifier = 0 } = skill;

    const field = getCharField(characteristic);
    const baseTotal = field.base + field.advances;

    const lvlMod =
      level === "trained" ? 0 :
      level === "+10" ? 10 :
      level === "+20" ? 20 :
      -20; // untrained

    return baseTotal + lvlMod + miscModifier;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Skills</h2>

      <div className="space-y-3">
        {sortedSkills.map((skill) => (
          <div
            key={skill.id}
            className="p-3 border border-slate-700 bg-slate-900/40 rounded"
          >
            <div className="font-semibold text-slate-200">{skill.name}</div>

            <div className="text-xs text-slate-400">
              Uses: {skill.characteristic.toUpperCase()}
            </div>

            <div className="flex flex-wrap gap-2 mt-2 text-sm">
              {["untrained", "trained", "+10", "+20"].map((lvl) => (
                <button
                  key={lvl}
                  disabled={!editable}
                  onClick={() => updateLevel(skill.id, lvl)}
                  className={`px-2 py-1 rounded border text-xs ${
                    skill.level === lvl
                      ? "bg-amber-500 text-slate-900 border-amber-400"
                      : "border-slate-600 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-400 mt-2">
              Total:{" "}
              <span className="text-slate-200">{computeSkillTotal(skill)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}