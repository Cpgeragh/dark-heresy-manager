// src/components/SectionDrawer.tsx

import { useState, useEffect, useCallback } from "react";
import type { TabId } from "../pages/characterSheet/types";

// ================================================================
// NAVIGATION STRUCTURE
// ================================================================

const CATEGORIES: {
  label: string;
  dmOnly?: boolean;
  tabs: { id: TabId; label: string }[];
}[] = [
  {
    label: "Combat",
    tabs: [
      { id: "vitals",    label: "Vitals" },
      { id: "stats",     label: "Characteristics" },
      { id: "weapons",   label: "Weapons" },
      { id: "armour",    label: "Armour" },
    ],
  },
  {
    label: "Abilities",
    tabs: [
      { id: "skills",   label: "Skills" },
      { id: "talents",  label: "Talents" },
      { id: "traits",   label: "Traits" },
      { id: "psychic",  label: "Psychic" },
    ],
  },
  {
    label: "Equipment",
    tabs: [
      { id: "gear",        label: "Gear" },
      { id: "drugs",       label: "Drugs" },
      { id: "cybernetics", label: "Cybernetics" },
      { id: "archeotech",  label: "Archeotech" },
    ],
  },
  {
    label: "Character",
    tabs: [
      { id: "background", label: "Background" },
      { id: "xp",         label: "XP" },
      { id: "notes",      label: "Notes" },
    ],
  },
  {
    label: "Admin",
    dmOnly: true,
    tabs: [{ id: "admin", label: "Admin" }],
  },
];

// ================================================================
// COMPONENT
// ================================================================

interface SectionDrawerProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  isDM: boolean;
}

export function SectionDrawer({ activeTab, onTabChange, isDM }: SectionDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [level, setLevel] = useState<"categories" | "pages">("categories");
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number | null>(null);

  const visibleCategories = CATEGORIES.filter((c) => !c.dmOnly || isDM);
  const activeCategory =
    activeCategoryIndex !== null ? visibleCategories[activeCategoryIndex] : null;

  // Reset to category level after drawer fully closes
  const close = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => setLevel("categories"), 300);
  }, []);

  const openCategory = useCallback((index: number) => {
    setActiveCategoryIndex(index);
    setLevel("pages");
  }, []);

  const goBack = useCallback(() => {
    setLevel("categories");
  }, []);

  const selectTab = useCallback(
    (tabId: TabId) => {
      onTabChange(tabId);
      close();
    },
    [onTabChange, close]
  );

  // Escape key closes drawer
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, close]);

  return (
    <>
      {/* Trigger — hamburger only */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open section navigation"
        className="mb-6 px-3 py-2 rounded-lg border border-slate-500 bg-slate-800 text-slate-100 hover:bg-slate-700 transition text-base leading-none"
      >
        ☰
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-slate-900 border-r border-slate-700 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Section navigation"
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 shrink-0">
          <span className="text-sm font-semibold text-slate-100 uppercase tracking-wide">
            Navigate
          </span>
          <button
            onClick={close}
            aria-label="Close navigation"
            className="text-slate-400 hover:text-slate-100 text-lg leading-none transition"
          >
            ✕
          </button>
        </div>

        {/* Sliding panels */}
        <div className="relative overflow-hidden flex-1">

          {/* Level 1 — Categories */}
          <div
            className={`absolute inset-0 overflow-y-auto transition-transform duration-300 ease-in-out ${
              level === "categories" ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <ul className="py-2">
              {visibleCategories.map((cat, index) => (
                <li key={cat.label}>
                  <button
                    onClick={() => openCategory(index)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm text-slate-100 hover:bg-slate-800 transition text-left"
                  >
                    <span>{cat.label}</span>
                    <span className="text-slate-400 text-xs">›</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Level 2 — Pages */}
          <div
            className={`absolute inset-0 overflow-y-auto transition-transform duration-300 ease-in-out ${
              level === "pages" ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {activeCategory && (
              <>
                {/* Back button */}
                <button
                  onClick={goBack}
                  className="flex items-center gap-2 px-4 py-3 w-full text-sm hover:bg-slate-800 transition border-b border-slate-700"
                >
                  <span className="text-slate-400">‹</span>
                  <span className="font-semibold text-slate-100">
                    {activeCategory.label}
                  </span>
                </button>

                {/* Page list */}
                <ul className="py-2">
                  {activeCategory.tabs.map((tab) => (
                    <li key={tab.id}>
                      <button
                        onClick={() => selectTab(tab.id)}
                        className={`w-full px-4 py-3 text-sm text-left transition ${
                          activeTab === tab.id
                            ? "text-amber-400 bg-amber-500/10 border-l-2 border-amber-400"
                            : "text-slate-100 hover:bg-slate-800"
                        }`}
                      >
                        {tab.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
