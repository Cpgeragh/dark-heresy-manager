import type { SkillWithComputed } from "./constants";
import { SkillCard } from "./SkillCard";

interface CategoryGroupProps {
  category: string;
  skills: SkillWithComputed[];
  editable: boolean;
  compact: boolean;
  collapsed: boolean;
  setCollapsed: (next: boolean) => void;

  updateLevel: (id: string, lvl: SkillWithComputed["level"]) => void;
  updateMisc: (id: string, val: number) => void;
  updateNotes: (id: string, notes: string) => void;
}

export function CategoryGroup({
  category,
  skills,
  editable,
  compact,
  collapsed,
  setCollapsed,
  updateLevel,
  updateMisc,
  updateNotes,
}: CategoryGroupProps) {
  const trainedCount = skills.filter((s) => s.level !== "untrained").length;

  return (
    <div className="border border-slate-700 rounded bg-slate-950/40">
      {/* HEADER */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex justify-between items-center px-3 py-2 bg-slate-900 hover:bg-slate-800 border-b border-slate-700"
      >
        <span className="font-semibold text-slate-100">{category}</span>

        <div className="flex items-center gap-4 text-xs text-slate-300">
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