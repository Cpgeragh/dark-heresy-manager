// src/pages/characterSheet/SkillsTab/AddSkillModal.tsx

import { useState, useMemo, useRef } from "react";
import {
  CHAR_LABEL,
  getSkillGroupCharacteristics,
  type SkillWithComputed,
} from "./skillsConstants";
import { charColour, sourceColour } from "../../../ui/sourceStyles";
import { Chip } from "../../../ui/Chip";
import { Button } from "../../../ui/Button";
import { PickerModal, PickerBody } from "../../../ui/PickerModal";
import { ArrowRight, ArrowLeft } from "../../../ui/PickerArrows";
import { SkillRow } from "./SkillRow";
import { colourPurple } from "../../../ui/colourTokens";
import { editableInputClass, uiFormLabel, uiItemName, uiSectionShell } from "../../../ui/editableStyles";
import { uiPickerPressFeedback } from "../../../ui/buttonStyles";
import { sanitizeNonNegativeIntegerInput } from "../../../utils/formInput";

interface AddSkillModalProps {
  isOpen: boolean;
  title?: string;
  editable?: boolean;
  onClose: () => void;
  untrainedSkills: SkillWithComputed[];
  onAdd: (id: string, manualCost?: number) => void;
  hideLevelChip?: boolean;
  /** Real training cost for whichever skills are unlocked for this character. When omitted, every skill shows with no restriction, matching the old behaviour. */
  unlockedCosts?: Map<string, number>;
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
  unlockedCosts,
}: AddSkillModalProps) {
  const [search, setSearch] = useState("");
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [pendingManualSkill, setPendingManualSkill] = useState<SkillWithComputed | null>(null);
  const [manualCost, setManualCost] = useState("");
  const listScrollPositionRef = useRef(0);
  const modalTitle = title ?? (editable ? "Add Skill" : "View Skills");

  const handleClose = () => {
    setSearch("");
    setOpenCategory(null);
    setShowAll(false);
    onClose();
  };

  const handleSelect = (skill: SkillWithComputed) => {
    const knownCost = unlockedCosts?.get(skill.id);
    if (knownCost !== undefined) {
      onAdd(skill.id);
      return;
    }
    if (unlockedCosts) {
      setPendingManualSkill(skill);
      setManualCost("");
      return;
    }
    onAdd(skill.id);
  };

  const visibleSkills =
    unlockedCosts && !showAll
      ? untrainedSkills.filter((s) => unlockedCosts.has(s.id))
      : untrainedSkills;

  const listItems = useMemo((): ListItem[] => {
    const query = search.trim().toLowerCase();
    const filtered = visibleSkills.filter((s) =>
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
  }, [visibleSkills, search]);

  if (!isOpen) return null;

  if (pendingManualSkill) {
    const cost = Number(manualCost);
    const canConfirm = manualCost.trim() !== "";
    return (
      <PickerModal
        title={`Train ${pendingManualSkill.name}`}
        titleClassName="text-red-500"
        closeLabel={<ArrowLeft />}
        closeAriaLabel="Back"
        query=""
        onQueryChange={() => undefined}
        onClose={() => setPendingManualSkill(null)}
        isEmpty={false}
        hideSearch
        footer={
          <Button
            className="w-full"
            disabled={!canConfirm}
            onClick={() => {
              onAdd(pendingManualSkill.id, cost);
              setPendingManualSkill(null);
              setManualCost("");
            }}
          >
            Train {pendingManualSkill.name}
          </Button>
        }
      >
        <PickerBody>
          <label className={uiFormLabel}>XP Cost</label>
          <input
            type="text"
            inputMode="numeric"
            value={manualCost}
            onChange={(event) => setManualCost(sanitizeNonNegativeIntegerInput(event.target.value))}
            placeholder="0"
            className={editableInputClass(true) + " mt-0.5"}
          />
        </PickerBody>
      </PickerModal>
    );
  }

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
        closeLabel={<ArrowLeft />}
        closeAriaLabel="Back"
        hideSearch
        isEmpty={skills.length === 0}
      >
        <div className="space-y-3 p-3 lg:p-4" data-testid="skill-picker-card-list">
          {skills.map((skill) => (
            <SkillRow
              key={skill.id}
              skill={skill}
              editable={false}
              previewMode
              updateLevel={() => {}}
              onSelect={editable ? () => handleSelect(skill) : undefined}
              indented
              hideLevelChip={hideLevelChip}
              cost={unlockedCosts?.get(skill.id)}
            />
          ))}
        </div>
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
      onClose={handleClose}
      scrollPositionRef={listScrollPositionRef}
      isEmpty={listItems.length === 0}
      emptyMessage="No skills found."
      filterRow={
        unlockedCosts && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="w-full rounded border border-slate-500 bg-slate-900 px-2 py-1 text-xs lg:text-sm text-slate-200 text-left"
          >
            {showAll ? "Show only what's available" : "Show all skills"}
          </button>
        )
      }
    >
      <div className="space-y-3 p-3 lg:p-4" data-testid="skill-picker-card-list">
      {listItems.map((item) => {
        if (item.type === "skill") {
          return (
            <SkillRow
              key={item.skill.id}
              skill={item.skill}
              editable={false}
              previewMode
              updateLevel={() => {}}
              onSelect={editable ? () => handleSelect(item.skill) : undefined}
              hideLevelChip={hideLevelChip}
              cost={unlockedCosts?.get(item.skill.id)}
            />
          );
        }

        return (
          <div key={item.category} className={uiSectionShell + " overflow-hidden"}>
            <button type="button"
              onClick={() => setOpenCategory(item.category)}
              className={`w-full flex items-center gap-3 px-4 lg:px-5 py-3 lg:py-4 text-left hover:bg-slate-700/40 transition group ${uiPickerPressFeedback(editable)}`}
            >
              <div className="flex-1 min-w-0 space-y-1.5">
                <span className={`${uiItemName} truncate block group-hover:text-white`}>
                  {item.category}
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[...new Set(item.skills.map((skill) => skill.source).filter(Boolean))].map((source) => (
                    <Chip
                      key={source}
                      size="sm"
                      className={`bg-slate-800/40 font-code shrink-0 ${sourceColour(source!)}`}
                    >
                      {source}
                    </Chip>
                  ))}
                  {getSkillGroupCharacteristics(item.skills).map((characteristic) => (
                    <Chip
                      key={characteristic}
                      size="sm"
                      className={`bg-slate-800 font-code shrink-0 ${charColour(characteristic)}`}
                    >
                      {CHAR_LABEL[characteristic]}
                    </Chip>
                  ))}
                  {item.skills[0].advanced && (
                    <Chip size="sm" className={`shrink-0 ${colourPurple}`}>
                      Advanced
                    </Chip>
                  )}
                </div>
              </div>
              <ArrowRight />
            </button>
          </div>
        );
      })}
      </div>
    </PickerModal>
  );
}
