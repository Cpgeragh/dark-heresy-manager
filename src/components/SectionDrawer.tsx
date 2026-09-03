// src/components/SectionDrawer.tsx

import { useState, useEffect, useCallback } from "react";
import type { TabId } from "../pages/CharacterSheet/types";
import { CloseButton } from "../ui/buttons/CloseButton";
import { ArrowLeft, ArrowRight } from "../ui/icons/PickerArrows";

// ================================================================
// NAVIGATION STRUCTURE
// ================================================================

const CATEGORIES: {
  label: string;
  dmOnly?: boolean;
  tabs: { id: TabId; label: string }[];
}[] = [
  {
    label: "Abilities",
    tabs: [
      { id: "psychic", label: "Psychic" },
      { id: "skills", label: "Skills" },
      { id: "talents", label: "Talents" },
      { id: "traits", label: "Traits" },
      { id: "training", label: "Weapon Training" },
    ],
  },
  {
    label: "Admin",
    dmOnly: true,
    tabs: [{ id: "admin", label: "Admin" }],
  },
  {
    label: "Character",
    tabs: [
      { id: "background", label: "Background" },
      { id: "stats", label: "Characteristics" },
      { id: "corruption", label: "Corruption & Mutations" },
      { id: "insanity", label: "Insanity" },
      { id: "notes", label: "Notes" },
      { id: "xp", label: "XP" },
    ],
  },
  {
    label: "Combat",
    tabs: [
      { id: "vitals", label: "Vitals" },
    ],
  },
  {
    label: "Companions",
    tabs: [{ id: "companions", label: "Companions" }],
  },
  {
    label: "Equipment",
    tabs: [
      { id: "archeotech", label: "Archeotech" },
      { id: "armour", label: "Armour" },
      { id: "cybernetics", label: "Cybernetics" },
      { id: "drugs", label: "Drugs" },
      { id: "gear", label: "Gear" },
      { id: "weapons", label: "Weapons" },
    ],
  },
];

// ================================================================
// COMPONENT
// ================================================================

interface SectionDrawerProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  isDM: boolean;
  externalOpen?: boolean;
  externalCategoryLabel?: string | null;
  onExternalClose?: () => void;
}

export function SectionDrawer({
  ...props
}: SectionDrawerProps) {
  const externalRequest =
    props.externalOpen && props.externalCategoryLabel
      ? props.externalCategoryLabel
      : "local";
  const drawerStateKey = `${props.isDM ? "dm" : "player"}:${externalRequest}`;

  return <SectionDrawerContent key={drawerStateKey} {...props} />;
}

function SectionDrawerContent({
  activeTab,
  onTabChange,
  isDM,
  externalOpen,
  externalCategoryLabel,
  onExternalClose,
}: SectionDrawerProps) {
  const visibleCategories = CATEGORIES.filter((c) => !c.dmOnly || isDM);
  const externalCategoryIndex =
    externalOpen && externalCategoryLabel
      ? visibleCategories.findIndex((category) => category.label === externalCategoryLabel)
      : -1;
  const hasExternalCategory = externalCategoryIndex >= 0;

  const [isOpen, setIsOpen] = useState(hasExternalCategory);
  const [level, setLevel] = useState<"categories" | "pages">(
    hasExternalCategory ? "pages" : "categories"
  );
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number | null>(
    hasExternalCategory ? externalCategoryIndex : null
  );

  const activeCategory =
    activeCategoryIndex !== null ? visibleCategories[activeCategoryIndex] : null;

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setLevel("categories");
    setActiveCategoryIndex(null);
    onExternalClose?.();
  }, [onExternalClose]);

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
      <button type="button"
        onClick={open}
        aria-label="Open section navigation"
        className="flex h-10 w-11 items-center justify-center rounded-lg border border-slate-500 bg-slate-800 text-base leading-none text-slate-200 transition hover:bg-slate-700"
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
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 shrink-0">
          <span className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
            Navigate
          </span>
          <CloseButton
            onClick={close}
            ariaLabel="Close navigation"
          />
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
                  <button type="button"
                    onClick={() => openCategory(index)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm text-slate-200 hover:bg-slate-800 transition text-left"
                  >
                    <span>{cat.label}</span>
                    <ArrowRight />
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
                <button type="button"
                  onClick={goBack}
                  aria-label={`Back to categories from ${activeCategory.label}`}
                  className="flex items-center gap-2 px-4 py-3 w-full text-sm hover:bg-slate-800 transition border-b border-slate-700"
                >
                  <ArrowLeft />
                  <span className="font-semibold text-slate-200">{activeCategory.label}</span>
                </button>

                {/* Page list */}
                <ul className="py-2">
                  {activeCategory.tabs.map((tab) => (
                    <li key={tab.id}>
                      <button type="button"
                        onClick={() => selectTab(tab.id)}
                        className={`w-full px-4 py-3 text-sm text-left transition ${
                          activeTab === tab.id
                            ? "text-red-500 font-semibold border-l-2 border-red-500"
                            : "text-slate-200 hover:bg-slate-800"
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
