// src/pages/characterSheet/SkillsTab/index.tsx

import { useState, useCallback, useMemo } from "react";
import type { Characteristics, CorruptionBlock, SkillEntry, TalentsAndTraitsBlock } from "../../../types/Character";
import type { CharField } from "../../../types/Character";
import { useSkillComputation } from "../../../hooks/useSkillComputation";
import { useSwipeableTabs } from "../../../hooks/useSwipeableTabs";
import { getCharacteristicModifierTotals } from "../../../features/corruption/characteristicModifierTotals";
import { getNextSkillTierAccess, getUnlockedSkillTrainingCosts } from "../../../features/experience/skillAdvanceCosts";
import { makeCurrentRankPurchase } from "../../../features/experience/purchaseAttribution";
import { buildSkillCatalogue, getSkillDefinition } from "../../../utils/skillUtils";
import { AddButton } from "../../../ui/AddButton";
import { ViewButton } from "../../../ui/ViewButton";
import { SectionHeader } from "../../../ui/SectionHeader";
import { InfoModal } from "../../../components/InfoModal";
import { SegmentedTabs, type SegmentedTabOption } from "../../../ui/SegmentedTabs";
import {
  segmentedTabId,
  segmentedTabPanelId,
  uiSwipeableTabPanel,
} from "../../../ui/segmentedTabStyles";
import {
  uiInfoModalWrapper,
  uiSection,
  uiTextBody,
  uiTextPlaceholder,
} from "../../../ui/editableStyles";
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
  talents?: TalentsAndTraitsBlock;
  career?: string;
  rank?: string;
  isDM?: boolean;
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

function SkillTypeHeading({ type }: { type: SkillsView }) {
  const basic = type === "basic";
  const title = basic ? "Basic Skills" : "Advanced Skills";
  const content = basic ? (
    <div className={`space-y-3 text-sm leading-relaxed lg:text-base ${uiTextBody}`}>
      <p>Basic Skills can be attempted while Untrained using half the relevant Characteristic, rounded down.</p>
      <p>The first acquisition makes the Skill Trained and uses the full Characteristic. Further acquisitions increase its Total by +10 and then +20.</p>
    </div>
  ) : (
    <div className={`space-y-3 text-sm leading-relaxed lg:text-base ${uiTextBody}`}>
      <p>Advanced Skills cannot be attempted while Untrained. The displayed Total shows the Characteristic value the Skill will use once it becomes Trained.</p>
      <p>The first acquisition makes the Skill Trained. Further acquisitions increase its Total by +10 and then +20.</p>
    </div>
  );

  return (
    <div className="flex items-center gap-1.5">
      <SectionHeader>{title}</SectionHeader>
      <span className={uiInfoModalWrapper}>
        <InfoModal title={title} content={content} as="span" />
      </span>
    </div>
  );
}
const SKILLS_TABS_ID = "skill-type";
const PURCHASED_SKILL_TIERS = ["trained", "+10", "+20"] as const;

function skillTierIndex(level: SkillEntry["level"]): number {
  return level === "untrained" ? -1 : PURCHASED_SKILL_TIERS.indexOf(level);
}

