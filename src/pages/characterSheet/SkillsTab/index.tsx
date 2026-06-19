// src/pages/characterSheet/SkillsTab/index.tsx

import { useState, useCallback, useMemo, useRef } from "react";
import type { TouchEvent } from "react";
import type { Characteristics, SkillEntry } from "../../../types/Character";
import type { CharField } from "../../../utils/characterFactory";
import { useSkillComputation } from "../../../hooks/useSkillComputation";
import { SectionHeader } from "../../../ui/SectionHeader";
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
  const [activeView, setActiveView] = useState<SkillsView>("basic");
  const [viewTransition, setViewTransition] = useState<"idle" | "sliding">("idle");
  const touchStartX = useRef<number | null>(null);

  const computedSkills = useSkillComputation({ skills, getCharField });

  const trainedSkills = computedSkills
    .filter((s) => s.level !== "untrained")
    .sort((a, b) => a.name.localeCompare(b.name));

  const untrainedSkills = computedSkills
    .filter((s) => s.level === "untrained")
    .sort((a, b) => a.name.localeCompare(b.name));

  const displayItems = useMemo((): DisplayItem[] => {
    const groups = new Map<string, SkillWithComputed[]>();
    for (const skill of trainedSkills) {
      const arr = groups.get(skill.category) ?? [];
      arr.push(skill);
      groups.set(skill.category, arr);
    }

    const items: DisplayItem[] = [];
    for (const [category, catSkills] of groups) {
      if (category === "General" || catSkills.length === 1) {
        for (const skill of catSkills) {
          items.push({ type: "skill", skill });
        }
      } else {
        items.push({ type: "group", category, skills: catSkills });
      }
    }

    return items
      .filter((item) => {
        const isAdv = item.type === "skill" ? item.skill.advanced : item.skills[0].advanced;
        return isAdv === (activeView === "advanced");
      })
      .sort((a, b) => {
        const aKey = a.type === "skill" ? a.skill.name : a.category;
        const bKey = b.type === "skill" ? b.skill.name : b.category;
        return aKey.localeCompare(bKey);
      });
  }, [trainedSkills, activeView]);

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

  const handleTouchEnd = useCallback((e: TouchEvent<HTMLDivElement>) => {
    const startX = touchStartX.current;
    const endX = e.changedTouches[0]?.clientX;
    touchStartX.current = null;
    if (startX === null || endX === undefined || Math.abs(endX - startX) < 50) return;
    switchView();
  }, [switchView]);

  const transitionClass =
    viewTransition === "sliding"
      ? activeView === "basic"
        ? "opacity-0 -translate-x-3"
        : "opacity-0 translate-x-3"
      : "opacity-100 translate-x-0";

  const basicCount = trainedSkills.filter((s) => !s.advanced).length;
  const advancedCount = trainedSkills.filter((s) => s.advanced).length;

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

  return (
    <div className="space-y-4 text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between">
        <SectionHeader>Trained Skills</SectionHeader>
        <button
          onClick={() => setIsAddOpen(true)}
          className="text-xs lg:text-sm px-3 lg:px-4 py-1.5 lg:py-2 rounded border border-slate-500 bg-slate-800 text-slate-100 hover:bg-slate-700 transition"
        >
          {editable ? "+ Add Skill" : "View Skills"}
        </button>
      </div>

      <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} className="space-y-4">
        {/* Tab switcher */}
        <div
          className="grid grid-cols-2 rounded-lg border border-slate-600 bg-slate-950/70 p-1"
          role="tablist"
          aria-label="Skill type"
        >
          {(["basic", "advanced"] as const).map((view) => {
            const active = activeView === view;
            const count = view === "basic" ? basicCount : advancedCount;
            return (
              <button
                key={view}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => switchView(view)}
                className={[
                  "rounded-md px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-semibold transition border",
                  active
                    ? view === "basic"
                      ? "border-teal-400 bg-teal-600/80 text-white shadow-sm shadow-teal-950/50"
                      : "border-purple-400 bg-purple-600/80 text-white shadow-sm shadow-purple-950/50"
                    : "border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200",
                ].join(" ")}
              >
                {view === "basic" ? "Basic" : "Advanced"} ({count})
              </button>
            );
          })}
        </div>

        {/* Skill list */}
        {trainedSkills.length === 0 ? (
          <p className="text-sm lg:text-base text-slate-400 text-center py-8">
            {editable
              ? 'No trained skills yet. Tap "+ Add Skill" to get started.'
              : "No trained skills yet."}
          </p>
        ) : displayItems.length === 0 ? (
          <p className="text-sm lg:text-base text-slate-400 text-center py-8">
            No {activeView} skills trained yet.
          </p>
        ) : (
          <section
            key={activeView}
            role="tabpanel"
            className={`grid grid-cols-1 sm:grid-cols-2 gap-2 transition-all duration-150 ease-out motion-reduce:transition-none ${transitionClass}`}
          >
            {displayItems.map((item) => {
              if (item.type === "skill") {
                return (
                  <SkillRow
                    key={item.skill.id}
                    skill={item.skill}
                    editable={editable}
                    updateLevel={updateLevel}
                    updateMisc={updateMisc}
                  />
                );
              }
              return (
                <SkillGroupRow
                  key={item.category}
                  category={item.category}
                  skills={item.skills}
                  editable={editable}
                  updateLevel={updateLevel}
                  updateMisc={updateMisc}
                />
              );
            })}
          </section>
        )}
      </div>

      {/* Add skill modal */}
      <AddSkillModal
        isOpen={isAddOpen}
        editable={editable}
        onClose={() => setIsAddOpen(false)}
        untrainedSkills={untrainedSkills}
        onAdd={handleAdd}
      />
    </div>
  );
}
