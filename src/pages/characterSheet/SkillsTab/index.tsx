// src/pages/characterSheet/SkillsTab/index.tsx

import { useState, useCallback } from "react";
import type { Characteristics, SkillEntry } from "../../../types/Character";
import type { CharField } from "../../../utils/characterFactory";
import { useSkillComputation } from "../../../hooks/useSkillComputation";
import { uiSectionHeader } from "../../../ui/editableStyles";
import { SkillRow } from "./SkillRow";
import { AddSkillModal } from "./AddSkillModal";

interface SkillsTabProps {
  skills: SkillEntry[];
  editable: boolean;
  onUpdate: (next: SkillEntry[]) => void;
  getCharField: (statKey: keyof Characteristics) => CharField;
}

export function SkillsTab({ skills, editable, onUpdate, getCharField }: SkillsTabProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);

  const computedSkills = useSkillComputation({ skills, getCharField });

  const trainedSkills = computedSkills
    .filter((s) => s.level !== "untrained")
    .sort((a, b) => a.name.localeCompare(b.name));

  const untrainedSkills = computedSkills
    .filter((s) => s.level === "untrained")
    .sort((a, b) => a.name.localeCompare(b.name));

  const updateLevel = useCallback(
    (id: string, level: SkillEntry["level"]) =>
      onUpdate(skills.map((s) => (s.id === id ? { ...s, level } : s))),
    [skills, onUpdate]
  );

  const updateMisc = useCallback(
    (id: string, value: number) =>
      onUpdate(skills.map((s) => (s.id === id ? { ...s, miscModifier: value } : s))),
    [skills, onUpdate]
  );

  const handleAdd = useCallback(
    (id: string) =>
      onUpdate(skills.map((s) => (s.id === id ? { ...s, level: "trained" } : s))),
    [skills, onUpdate]
  );

  return (
    <div className="space-y-4 text-slate-100">

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className={uiSectionHeader}>Trained Skills</p>
        {editable && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="text-xs px-3 py-1.5 rounded border border-slate-500 bg-slate-800 text-slate-100 hover:bg-slate-700 transition"
          >
            + Add Skill
          </button>
        )}
      </div>

      {/* Skill list */}
      {trainedSkills.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">
          {editable
            ? 'No trained skills yet. Tap "+ Add Skill" to get started.'
            : "No trained skills yet."}
        </p>
      ) : (
        <div className="space-y-2">
          {trainedSkills.map((skill) => (
            <SkillRow
              key={skill.id}
              skill={skill}
              editable={editable}
              updateLevel={updateLevel}
              updateMisc={updateMisc}
            />
          ))}
        </div>
      )}

      {/* Add skill modal */}
      <AddSkillModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        untrainedSkills={untrainedSkills}
        onAdd={handleAdd}
      />

    </div>
  );
}
