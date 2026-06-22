// src/pages/characterSheet/SkillsTab/AddSkillModal.tsx

import { useState, useMemo, useCallback, useEffect } from "react";
import { CHAR_LABEL, type SkillWithComputed } from "./skillsConstants";
import { charColour } from "../../../ui/sourceStyles";
import { InfoModal } from "../../../components/InfoModal";
import { SKILL_DESCRIPTIONS } from "../../../data/skillDescriptions";
import { PickerModal } from "../../../ui/PickerModal";
import { SkillRow } from "./SkillRow";

interface AddSkillModalProps {
  isOpen: boolean;
  title?: string;
  editable?: boolean;
  previewMode?: boolean;
  onClose: () => void;
  untrainedSkills: SkillWithComputed[];
  onAdd: (id: string) => void;
}

type ListItem =
  | { type: "skill"; skill: SkillWithComputed }
  | { type: "group"; category: string; skills: SkillWithComputed[] };

export function AddSkillModal({
  isOpen,
  title,
  editable = true,
  previewMode = false,
  onClose,
  untrainedSkills,
  onAdd,
}: AddSkillModalProps) {
  const [search, setSearch] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
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

  useEffect(() => {
    if (search) {
      setExpandedGroups(
        new Set(
          listItems
            .filter((i): i is Extract<ListItem, { type: "group" }> => i.type === "group")
            .map((i) => i.category)
        )
      );
    } else {
      setExpandedGroups(new Set());
    }
  }, [search, listItems]);

  const toggleGroup = useCallback((category: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(category) ? next.delete(category) : next.add(category);
      return next;
    });
  }, []);

  if (!isOpen) return null;

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
          return previewMode ? (
            <SkillRow
              key={item.skill.id}
              skill={item.skill}
              editable={false}
              previewMode
              updateLevel={() => {}}
              updateMisc={() => {}}
            />
          ) : (
            <SkillPickerRow
              key={item.skill.id}
              skill={item.skill}
              editable={editable}
              onAdd={onAdd}
            />
          );
        }

        const isExpanded = expandedGroups.has(item.category);
        return (
          <div key={item.category}>
            <button
              onClick={(e) => {
                const wasExpanded = expandedGroups.has(item.category);
                toggleGroup(item.category);
                if (!wasExpanded) {
                  const btn = e.currentTarget;
                  setTimeout(() => btn.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
                }
              }}
              className="w-full flex items-center gap-3 px-4 lg:px-5 py-3 lg:py-4 text-left hover:bg-slate-800 transition"
            >
              <span className="text-sm lg:text-base font-semibold text-slate-100 flex-1 min-w-0 truncate">
                {item.category}
              </span>
              <span
                className={`px-1.5 lg:px-2 py-0.5 rounded border bg-slate-800 text-[10px] lg:text-xs font-code shrink-0 ${charColour(item.skills[0].characteristic)}`}
              >
                {CHAR_LABEL[item.skills[0].characteristic]}
              </span>
              {item.skills[0].advanced && (
                <span className="px-1.5 lg:px-2 py-0.5 rounded border text-[10px] lg:text-xs shrink-0 bg-purple-700/40 border-purple-500 text-purple-300">
                  Advanced
                </span>
              )}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isExpanded ? "" : "-rotate-90"}`}
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            {isExpanded && (
              <div className="border-t border-slate-700/50 bg-slate-900/40">
                {item.skills.map((skill) => previewMode ? (
                  <SkillRow
                    key={skill.id}
                    skill={skill}
                    editable={false}
                    previewMode
                    updateLevel={() => {}}
                    updateMisc={() => {}}
                  />
                ) : (
                  <SkillPickerRow
                    key={skill.id}
                    skill={skill}
                    editable={editable}
                    onAdd={onAdd}
                    indented
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </PickerModal>
  );
}

function SkillPickerRow({
  skill,
  editable,
  onAdd,
  indented = false,
}: {
  skill: SkillWithComputed;
  editable: boolean;
  onAdd: (id: string) => void;
  indented?: boolean;
}) {
  const displayName = indented
    ? skill.name.slice(skill.category.length).trim().replace(/^\(|\)$/g, "").trim() ||
      skill.name
    : skill.name;

  return (
    <button
      onClick={editable ? () => onAdd(skill.id) : undefined}
      className={`w-full flex items-center gap-3 py-3 lg:py-4 text-left transition border-b border-slate-700/30 last:border-b-0 ${
        indented ? "pl-7 lg:pl-9 pr-4 lg:pr-5" : "px-4 lg:px-5"
      } ${editable ? "hover:bg-slate-800 cursor-pointer" : "cursor-default"}`}
    >
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <span className="text-sm lg:text-base text-slate-100 truncate">{displayName}</span>
        {SKILL_DESCRIPTIONS[skill.name] && (
          <span
            className="inline-flex items-center -translate-y-[1.4px]"
            onClick={(e) => e.stopPropagation()}
          >
            <InfoModal title={skill.name} content={SKILL_DESCRIPTIONS[skill.name]} />
          </span>
        )}
      </div>
      <span
        className={`px-1.5 lg:px-2 py-0.5 rounded border bg-slate-800 text-[10px] lg:text-xs font-code shrink-0 ${charColour(
          skill.characteristic
        )}`}
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
  );
}
