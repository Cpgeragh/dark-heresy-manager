// src/components/DesktopTabNav.tsx
// Desktop-only two-level section nav: a row of category buttons, and below it
// the pages of the open category. The open category follows the active tab,
// but the user can click another category to peek its pages without navigating.

import { useState, useEffect } from "react";
import type { TabId } from "../pages/characterSheet/types";
import { CATEGORIES } from "./SectionDrawer";
import { TabButton } from "./TabButton";

interface Props {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  isDM: boolean;
}

export function DesktopTabNav({ activeTab, onTabChange, isDM }: Props) {
  const visible = CATEGORIES.filter((c) => !c.dmOnly || isDM);
  const activeCategory = visible.find((c) => c.tabs.some((t) => t.id === activeTab));

  // `override` lets the user peek another category's pages without navigating.
  // Cleared whenever the active tab changes so the strip follows navigation.
  const [override, setOverride] = useState<string | null>(null);
  useEffect(() => {
    setOverride(null);
  }, [activeTab]);

  const shownLabel = override ?? activeCategory?.label ?? visible[0].label;
  const shown = visible.find((c) => c.label === shownLabel) ?? visible[0];

  return (
    <div className="hidden sm:block mb-4 space-y-1.5">
      {/* Category row */}
      <div className="flex flex-wrap justify-center gap-1.5" aria-label="Section categories">
        {visible.map((cat) => {
          const isOpen = cat.label === shownLabel;
          return (
            <button
              key={cat.label}
              onClick={() => setOverride(cat.label)}
              aria-expanded={isOpen}
              className={`shrink-0 px-3 py-1 rounded text-sm border transition ${
                isOpen
                  ? "bg-slate-700 text-slate-100 border-slate-500 font-semibold"
                  : "border-slate-700 text-slate-400 hover:bg-slate-800"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Pages of the open category */}
      <div
        className="flex flex-wrap justify-center gap-1.5"
        role="tablist"
        aria-label={`${shown.label} sections`}
      >
        {shown.tabs.map((t) => (
          <TabButton
            key={t.id}
            label={t.label}
            tabId={t.id}
            active={activeTab === t.id}
            onTabChange={onTabChange}
          />
        ))}
      </div>
    </div>
  );
}
