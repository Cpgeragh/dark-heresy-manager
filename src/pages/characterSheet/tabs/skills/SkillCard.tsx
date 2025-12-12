import type { SkillWithComputed } from "./constants";
import { CHAR_LABEL, getTotalColor } from "./constants";

interface SkillCardProps {
  skill: SkillWithComputed;
  editable: boolean;
  compact: boolean;
  updateLevel: (id: string, level: SkillWithComputed["level"]) => void;
  updateMisc: (id: string, value: number) => void;
  updateNotes: (id: string, notes: string) => void;
}

export function SkillCard({
  skill,
  editable,
  compact,
  updateLevel,
  updateMisc,
  updateNotes,
}: SkillCardProps) {
  const totalColor = getTotalColor(skill.total);

  return (
    <div
      key={skill.id}
      className="border border-slate-700 bg-slate-900/40 rounded px-3 py-2 space-y-1"
    >
      {/* HEADER */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="font-semibold text-slate-200">{skill.name}</div>

        {/* CHAR BADGE */}
        <span className="px-1.5 py-0.5 rounded border border-slate-600 text-[10px] font-mono text-slate-200 bg-slate-800">
          {CHAR_LABEL[skill.characteristic]}
        </span>

        {/* CATEGORY BADGE */}
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

        {/* ADVANCED/BASIC BADGE */}
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

      {/* COMPACT MODE */}
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
          {/* LEVEL BUTTONS */}
          <div className="flex flex-wrap gap-2 mt-2 text-xs">
            {["untrained", "trained", "+10", "+20"].map((lvl) => (
              <button
                key={lvl}
                disabled={!editable}
                onClick={() =>
                  updateLevel(skill.id, lvl as SkillWithComputed["level"])
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

          {/* MISC + TOTALS */}
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

          {/* NOTES */}
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