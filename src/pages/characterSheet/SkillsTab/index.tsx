// src/pages/characterSheet/SkillsTab/index.tsx

import { useState, useCallback, useMemo, useRef } from "react";
import type { TouchEvent } from "react";
import type { Characteristics, SkillEntry } from "../../../types/Character";
import type { CharField } from "../../../utils/characterFactory";
import { useSkillComputation } from "../../../hooks/useSkillComputation";
import { SectionHeader } from "../../../ui/SectionHeader";
import { uiSection } from "../../../ui/editableStyles";
import { SkillRow } from "./SkillRow";
import { SkillGroupRow } from "./SkillGroupRow";
import { AddSkillModal } from "./AddSkillModal";
import type { SkillWithComputed } from "./skillsConstants";

interface SkillsTabProps {
  skills: SkillEntry[];
  editable: boolean;
  onUpdate: (next: SkillEntry[]) => void;
  getCharField: (statKey: keyof Characteristics) => CharField;
}

type DisplayItem =
  | { type: "skill"; skill: SkillWithComputed }
  | { type: "group"; category: string; skills: SkillWithComputed[] };

type SkillsView = "basic" | "advanced";

export function SkillsTab({ skills, editable, onUpdate, getCharField }: SkillsTabProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isUntrainedBasicOpen, setIsUntrainedBasicOpen] = useState(false);
  const [activeView, setActiveView] = useState<SkillsView>("basic");
  const [viewTransition, setViewTransition] = useState<"idle" | "sliding">("idle");
  const touchStartX = useRef<number | null>(null);

  const computedSkills = useSkillComputation({ skills, getCharField });

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

  const switchView = useCallback((view?: SkillsView) => {
    setActiveView((current) => {
      const next = view ?? (current === "basic" ? "advanced" : "basic");
      if (next === current) return current;
      setViewTransition("sliding");
      window.setTimeout(() => setViewTransition("idle"), 180);
      return next;
    });
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  }, []);

  const handleTouchEnd = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      const startX = touchStartX.current;
      const endX = e.changedTouches[0]?.clientX;
      touchStartX.current = null;
      if (startX === null || endX === undefined || Math.abs(endX - startX) < 50) return;
      switchView();
    },
    [switchView]
  );

  const transitionClass =
    viewTransition === "sliding"
      ? activeView === "basic"
        ? "opacity-0 -translate-x-3"
        : "opacity-0 translate-x-3"
      : "opacity-100 translate-x-0";

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
          updateMisc={updateMisc}
        />
      ) : (
        <SkillGroupRow
          key={item.category}
          category={item.category}
          skills={item.skills}
          editable={editable}
          updateLevel={updateLevel}
          updateMisc={updateMisc}
        />
      )
    );

  const renderBasicSection = () => (
    <div className="space-y-2">{renderItems(trainedBasicItems)}</div>
  );

  return (
    <div className="space-y-4 text-slate-100">
      {/* MOBILE: tab switcher + swipe */}
      <div className="lg:hidden space-y-4" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div
          className="grid grid-cols-2 rounded-lg border border-slate-600 bg-slate-950/70 p-1"
          role="tablist"
          aria-label="Skill type"
        >
          {(["basic", "advanced"] as const).map((view) => {
            const active = activeView === view;
            return (
              <button
                key={view}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => switchView(view)}
                className={[
                  "rounded-md px-3 py-1.5 text-xs font-semibold transition border",
                  active
                    ? view === "basic"
                      ? "border-violet-400 bg-violet-600/80 text-white shadow-sm shadow-violet-950/50"
                      : "border-fuchsia-400 bg-fuchsia-600/80 text-white shadow-sm shadow-fuchsia-950/50"
                    : "border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200",
                ].join(" ")}
              >
                {view === "basic" ? "Basic" : "Advanced"}
              </button>
            );
          })}
        </div>

        <section
          key={activeView}
          role="tabpanel"
          className={`space-y-4 transition-all duration-150 ease-out motion-reduce:transition-none ${transitionClass}`}
        >
          <div className="flex items-center justify-between">
            <SectionHeader>{activeView === "basic" ? "Basic Skills" : "Advanced Skills"}</SectionHeader>
            {activeView === "basic" ? (
              <button
                onClick={() => setIsUntrainedBasicOpen(true)}
                className="text-xs lg:text-sm px-3 lg:px-4 py-1 lg:py-1.5 rounded border border-red-500 text-red-500 font-semibold hover:bg-red-500/10 transition"
              >
                Untrained
              </button>
            ) : (
              <button
                onClick={() => setIsAddOpen(true)}
                className="text-xs lg:text-sm px-3 lg:px-4 py-1 lg:py-1.5 rounded border border-red-500 text-red-500 font-semibold hover:bg-red-500/10 transition"
              >
                {editable ? "+ Add Skill" : "View"}
              </button>
            )}
          </div>
          {activeView === "basic" ? (
            renderBasicSection()
          ) : activeItems.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">
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
            <button
              onClick={() => setIsUntrainedBasicOpen(true)}
              className="text-xs lg:text-sm px-3 lg:px-4 py-1 lg:py-1.5 rounded border border-red-500 text-red-500 font-semibold hover:bg-red-500/10 transition"
            >
              Untrained
            </button>
          </div>
          {renderBasicSection()}
        </section>
        <section className={uiSection + " space-y-3"}>
          <div className="flex items-center justify-between">
            <SectionHeader>Advanced Skills</SectionHeader>
            <button
              onClick={() => setIsAddOpen(true)}
              className="text-xs lg:text-sm px-3 lg:px-4 py-1 lg:py-1.5 rounded border border-red-500 text-red-500 font-semibold hover:bg-red-500/10 transition"
            >
              {editable ? "+ Add Skill" : "View"}
            </button>
          </div>
          {advancedItems.length === 0 ? (
            <p className="text-sm text-slate-400">No advanced skills trained yet.</p>
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
      />
      <AddSkillModal
        title="Untrained"
        previewMode
        isOpen={isUntrainedBasicOpen}
        editable={editable}
        onClose={() => setIsUntrainedBasicOpen(false)}
        untrainedSkills={untrainedBasicSkills}
        onAdd={handleAdd}
      />
    </div>
  );
}
