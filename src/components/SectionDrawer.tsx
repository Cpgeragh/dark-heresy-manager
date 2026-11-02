// src/components/SectionDrawer.tsx

import { useState, useEffect, useCallback } from "react";
import { CloseButton } from "../ui/buttons/CloseButton";
import { IconButton } from "../ui/buttons/IconButton";
import { MenuIcon } from "../ui/icons/MenuIcon";
import { ArrowLeft, ArrowRight } from "../ui/icons/PickerArrows";
import { DrawerBackdrop } from "../ui/DrawerBackdrop";
import { SectionDrawerRow } from "../ui/SectionDrawerRow";
import {
  colourTextPrimary,
  colourPopoverSurface,
  colourDivider,
  colourShadowStrong,
} from "../ui/styles/colourTokens";
import { uiSplitRow } from "../ui/styles/editableStyles";
import { uiDrawerDuration, uiLayerForeground } from "../ui/styles/layerStyles";
import { uiIconSize } from "../ui/styles/iconStyles";

// ================================================================
// NAVIGATION STRUCTURE
// ================================================================

export interface SectionDrawerPage {
  id: string;
  label: string;
}

export interface SectionDrawerCategory {
  label: string;
  pages: readonly SectionDrawerEntry[];
}

/** A row that opens a further list of entries, built the same way as a category. */
export type SectionDrawerGroup = SectionDrawerCategory;

export type SectionDrawerEntry = SectionDrawerPage | SectionDrawerGroup;

export type SectionNavigation =
  | { categories: readonly SectionDrawerCategory[] }
  | { pages: readonly SectionDrawerEntry[] };

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

function isGroup(entry: SectionDrawerEntry): entry is SectionDrawerGroup {
  return "pages" in entry;
}

interface DrawerPanel {
  label: string | null;
  backTarget: string;
  entries: readonly SectionDrawerEntry[];
}

/** The root list, then one panel for every group opened along the trail. */
function getPanels(
  root: readonly SectionDrawerEntry[],
  rootName: string,
  trail: readonly number[]
): DrawerPanel[] {
  const panels: DrawerPanel[] = [{ label: null, backTarget: rootName, entries: root }];
  let entries = root;
  let parentName = rootName;
  for (const index of trail) {
    const entry = entries[index] as SectionDrawerEntry | undefined;
    if (!entry || !isGroup(entry)) break;
    panels.push({ label: entry.label, backTarget: parentName, entries: entry.pages });
    entries = entry.pages;
    parentName = entry.label;
  }
  return panels;
}

function panelOffset(position: number, depth: number): string {
  if (position === depth) return "translate-x-0";
  return position < depth ? "-translate-x-full" : "translate-x-full";
}

function EntryList({
  entries,
  activePage,
  onOpen,
  onSelect,
}: {
  entries: readonly SectionDrawerEntry[];
  activePage: string;
  onOpen: (index: number) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <ul className="py-2">
      {entries.map((entry, index) =>
        isGroup(entry) ? (
          <li key={`group:${entry.label}`}>
            <SectionDrawerRow onClick={() => onOpen(index)} trailing={<ArrowRight />}>
              {entry.label}
            </SectionDrawerRow>
          </li>
        ) : (
          <li key={`page:${entry.id}`}>
            <SectionDrawerRow onClick={() => onSelect(entry.id)} active={activePage === entry.id}>
              {entry.label}
            </SectionDrawerRow>
          </li>
        )
      )}
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
  const rootEntries: readonly SectionDrawerEntry[] =
    "categories" in navigation ? navigation.categories : navigation.pages;
  const rootName = categories ? "categories" : "pages";
  const externalCategoryIndex =
    categories && externalOpen && externalCategoryLabel
      ? categories.findIndex((category) => category.label === externalCategoryLabel)
      : -1;
  const hasExternalCategory = externalCategoryIndex >= 0;

  const [isOpen, setIsOpen] = useState(hasExternalCategory);
  const [trail, setTrail] = useState<readonly number[]>(
    hasExternalCategory ? [externalCategoryIndex] : []
  );
  const [depth, setDepth] = useState(hasExternalCategory ? 1 : 0);

  const panels = getPanels(rootEntries, rootName, trail);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setTrail([]);
    setDepth(0);
    onExternalClose?.();
  }, [onExternalClose]);

  const openGroup = useCallback((position: number, index: number) => {
    setTrail((current) => [...current.slice(0, position), index]);
    setDepth(position + 1);
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
        icon={<MenuIcon className={uiIconSize.px18} />}
      />

      <DrawerBackdrop isOpen={isOpen} onClose={close} />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 ${uiLayerForeground} w-72 max-w-[85vw] ${colourPopoverSurface} border-r flex flex-col ${colourShadowStrong} transition-transform ${uiDrawerDuration} ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
        role="dialog"
        aria-modal="true"
        aria-label="Section navigation"
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        {/* Drawer header */}
        <div className={`${uiSplitRow} px-4 py-3 border-b ${colourDivider} shrink-0`}>
          <span className={`text-sm font-semibold ${colourTextPrimary} uppercase tracking-wide`}>
            Navigate
          </span>
          <CloseButton onClick={close} ariaLabel="Close navigation" />
        </div>

        <div className="relative overflow-hidden flex-1">
          {panels.map((panel, position) => (
            <div
              key={`${position}:${panel.label ?? "root"}`}
              className={`absolute inset-0 overflow-y-auto transition-transform ${uiDrawerDuration} ease-in-out ${panelOffset(position, depth)}`}
            >
              {panel.label !== null && (
                <div className={`border-b ${colourDivider}`}>
                  <SectionDrawerRow
                    onClick={() => setDepth(position - 1)}
                    aria-label={`Back to ${panel.backTarget} from ${panel.label}`}
                    trailing={<ArrowLeft />}
                  >
                    {panel.label}
                  </SectionDrawerRow>
                </div>
              )}
              <EntryList
                entries={panel.entries}
                activePage={activePage}
                onOpen={(index) => openGroup(position, index)}
                onSelect={selectPage}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
