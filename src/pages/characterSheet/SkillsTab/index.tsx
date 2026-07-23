// src/pages/characterSheet/SkillsTab/index.tsx

import { useState, useCallback, useMemo } from "react";
import type { Characteristics, CorruptionBlock, SkillEntry } from "../../../types/Character";
import type { CharField } from "../../../types/Character";
import { useSkillComputation } from "../../../hooks/useSkillComputation";
import { useSwipeableTabs } from "../../../hooks/useSwipeableTabs";
import { getCharacteristicModifierTotals } from "../../../features/corruption/characteristicModifierTotals";
import { Button } from "../../../ui/Button";
import { SectionHeader } from "../../../ui/SectionHeader";
import { SegmentedTabs, type SegmentedTabOption } from "../../../ui/SegmentedTabs";
import {
  segmentedTabId,
  segmentedTabPanelId,
  uiSwipeableTabPanel,
} from "../../../ui/segmentedTabStyles";
import { uiSection, uiTextPlaceholder } from "../../../ui/editableStyles";
import { SkillRow } from "./SkillRow";
import { SkillGroupRow } from "./SkillGroupRow";
import { AddSkillModal } from "./AddSkillModal";
import type { SkillWithComputed } from "./skillsConstants";

interface SkillsTabProps {
  skills: SkillEntry[];
  editable: boolean;
  onUpdate: (next: SkillEntry[]) => void;
  getCharField: (statKey: keyof Characteristics) => CharField;
  corruption: CorruptionBlock;
}

type DisplayItem =
  | { type: "skill"; skill: SkillWithComputed }
  | { type: "group"; category: string; skills: SkillWithComputed[] };

type SkillsView = "basic" | "advanced";
const SKILLS_VIEWS = ["basic", "advanced"] as const satisfies readonly SkillsView[];
const SKILLS_TABS = [
  {
    value: "basic",
    label: "Basic",
    activeClassName: "border-violet-400 bg-violet-600/80 text-white shadow-sm shadow-violet-950/50",
  },
  {
    value: "advanced",
    label: "Advanced",
    activeClassName: "border-fuchsia-400 bg-fuchsia-600/80 text-white shadow-sm shadow-fuchsia-950/50",
  },
] as const satisfies readonly SegmentedTabOption<SkillsView>[];
const SKILLS_TABS_ID = "skill-type";

