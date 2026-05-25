// src/pages/characterSheet/Skills/SkillCard.tsx

import { useCallback } from "react";
import type { SkillEntry, SkillAdvanceLevel } from "../../../../types/Character";
import { InfoModal } from "../../../../components/InfoModal";
import { SKILL_DESCRIPTIONS } from "../../../../data/skillDescriptions";
import type { SkillWithComputed } from "./constants";
import {
  SKILL_EXPERT_THRESHOLD,
  SKILL_TRAINED_THRESHOLD,
  SKILL_BASIC_THRESHOLD,
} from "../../../../constants/gameRules";

import {
  editableInputClass,
  editableTextareaClass,
} from "../../../../ui/editableStyles";

interface SkillCardProps {
  skill: SkillWithComputed;
  editable: boolean;
  compact: boolean;
  updateLevel: (id: string, level: SkillAdvanceLevel) => void;
  updateMisc: (id: string, value: number) => void;
  updateNotes: (id: string, notes: string) => void;
}

const CHAR_LABEL: Record<SkillEntry["characteristic"], string> = {
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

function getTotalColor(total: number | null): string {
  if (total === null) return "text-slate-400";
  if (total >= SKILL_EXPERT_THRESHOLD) return "text-green-400";
  if (total >= SKILL_TRAINED_THRESHOLD) return "text-amber-300";
  if (total >= SKILL_BASIC_THRESHOLD) return "text-slate-200";
  return "text-red-400";
}

export function SkillCard({
  skill,
  editable,
  compact,
  updateLevel,
  updateMisc,
  updateNotes,
}: SkillCardProps) {
  const description = SKILL_DESCRIPTIONS[skill.name];
  const totalColor = getTotalColor(skill.total);

  const handleLevelClick = useCallback((value: SkillAdvanceLevel) => {
    updateLevel(skill.id, value);
  }, [skill.id, updateLevel]);

  const handleMiscChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateMisc(skill.id, Number(e.target.value));
  }, [skill.id, updateMisc]);

  const handleNotesChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNotes(skill.id, e.target.value);
  }, [skill.id, updateNotes]);

  return (
    <div
      className={`rounded border px-3 py-2 space-y-2 ${
        editable
          ? "border-slate-700 bg-slate-900/40"
          : "border-slate-800 bg-slate-900/20"
      }`}
    >
      {/* HEADER */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="font-semibold text-slate-200">
            {skill.name}
          </div>

          <span className="px-1.5 py-0.5 rounded border border-slate-600 bg-slate-800 text-[10px] font-mono text-slate-200">
            {CHAR_LABEL[skill.characteristic]}
          </span>

          {skill.category && (
            <span className="px-1.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] text-slate-300">
              {skill.category}
            </span>
          )}

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

          {description && (
            <InfoModal title={skill.name} content={description} />
          )}
        </div>

        <div
          className={`text-2xl font-semibold font-mono leading-none ${totalColor}`}
          title="Skill Test Target"
        >
          {skill.total ?? "--"}
        </div>
      </div>

      {/* COMPACT MODE */}
      {compact ? (
        <div className="flex gap-4 text-xs text-slate-400">
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
          {/* TRAINING LEVEL */}
          <div className="flex flex-wrap gap-2 text-xs">
            {([
              ["untrained", "Untrained"],
              ["trained", "Trained"],
              ["+10", "+10"],
              ["+20", "+20"],
            ] as const).map(([value, label]) => {
              const active = skill.level === value;

              return (
                <button
                  key={value}
                  disabled={!editable}
                  onClick={() => handleLevelClick(value)}
                  aria-label={`Set skill level to ${label}`}
                  aria-pressed={active}
                  className={`px-2 py-1 rounded border transition ${
                    active
                      ? "bg-amber-500 text-slate-900 border-amber-400"
                      : editable
                      ? "border-slate-600 text-slate-300 hover:bg-slate-800"
                      : "border-slate-700 text-slate-500 opacity-60 cursor-not-allowed"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* MODIFIERS */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1">
              <span>Misc:</span>
              <input
                type="number"
                disabled={!editable}
                value={skill.miscModifier ?? 0}
                onChange={handleMiscChange}
                aria-label={`${skill.name} miscellaneous modifier`}
                className={
                  editableInputClass(editable) +
                  " w-16 px-1 py-0.5 text-xs"
                }
              />
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
          <div>
            <textarea
              placeholder="Notes (optional)…"
              disabled={!editable}
              value={skill.notes ?? ""}
              onChange={handleNotesChange}
              aria-label={`${skill.name} notes`}
              className={
                editableTextareaClass(editable) +
                " min-h-[36px] text-xs"
              }
            />
          </div>
        </>
      )}
    </div>
  );
}