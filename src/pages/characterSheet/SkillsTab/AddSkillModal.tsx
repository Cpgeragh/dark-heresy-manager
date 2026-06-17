// src/pages/characterSheet/SkillsTab/AddSkillModal.tsx

import { useState } from "react";
import { CHAR_LABEL, type SkillWithComputed } from "./skillsConstants";
import { charColour } from "../../../ui/sourceStyles";
import { InfoModal } from "../../../components/InfoModal";
import { SKILL_DESCRIPTIONS } from "../../../data/skillDescriptions";
import { PickerModal } from "../../../ui/PickerModal";

interface AddSkillModalProps {
  isOpen: boolean;
  editable?: boolean;
  onClose: () => void;
  untrainedSkills: SkillWithComputed[];
  onAdd: (id: string) => void;
}

export function AddSkillModal({
  isOpen,
  editable = true,
  onClose,
  untrainedSkills,
  onAdd,
}: AddSkillModalProps) {
  const [search, setSearch] = useState("");

  const filtered = untrainedSkills
    .filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (!isOpen) return null;

  return (
    <PickerModal
      title="Add Skill"
      placeholder="Search skills…"
      query={search}
      onQueryChange={setSearch}
      onClose={onClose}
      isEmpty={filtered.length === 0}
      emptyMessage="No skills found."
    >
      {filtered.map((skill) => (
        <button
          key={skill.id}
          onClick={editable ? () => onAdd(skill.id) : undefined}
          className={`w-full flex items-center gap-3 px-4 lg:px-5 py-3 lg:py-4 text-left transition ${editable ? "hover:bg-slate-800 cursor-pointer" : "cursor-default"}`}
        >
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="text-sm lg:text-base text-slate-100 truncate">{skill.name}</span>
            {SKILL_DESCRIPTIONS[skill.name] && (
              <span
                className="inline-flex items-center leading-[0]"
                onClick={(e) => e.stopPropagation()}
              >
                <InfoModal title={skill.name} content={SKILL_DESCRIPTIONS[skill.name]} />
              </span>
            )}
          </div>
          <span
            className={`px-1.5 lg:px-2 py-0.5 rounded border bg-slate-800 text-[10px] lg:text-xs font-mono shrink-0 ${charColour(skill.characteristic)}`}
          >
            {CHAR_LABEL[skill.characteristic]}
          </span>
          <span
            className={`px-1.5 lg:px-2 py-0.5 rounded border text-[10px] lg:text-xs shrink-0 ${
              skill.advanced
                ? "bg-purple-700/40 border-purple-500 text-purple-300"
                : "bg-teal-900/40 border-teal-700/50 text-teal-300"
            }`}
          >
            {skill.advanced ? "Advanced" : "Basic"}
          </span>
        </button>
      ))}
    </PickerModal>
  );
}