export function SkillsTab({ skills, editable, onUpdate, getCharField, corruption }: SkillsTabProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isUntrainedBasicOpen, setIsUntrainedBasicOpen] = useState(false);
  const [activeView, setActiveView] = useState<SkillsView>("basic");
  const { containerRef, transitionClass, switchTo: switchView } = useSwipeableTabs(
    SKILLS_VIEWS,
    activeView,
    setActiveView
  );

  const modifierTotals = getCharacteristicModifierTotals(corruption);
  const computedSkills = useSkillComputation({ skills, getCharField, modifierTotals });

  const trainedSkills = useMemo(
    () =>
      computedSkills
        .filter((s) => s.level !== "untrained" || !s.advanced)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [computedSkills]
  );

  const untrainedSkills = useMemo(
    () =>
      computedSkills
        .filter((s) => s.level === "untrained" && s.advanced)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [computedSkills]
  );

  const buildItems = useCallback(
    (view: SkillsView): DisplayItem[] => {
      const groups = new Map<string, SkillWithComputed[]>();
      for (const skill of trainedSkills) {
        const arr = groups.get(skill.category) ?? [];
        arr.push(skill);
        groups.set(skill.category, arr);
      }

      const items: DisplayItem[] = [];
      for (const [category, catSkills] of groups) {
        if (category === "General" || catSkills.length === 1) {
          for (const skill of catSkills) items.push({ type: "skill", skill });
        } else {
          items.push({ type: "group", category, skills: catSkills });
        }
      }

      return items
        .filter((item) => {
          const isAdv = item.type === "skill" ? item.skill.advanced : item.skills[0].advanced;
          return isAdv === (view === "advanced");
        })
        .sort((a, b) => {
          const aKey = a.type === "skill" ? a.skill.name : a.category;
          const bKey = b.type === "skill" ? b.skill.name : b.category;
          return aKey.localeCompare(bKey);
        });
    },
    [trainedSkills]
  );

  const activeItems = useMemo(() => buildItems(activeView), [buildItems, activeView]);
  const basicItems = useMemo(() => buildItems("basic"), [buildItems]);
  const advancedItems = useMemo(() => buildItems("advanced"), [buildItems]);

  const trainedBasicItems = useMemo(
    () => basicItems.filter((item) =>
      item.type === "skill" ? item.skill.level !== "untrained" : item.skills.some((s) => s.level !== "untrained")
    ),
    [basicItems]
  );
  const untrainedBasicSkills = useMemo(
    () => computedSkills.filter((s) => s.level === "untrained" && !s.advanced),
    [computedSkills]
  );

  const updateLevel = useCallback(
    (id: string, level: SkillEntry["level"]) =>
      onUpdate(skills.map((s) => (s.id === id ? { ...s, level } : s))),
    [skills, onUpdate]
  );

  const handleAdd = useCallback(
    (id: string) => onUpdate(skills.map((s) => (s.id === id ? { ...s, level: "trained" } : s))),
    [skills, onUpdate]
  );

  const renderItems = (items: DisplayItem[]) =>
    items.map((item) =>
      item.type === "skill" ? (
        <SkillRow
          key={item.skill.id}
          skill={item.skill}
          editable={editable}
          updateLevel={updateLevel}
        />
      ) : (
        <SkillGroupRow
          key={item.category}
          category={item.category}
          skills={item.skills}
          editable={editable}
          updateLevel={updateLevel}
        />
      )
    );

  const renderBasicSection = () => (
    <div className="space-y-2">{renderItems(trainedBasicItems)}</div>
  );

  return (
    <div className="space-y-4 text-slate-100">
      {/* MOBILE: tab switcher + swipe */}
      <div ref={containerRef} className="lg:hidden space-y-4">
        <SegmentedTabs
          id={SKILLS_TABS_ID}
          ariaLabel="Skill type"
          options={SKILLS_TABS}
          value={activeView}
          onChange={switchView}
        />

        <section
          key={activeView}
          id={segmentedTabPanelId(SKILLS_TABS_ID, activeView)}
          aria-labelledby={segmentedTabId(SKILLS_TABS_ID, activeView)}
          role="tabpanel"
          className={["space-y-4", uiSwipeableTabPanel, transitionClass].join(" ")}
        >
          <div className="flex items-center justify-between">
            <SectionHeader>{activeView === "basic" ? "Basic Skills" : "Advanced Skills"}</SectionHeader>
            {activeView === "basic" ? (
              <Button
                size="sm"
                onClick={() => setIsUntrainedBasicOpen(true)}
              >
                Untrained
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => setIsAddOpen(true)}
              >
                {editable ? "+ Add Skill" : "View"}
              </Button>
            )}
          </div>
          {activeView === "basic" ? (
            renderBasicSection()
          ) : activeItems.length === 0 ? (
            <p className={`text-sm ${uiTextPlaceholder} text-center py-8`}>
              No advanced skills trained yet.
            </p>
          ) : (
            <div className="space-y-2">{renderItems(activeItems)}</div>
          )}
        </section>
      </div>

      {/* DESKTOP: both columns side by side */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-4 lg:items-start">
        <section className={uiSection + " space-y-3"}>
          <div className="flex items-center justify-between">
            <SectionHeader>Basic Skills</SectionHeader>
            <Button
              size="sm"
              onClick={() => setIsUntrainedBasicOpen(true)}
            >
              Untrained
            </Button>
          </div>
          {renderBasicSection()}
        </section>
        <section className={uiSection + " space-y-3"}>
          <div className="flex items-center justify-between">
            <SectionHeader>Advanced Skills</SectionHeader>
            <Button
              size="sm"
              onClick={() => setIsAddOpen(true)}
            >
              {editable ? "+ Add Skill" : "View"}
            </Button>
          </div>
          {advancedItems.length === 0 ? (
            <p className={`text-sm ${uiTextPlaceholder}`}>No advanced skills trained yet.</p>
          ) : (
            <div className="space-y-2">{renderItems(advancedItems)}</div>
          )}
        </section>
      </div>

      <AddSkillModal
        isOpen={isAddOpen}
        editable={editable}
        onClose={() => setIsAddOpen(false)}
        untrainedSkills={untrainedSkills}
        onAdd={handleAdd}
        hideLevelChip
      />
      <AddSkillModal
        title="Untrained Basic Skills"
        isOpen={isUntrainedBasicOpen}
        editable={editable}
        onClose={() => setIsUntrainedBasicOpen(false)}
        untrainedSkills={untrainedBasicSkills}
        onAdd={handleAdd}
      />
    </div>
  );
}
