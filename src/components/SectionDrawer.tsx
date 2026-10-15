// src/components/SectionDrawer.tsx

import { useState, useEffect, useCallback } from "react";
import { CloseButton } from "../ui/buttons/CloseButton";
import { IconButton } from "../ui/buttons/IconButton";
import { MenuIcon } from "../ui/icons/MenuIcon";
import { ArrowLeft, ArrowRight } from "../ui/icons/PickerArrows";
import { DrawerBackdrop } from "../ui/DrawerBackdrop";
import { SectionDrawerRow } from "../ui/SectionDrawerRow";
import { colourTextPrimary, colourPopoverSurface, colourDivider } from "../ui/styles/colourTokens";
import { uiLayerForeground } from "../ui/styles/layerStyles";

// ================================================================
// NAVIGATION STRUCTURE
// ================================================================

export interface SectionDrawerPage {
  id: string;
  label: string;
}

export interface SectionDrawerCategory {
  label: string;
  pages: readonly SectionDrawerPage[];
}

export type SectionNavigation =
  | { categories: readonly SectionDrawerCategory[] }
  | { pages: readonly SectionDrawerPage[] };

// ================================================================
// COMPONENT
// ================================================================

interface SectionDrawerProps {
  navigation: SectionNavigation;
  activePage: string;
  onPageChange: (id: string) => void;
  externalOpen?: boolean;
  externalCategoryLabel?: string | null;
  onExternalClose?: () => void;
}

export function SectionDrawer({ ...props }: SectionDrawerProps) {
  const externalRequest =
    props.externalOpen && props.externalCategoryLabel ? props.externalCategoryLabel : "local";
  const navigationKey =
    "categories" in props.navigation
      ? props.navigation.categories.map((category) => category.label).join("|")
      : "pages";

  return <SectionDrawerContent key={`${navigationKey}:${externalRequest}`} {...props} />;
}

function PageList({
  pages,
  activePage,
  onSelect,
}: {
  pages: readonly SectionDrawerPage[];
  activePage: string;
  onSelect: (id: string) => void;
}) {
  return (
    <ul className="py-2">
      {pages.map((page) => (
        <li key={page.id}>
          <SectionDrawerRow onClick={() => onSelect(page.id)} active={activePage === page.id}>
            {page.label}
          </SectionDrawerRow>
        </li>
      ))}
    </ul>
  );
}

function SectionDrawerContent({
  navigation,
  activePage,
  onPageChange,
  externalOpen,
  externalCategoryLabel,
  onExternalClose,
}: SectionDrawerProps) {
  const categories = "categories" in navigation ? navigation.categories : null;
  const flatPages = "pages" in navigation ? navigation.pages : null;
  const externalCategoryIndex =
    categories && externalOpen && externalCategoryLabel
      ? categories.findIndex((category) => category.label === externalCategoryLabel)
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
    categories && activeCategoryIndex !== null ? categories[activeCategoryIndex] : null;

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

  const selectPage = useCallback(
    (id: string) => {
      onPageChange(id);
      close();
    },
    [onPageChange, close]
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
      {/* Trigger: hamburger only */}
      <IconButton
        label="Open section navigation"
        onClick={open}
        className="h-10 w-10"
        icon={<MenuIcon />}
      />

      <DrawerBackdrop isOpen={isOpen} onClose={close} />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 ${uiLayerForeground} w-72 max-w-[85vw] ${colourPopoverSurface} border-r flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
        role="dialog"
        aria-modal="true"
        aria-label="Section navigation"
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        {/* Drawer header */}
        <div
          className={`flex items-center justify-between px-4 py-3 border-b ${colourDivider} shrink-0`}
        >
          <span className={`text-sm font-semibold ${colourTextPrimary} uppercase tracking-wide`}>
            Navigate
          </span>
          <CloseButton onClick={close} ariaLabel="Close navigation" />
        </div>

        {flatPages ? (
          <div className="relative overflow-hidden flex-1">
            <div className="absolute inset-0 overflow-y-auto">
              <PageList pages={flatPages} activePage={activePage} onSelect={selectPage} />
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden flex-1">
            {/* Level 1: Categories */}
            <div
              className={`absolute inset-0 overflow-y-auto transition-transform duration-300 ease-in-out ${
                level === "categories" ? "translate-x-0" : "-translate-x-full"
              }`}
            >
              <ul className="py-2">
                {categories?.map((cat, index) => (
                  <li key={cat.label}>
                    <SectionDrawerRow onClick={() => openCategory(index)} trailing={<ArrowRight />}>
                      {cat.label}
                    </SectionDrawerRow>
                  </li>
                ))}
              </ul>
            </div>

            {/* Level 2: Pages */}
            <div
              className={`absolute inset-0 overflow-y-auto transition-transform duration-300 ease-in-out ${
                level === "pages" ? "translate-x-0" : "translate-x-full"
              }`}
            >
              {activeCategory && (
                <>
                  {/* Back button */}
                  <div className={`border-b ${colourDivider}`}>
                    <SectionDrawerRow
                      onClick={goBack}
                      aria-label={`Back to categories from ${activeCategory.label}`}
                      trailing={<ArrowLeft />}
                    >
                      {activeCategory.label}
                    </SectionDrawerRow>
                  </div>

                  <PageList
                    pages={activeCategory.pages}
                    activePage={activePage}
                    onSelect={selectPage}
                  />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
