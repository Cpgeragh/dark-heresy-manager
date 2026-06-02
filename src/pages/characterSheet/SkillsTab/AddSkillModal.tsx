// src/pages/characterSheet/SkillsTab/AddSkillModal.tsx

import { useState, useCallback } from "react";
import { CHAR_LABEL, type SkillWithComputed } from "./skillsConstants";
import { charColour } from "../../../ui/sourceStyles";
import { InfoModal } from "../../../components/InfoModal";
import { SKILL_DESCRIPTIONS } from "../../../data/skillDescriptions";

interface AddSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  untrainedSkills: SkillWithComputed[];
  onAdd: (id: string) => void;
}

export function AddSkillModal({
  isOpen,
  onClose,
  untrainedSkills,
  onAdd,
}: AddSkillModalProps) {
  const [search, setSearch] = useState("");

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value),
    []
  );

  const handleAdd = useCallback(
    (id: string) => onAdd(id),
    [onAdd]
  );

  const filtered = untrainedSkills
    .filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex flex-col w-full sm:max-w-lg bg-slate-900 border border-slate-500 sm:rounded-xl shadow-2xl overflow-hidden max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 shrink-0">
          <span className="text-sm font-semibold text-slate-100 uppercase tracking-wide">
            Add Skill
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-100 text-lg leading-none transition"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-slate-700 shrink-0">
          <input
            type="text"
            placeholder="Search skills…"
            value={search}
            onChange={handleSearchChange}
            autoFocus
            className="w-full px-3 py-2 rounded border border-slate-500 bg-slate-800 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Skill list */}
        <div className="overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-8">
              No skills found.
            </p>
          ) : (
            <ul className="divide-y divide-slate-800">
              {filtered.map((skill) => (
                <li key={skill.id}>
                  <button
                    onClick={() => handleAdd(skill.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-800 transition"
                  >
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <span className="text-sm text-slate-100 truncate">
                        {skill.name}
                      </span>
                      {SKILL_DESCRIPTIONS[skill.name] && (
                        <span onClick={(e) => e.stopPropagation()}>
                          <InfoModal title={skill.name} content={SKILL_DESCRIPTIONS[skill.name]} />
                        </span>
                      )}
                    </div>

                    <span
                      className={`px-1.5 py-0.5 rounded border bg-slate-800 text-[10px] font-mono shrink-0 ${charColour(skill.characteristic)}`}
                    >
                      {CHAR_LABEL[skill.characteristic]}
                    </span>

                    <span
                      className={`px-1.5 py-0.5 rounded border text-[10px] shrink-0 ${
                        skill.advanced
                          ? "bg-purple-700/40 border-purple-500 text-purple-300"
                          : "bg-teal-900/40 border-teal-700/50 text-teal-300"
                      }`}
                    >
                      {skill.advanced ? "Advanced" : "Basic"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
