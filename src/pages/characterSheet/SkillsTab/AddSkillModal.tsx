// src/pages/characterSheet/SkillsTab/AddSkillModal.tsx

import { useState, useMemo } from "react";
import { CHAR_LABEL, type SkillWithComputed } from "./skillsConstants";
import { charColour } from "../../../ui/sourceStyles";
import { Chip } from "../../../ui/Chip";
import { PickerModal } from "../../../ui/PickerModal";
import { SkillRow } from "./SkillRow";
import { colourPurple } from "../../../ui/colourTokens";
import { uiItemName } from "../../../ui/editableStyles";

interface AddSkillModalProps {
  isOpen: boolean;
  title?: string;
  editable?: boolean;
  onClose: () => void;
  untrainedSkills: SkillWithComputed[];
  onAdd: (id: string) => void;
  hideLevelChip?: boolean;
}

type ListItem =
  | { type: "skill"; skill: SkillWithComputed }
  | { type: "group"; category: string; skills: SkillWithComputed[] };

export function AddSkillModal({
  isOpen,
  title,
  editable = true,
  onClose,
  untrainedSkills,
  onAdd,
  hideLevelChip = false,
}: AddSkillModalProps) {
  const [search, setSearch] = useState("");
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const modalTitle = title ?? (editable ? "Add Skill" : "View Skills");

  const listItems = useMemo((): ListItem[] => {
    const query = search.toLowerCase();
    const filtered = untrainedSkills.filter((s) =>
      s.name.toLowerCase().includes(query)
    );

    const groups = new Map<string, SkillWithComputed[]>();
    const general: SkillWithComputed[] = [];

    for (const skill of filtered) {
      if (skill.category === "General") {
        general.push(skill);
      } else {
        const arr = groups.get(skill.category) ?? [];
        arr.push(skill);
        groups.set(skill.category, arr);
      }
    }

    const items: ListItem[] = [
      ...general.map((skill): ListItem => ({ type: "skill", skill })),
      ...[...groups.entries()].map(
        ([category, skills]): ListItem => ({ type: "group", category, skills })
      ),
    ];

    return items.sort((a, b) => {
      const aKey = a.type === "skill" ? a.skill.name : a.category;
      const bKey = b.type === "skill" ? b.skill.name : b.category;
      return aKey.localeCompare(bKey);
    });
  }, [untrainedSkills, search]);

  if (!isOpen) return null;

  if (openCategory) {
    const group = listItems.find(
      (i): i is Extract<ListItem, { type: "group" }> => i.type === "group" && i.category === openCategory
    );
    const skills = group?.skills ?? [];

    return (
      <PickerModal
        title={openCategory}
        titleClassName="text-red-500"
        placeholder=""
        query=""
        onQueryChange={() => {}}
        onClose={() => setOpenCategory(null)}
        closeLabel="←"
        hideSearch
        isEmpty={skills.length === 0}
      >
        {skills.map((skill) => (
          <SkillRow
            key={skill.id}
            skill={skill}
            editable={false}
            previewMode
            updateLevel={() => {}}
            onSelect={editable ? onAdd : undefined}
            indented
            hideLevelChip={hideLevelChip}
          />
        ))}
      </PickerModal>
    );
  }

  return (
    <PickerModal
      title={modalTitle}
      titleClassName="text-red-500"
      placeholder="Search skills…"
      query={search}
      onQueryChange={setSearch}
      onClose={onClose}
      isEmpty={listItems.length === 0}
      emptyMessage="No skills found."
    >
      {listItems.map((item) => {
        if (item.type === "skill") {
          return (
            <SkillRow
              key={item.skill.id}
              skill={item.skill}
              editable={false}
              previewMode
              updateLevel={() => {}}
              onSelect={editable ? onAdd : undefined}
              hideLevelChip={hideLevelChip}
            />
          );
        }

        return (
          <div key={item.category} className="rounded border border-slate-500 bg-slate-800/60 overflow-hidden">
            <button
              onClick={() => setOpenCategory(item.category)}
              className="w-full flex items-center gap-3 px-4 lg:px-5 py-3 lg:py-4 text-left hover:bg-slate-700/40 transition group"
            >
              <div className="flex-1 min-w-0 space-y-1.5">
                <span className={`${uiItemName} truncate block group-hover:text-white`}>
                  {item.category}
                </span>
                <div className="flex items-center gap-1.5">
                  <Chip size="sm" className={`bg-slate-800 font-code shrink-0 ${charColour(item.skills[0].characteristic)}`}>
                    {CHAR_LABEL[item.skills[0].characteristic]}
                  </Chip>
                  {item.skills[0].advanced && (
                    <Chip size="sm" className={`shrink-0 ${colourPurple}`}>
                      Advanced
                    </Chip>
                  )}
                </div>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-300 shrink-0 -rotate-90">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        );
      })}
    </PickerModal>
  );
}