export function SkillsTab({ skills, editable, onUpdate, getCharField, corruption, talents, career, rank, isDM = false }: SkillsTabProps) {
  const canUseDmActions = isDM && editable;
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isUntrainedBasicOpen, setIsUntrainedBasicOpen] = useState(false);
  // undefined (not an empty Map) when no career is set, so AddSkillModal knows
  // to show every skill unrestricted rather than reading "no matches yet".
  const unlockedSkillTrainingCosts = useMemo(
    () => (career ? getUnlockedSkillTrainingCosts(career, rank) : undefined),
    [career, rank]
  );
  const [activeView, setActiveView] = useState<SkillsView>("basic");
  const { containerRef, transitionClass, switchTo: switchView } = useSwipeableTabs(
    SKILLS_VIEWS,
    activeView,
    setActiveView
  );

  const modifierTotals = getCharacteristicModifierTotals(corruption, talents);
  const catalogueSkills = useMemo(() => buildSkillCatalogue(skills), [skills]);
  const computedSkills = useSkillComputation({
    skills: catalogueSkills,
    getCharField,
    modifierTotals,
    talents,
    career,
  });

  const trainedSkills = useMemo(
    () =>
      computedSkills
        .filter((s) => s.level !== "untrained")
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
      const viewSkills = trainedSkills.filter((skill) => skill.advanced === (view === "advanced"));

      const groups = new Map<string, SkillWithComputed[]>();
      for (const skill of viewSkills) {
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

      return items.sort((a, b) => {
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

  const untrainedBasicSkills = useMemo(
    () => computedSkills.filter((s) => s.level === "untrained" && !s.advanced),
    [computedSkills]
  );

  const updateLevel = useCallback(
    (id: string, level: SkillEntry["level"]) => {
      if (level === "untrained") {
        onUpdate(skills.filter((skill) => skill.id !== id));
        return;
      }

      const owned = skills.find((skill) => skill.id === id);
      const definition = getSkillDefinition(id) ?? owned;
      if (!definition) return;

      const displayed = computedSkills.find((skill) => skill.id === id);
      const currentLevel = displayed?.level ?? owned?.level ?? "untrained";
      const currentIndex = skillTierIndex(currentLevel);
      const nextIndex = skillTierIndex(level);
      const xpPurchases = { ...owned?.xpPurchases };
      const manualCosts = { ...owned?.manualCosts };

      if (nextIndex > currentIndex) {
        const access = getNextSkillTierAccess(career, rank, id, currentLevel);
        if (access.status === "unlocked" && access.level === level) {
          xpPurchases[level] = access.purchase;
        }
      } else if (nextIndex < currentIndex) {
        for (let index = nextIndex + 1; index < PURCHASED_SKILL_TIERS.length; index += 1) {
          const tier = PURCHASED_SKILL_TIERS[index];
          delete xpPurchases[tier];
          delete manualCosts[tier];
        }
      }

      const updated: SkillEntry = {
        ...definition,
        ...owned,
        level,
        xpPurchases: Object.keys(xpPurchases).length > 0 ? xpPurchases : undefined,
        manualCosts: Object.keys(manualCosts).length > 0 ? manualCosts : undefined,
      };
      onUpdate(
        owned
          ? skills.map((skill) => (skill.id === id ? updated : skill))
          : [...skills, updated]
      );
    },
    [career, computedSkills, onUpdate, rank, skills]
  );

  const handleAdd = useCallback(
    (id: string, manualCost?: number) => {
      if (skills.some((skill) => skill.id === id)) return;
      const definition = getSkillDefinition(id);
      if (!definition) return;

      const access = getNextSkillTierAccess(career, rank, id, "untrained");
      const purchase =
        manualCost !== undefined
          ? makeCurrentRankPurchase(career, rank, manualCost)
          : access.status === "unlocked"
            ? access.purchase
            : undefined;
      onUpdate([
        ...skills,
        {
          ...definition,
          level: "trained",
          ...(manualCost !== undefined ? { manualCosts: { trained: manualCost } } : {}),
          ...(purchase ? { xpPurchases: { trained: purchase } } : {}),
        },
      ]);
    },
    [career, onUpdate, rank, skills]
  );

  const getNextTierAccess = useCallback(
    (skillId: string, level: SkillEntry["level"]) => getNextSkillTierAccess(career, rank, skillId, level),
    [career, rank]
  );

  const handleManualUpgrade = useCallback(
    (id: string, level: SkillEntry["level"], cost: number) => {
      const owned = skills.find((skill) => skill.id === id);
      const definition = getSkillDefinition(id) ?? owned;
      if (!definition) return;
      const updated: SkillEntry = {
        ...definition,
        ...owned,
        level,
        manualCosts: { ...owned?.manualCosts, [level]: cost },
        xpPurchases: {
          ...owned?.xpPurchases,
          [level]: makeCurrentRankPurchase(career, rank, cost),
        },
      };
      onUpdate(
        owned
          ? skills.map((skill) => (skill.id === id ? updated : skill))
          : [...skills, updated]
      );
    },
    [career, onUpdate, rank, skills]
  );

  const renderItems = (items: DisplayItem[]) =>
    items.map((item) =>
      item.type === "skill" ? (
        <SkillRow
          key={item.skill.id}
          skill={item.skill}
          editable={editable}
          updateLevel={updateLevel}
          nextTierAccess={getNextTierAccess(item.skill.id, item.skill.level)}
          onManualUpgrade={handleManualUpgrade}
          isDM={canUseDmActions}
        />
      ) : (
        <SkillGroupRow
          key={item.category}
          category={item.category}
          skills={item.skills}
          editable={editable}
          updateLevel={updateLevel}
          getNextTierAccess={getNextTierAccess}
          onManualUpgrade={handleManualUpgrade}
          isDM={canUseDmActions}
        />
      )
    );

  const renderBasicSection = () => (
    <div className="space-y-2">{renderItems(basicItems)}</div>
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
            <SkillTypeHeading type={activeView} />
            {activeView === "basic" ? (
              editable ? (
                <AddButton label="Add basic skill" onClick={() => setIsUntrainedBasicOpen(true)} />
              ) : (
                <ViewButton label="View basic skills" onClick={() => setIsUntrainedBasicOpen(true)} />
              )
            ) : (
              editable ? (
                <AddButton label="Add advanced skill" onClick={() => setIsAddOpen(true)} />
              ) : (
                <ViewButton label="View advanced skills" onClick={() => setIsAddOpen(true)} />
              )
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
            <SkillTypeHeading type="basic" />
            {editable ? (
              <AddButton label="Add basic skill" onClick={() => setIsUntrainedBasicOpen(true)} />
            ) : (
              <ViewButton label="View basic skills" onClick={() => setIsUntrainedBasicOpen(true)} />
            )}
          </div>
          {renderBasicSection()}
        </section>
        <section className={uiSection + " space-y-3"}>
          <div className="flex items-center justify-between">
            <SkillTypeHeading type="advanced" />
            {editable ? (
              <AddButton label="Add advanced skill" onClick={() => setIsAddOpen(true)} />
            ) : (
              <ViewButton label="View advanced skills" onClick={() => setIsAddOpen(true)} />
            )}
          </div>
          {advancedItems.length === 0 ? (
            <p className={`text-sm ${uiTextPlaceholder}`}>No advanced skills trained yet.</p>
          ) : (
            <div className="space-y-2">{renderItems(advancedItems)}</div>
          )}
        </section>
      </div>

      <AddSkillModal
        title="Available Untrained Advanced Skills"
        allSkillsTitle="All Untrained Advanced Skills"
        showAllLabel="Show All Untrained Advanced Skills"
        isOpen={isAddOpen}
        editable={editable}
        onClose={() => setIsAddOpen(false)}
        untrainedSkills={untrainedSkills}
        onAdd={handleAdd}
        hideLevelChip
        unlockedCosts={unlockedSkillTrainingCosts}
        isDM={canUseDmActions}
      />
      <AddSkillModal
        title="Available Untrained Basic Skills"
        allSkillsTitle="All Untrained Basic Skills"
        showAllLabel="Show All Untrained Basic Skills"
        isOpen={isUntrainedBasicOpen}
        editable={editable}
        onClose={() => setIsUntrainedBasicOpen(false)}
        untrainedSkills={untrainedBasicSkills}
        onAdd={handleAdd}
        unlockedCosts={unlockedSkillTrainingCosts}
        isDM={canUseDmActions}
      />
    </div>
  );
}
