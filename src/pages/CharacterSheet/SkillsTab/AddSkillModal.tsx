// src/pages/CharacterSheet/SkillsTab/AddSkillModal.tsx

import { useState, useMemo, useRef } from "react";
import {
  CHAR_LABEL,
  getSkillGroupCharacteristics,
  type SkillWithComputed,
} from "./skillsConstants";
import type { SkillSource } from "../../../types/SkillSource";
import { characteristicChipColour, sourceChipColour } from "../../../ui/styles/sourceStyles";
import { Chip } from "../../../ui/chips/Chip";
import { Button } from "../../../ui/buttons/Button";
import { FilterButton } from "../../../ui/pickers/FilterButton";
import { PickerList, PickerModal, PickerBody, PickerRow } from "../../../ui/pickers/PickerModal";
import { PickerRowChips, PickerRowName } from "../../../ui/pickers/PickerRowParts";
import { ArrowRight, ArrowLeft } from "../../../ui/icons/PickerArrows";
import { SkillRow } from "./SkillRow";
import { editableInputClass, uiFormLabel } from "../../../ui/styles/editableStyles";
import { sanitizeNonNegativeIntegerInput } from "../../../utils/formInput";
import { canConfirmManualCostPurchase } from "../../../utils/dmGatedPurchase";
import { recordComponentRender } from "../../../performance/performanceMetrics";

interface AddSkillModalProps {
  isOpen: boolean;
  title?: string;
  allSkillsTitle?: string;
  showAllLabel?: string;
  editable?: boolean;
  onClose: () => void;
  untrainedSkills: SkillWithComputed[];
  onAdd: (id: string, manualCost?: number) => void;
  hideLevelChip?: boolean;
  /** Real training cost for whichever skills are unlocked for this character. When omitted, every skill shows with no restriction. */
  unlockedCosts?: Map<string, number>;
  isDM?: boolean;
}

type ListItem =
  | { type: "skill"; skill: SkillWithComputed }
  | { type: "group"; category: string; skills: SkillWithComputed[] };

function groupSkills(skills: SkillWithComputed[], search: string): ListItem[] {
  const query = search.trim().toLowerCase();
  const filtered = skills.filter((s) => s.name.toLowerCase().includes(query));

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
}

export function AddSkillModal({
  isOpen,
  title,
  allSkillsTitle,
  showAllLabel = "Show all skills",
  editable = true,
  onClose,
  untrainedSkills,
  onAdd,
  hideLevelChip = false,
  unlockedCosts,
  isDM = false,
}: AddSkillModalProps) {
  recordComponentRender("AddSkillModal");
  const [search, setSearch] = useState("");
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [showOverflow, setShowOverflow] = useState(false);
  const [pendingManualSkill, setPendingManualSkill] = useState<SkillWithComputed | null>(null);
  const [manualCost, setManualCost] = useState("");
  const listScrollPositionRef = useRef(0);
  const overflowScrollPositionRef = useRef(0);
  const modalTitle = title ?? (editable ? "Add Skill" : "View Skills");

  const handleClose = () => {
    setSearch("");
    setOpenCategory(null);
    setShowOverflow(false);
    onClose();
  };

  const handleSelect = (skill: SkillWithComputed) => {
    onAdd(skill.id);
  };

  const attemptOverflowAdd = (skill: SkillWithComputed) => {
    setPendingManualSkill(skill);
    setManualCost("");
  };

  const visibleSkills = unlockedCosts
    ? untrainedSkills.filter((s) => unlockedCosts.has(s.id))
    : untrainedSkills;

  const listItems = useMemo(() => groupSkills(visibleSkills, search), [visibleSkills, search]);
  const overflowListItems = useMemo(
    () => groupSkills(untrainedSkills, search),
    [untrainedSkills, search]
  );
  const categorySourceItems = showOverflow ? overflowListItems : listItems;
  const openGroup = openCategory
    ? categorySourceItems.find(
        (item): item is Extract<ListItem, { type: "group" }> =>
          item.type === "group" && item.category === openCategory && item.skills.length > 0
      )
    : undefined;

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
            autoComplete="off"
          />
        </PickerBody>
      </PickerModal>
    );
  }

  if (openCategory && openGroup) {
    const skills = openGroup.skills;
    const canSelect = editable && (!showOverflow || canConfirmManualCostPurchase(isDM));

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
        <PickerList data-testid="skill-picker-card-list">
          {skills.map((skill) => (
            <SkillRow
              key={skill.id}
              skill={skill}
              editable={false}
              previewMode
              updateLevel={() => {}}
              onSelect={
                canSelect
                  ? () => (showOverflow ? attemptOverflowAdd(skill) : handleSelect(skill))
                  : undefined
              }
              indented
              hideLevelChip={hideLevelChip}
              cost={showOverflow ? undefined : unlockedCosts?.get(skill.id)}
            />
          ))}
        </PickerList>
      </PickerModal>
    );
  }

  const renderGroupRow = (item: Extract<ListItem, { type: "group" }>) => (
    <PickerRow
      key={item.category}
      onClick={() => setOpenCategory(item.category)}
      trailing={<ArrowRight />}
    >
      <PickerRowName name={item.category} />
      <PickerRowChips>
        {[
          ...new Set(
            item.skills.map((skill) => skill.source).filter((s): s is SkillSource => Boolean(s))
          ),
        ].map((source) => (
          <Chip
            key={source}
            size="sm"
            colour={sourceChipColour(source)}
            className="font-code shrink-0"
          >
            {source}
          </Chip>
        ))}
        {getSkillGroupCharacteristics(item.skills).map((characteristic) => (
          <Chip
            key={characteristic}
            size="sm"
            colour={characteristicChipColour(characteristic)}
            className="font-code shrink-0"
          >
            {CHAR_LABEL[characteristic]}
          </Chip>
        ))}
        {item.skills[0].advanced && (
          <Chip size="sm" colour="purple" className="shrink-0">
            Advanced
          </Chip>
        )}
      </PickerRowChips>
    </PickerRow>
  );

  if (showOverflow) {
    const canSelect = editable && canConfirmManualCostPurchase(isDM);
    return (
      <PickerModal
        title={allSkillsTitle ?? modalTitle}
        titleClassName="text-red-500"
        placeholder="Search skills…"
        query={search}
        onQueryChange={setSearch}
        onClose={() => setShowOverflow(false)}
        closeLabel={<ArrowLeft />}
        closeAriaLabel="Back"
        scrollPositionRef={overflowScrollPositionRef}
        isEmpty={overflowListItems.length === 0}
        emptyMessage="No skills found."
      >
        <PickerList data-testid="skill-picker-card-list">
          {overflowListItems.map((item) => {
            if (item.type === "skill") {
              return (
                <SkillRow
                  key={item.skill.id}
                  skill={item.skill}
                  editable={false}
                  previewMode
                  updateLevel={() => {}}
                  onSelect={canSelect ? () => attemptOverflowAdd(item.skill) : undefined}
                  hideLevelChip={hideLevelChip}
                />
              );
            }
            return renderGroupRow(item);
          })}
        </PickerList>
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
          <FilterButton className="w-full" onClick={() => setShowOverflow(true)}>
            {showAllLabel}
          </FilterButton>
        )
      }
    >
      <PickerList data-testid="skill-picker-card-list">
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
          return renderGroupRow(item);
        })}
      </PickerList>
    </PickerModal>
  );
}
