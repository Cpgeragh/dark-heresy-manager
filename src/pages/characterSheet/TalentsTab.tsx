// src/pages/characterSheet/TalentsTab.tsx

import { useCallback, useMemo, useState } from "react";
import type {
  TalentsAndTraitsBlock,
  TalentEntry,
} from "../../types/Character";
import { TALENT_LIST } from "../../data/talentData";
import { Button } from "../../ui/Button";
import { uiSection, uiTextPlaceholder, uiFormLabel } from "../../ui/editableStyles";
import { SectionHeader } from "../../ui/SectionHeader";
import { SegmentedTabs, type SegmentedTabOption } from "../../ui/SegmentedTabs";
import {
  segmentedTabId,
  segmentedTabPanelId,
  uiSwipeableTabPanel,
} from "../../ui/segmentedTabStyles";
import { EntryCard, EntrySection, TalentPickerModal } from "./talentComponents";
import { useSwipeableTabs } from "../../hooks/useSwipeableTabs";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TalentsTabProps {
  talents: TalentsAndTraitsBlock;
  editable: boolean;
  onUpdateTalents: (next: TalentsAndTraitsBlock) => void;
}

// ─── Faith Talent constants ───────────────────────────────────────────────────

const FAITH_GROUP_LABELS: Record<string, string> = {
  sign: "Emperor's Sign",
  mercy: "Emperor's Mercy",
  wrath: "Emperor's Wrath",
};

const FAITH_GROUP_ORDER = ["mercy", "sign", "wrath"] as const;
const VIEW_GROUPS = ["talents", "faith"] as const;
type ViewGroup = (typeof VIEW_GROUPS)[number];
const TALENT_TABS = [
  {
    value: "talents",
    label: "Talents",
    activeClassName: "border-violet-400 bg-violet-600/80 text-white shadow-sm shadow-violet-950/50",
  },
  {
    value: "faith",
    label: "Faith Talents",
    activeClassName: "border-fuchsia-400 bg-fuchsia-600/80 text-white shadow-sm shadow-fuchsia-950/50",
  },
] as const satisfies readonly SegmentedTabOption<ViewGroup>[];
const TALENT_TABS_ID = "talent-groups";

const REGULAR_TALENT_LIST = TALENT_LIST.filter((t) => !t.faithGroup);
const FAITH_TALENT_LIST = TALENT_LIST.filter((t) => !!t.faithGroup);
const FAITH_TALENT_IDS = new Set(FAITH_TALENT_LIST.map((t) => t.id));

function getFaithGroup(talentId: string): string | undefined {
  return FAITH_TALENT_LIST.find((t) => t.id === talentId)?.faithGroup;
}

// ─── FaithTalentSection ───────────────────────────────────────────────────────

function FaithTalentSection({
  entries,
  editable,
  onAdd,
  onRemove,
}: {
  entries: TalentEntry[];
  editable: boolean;
  onAdd: (entry: TalentEntry) => void;
  onRemove: (uid: string) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);

  const selectedIds = useMemo(() => new Set(entries.map((e) => e.talentId)), [entries]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <SectionHeader>Faith Talents</SectionHeader>
      <Button
        size="sm"
        onClick={() => setShowPicker(true)}
      >
        {editable ? "+ Add Faith Talent" : "View Faith Talents"}
      </Button>
      </div>

      <section className={uiSection + " space-y-4"}>
        {FAITH_GROUP_ORDER.map((group) => {
          const groupEntries = entries
            .filter((e) => getFaithGroup(e.talentId) === group)
            .sort((a, b) => a.name.localeCompare(b.name));
          return (
            <div key={group}>
              <p className={`${uiFormLabel} mb-1.5`}>
                {FAITH_GROUP_LABELS[group]}
              </p>
              {groupEntries.length === 0 && <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>None.</p>}
              <div className="grid grid-cols-1 gap-2">
                {groupEntries.map((entry) => (
                  <EntryCard
                    key={entry.uid}
                    entry={entry}
                    editable={editable}
                    onRemove={onRemove}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {showPicker && (
          <TalentPickerModal
            title={editable ? "Add Faith Talent" : "View Faith Talents"}
            listData={FAITH_TALENT_LIST}
            selectedIds={selectedIds}
            editable={editable}
            onAdd={onAdd}
            onClose={() => setShowPicker(false)}
          />
        )}
      </section>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function TalentsTab({
  talents,
  editable,
  onUpdateTalents,
}: TalentsTabProps) {
  // ── Talents ──
  const handleAddTalent = useCallback(
    (entry: TalentEntry) => {
      onUpdateTalents({ ...talents, talents: [...talents.talents, entry] });
    },
    [talents, onUpdateTalents]
  );

  const handleRemoveTalent = useCallback(
    (uid: string) => {
      onUpdateTalents({
        ...talents,
        talents: talents.talents.filter((t) => t.uid !== uid),
      });
    },
    [talents, onUpdateTalents]
  );

const [activeView, setActiveView] = useState<ViewGroup>("talents");
  const { containerRef, transitionClass, switchTo } = useSwipeableTabs(
    VIEW_GROUPS,
    activeView,
    setActiveView
  );

  const hasFaithTalents = talents.talents.some((e) => FAITH_TALENT_IDS.has(e.talentId));
  const showFaith = editable || hasFaithTalents;

  return (
    <div className="space-y-8">
      {/* MOBILE: swipe tabs */}
      <div ref={showFaith ? containerRef : undefined} className="lg:hidden">
        {showFaith ? (
          <>
            <SegmentedTabs
              id={TALENT_TABS_ID}
              ariaLabel="Talent groups"
              options={TALENT_TABS}
              value={activeView}
              onChange={switchTo}
              className="mb-4"
            />
            <section
              key={activeView}
              id={segmentedTabPanelId(TALENT_TABS_ID, activeView)}
              aria-labelledby={segmentedTabId(TALENT_TABS_ID, activeView)}
              className={[uiSwipeableTabPanel, transitionClass].join(" ")}
              role="tabpanel"
            >
              {activeView === "talents" ? (
                <EntrySection
                  title="Talents"
                  singular="Talent"
                  entries={talents.talents.filter((e) => !FAITH_TALENT_IDS.has(e.talentId))}
                  listData={REGULAR_TALENT_LIST}
                  editable={editable}
                  onAdd={handleAddTalent}
                  onRemove={handleRemoveTalent}
                />
              ) : (
                <FaithTalentSection
                  entries={talents.talents.filter((e) => FAITH_TALENT_IDS.has(e.talentId))}
                  editable={editable}
                  onAdd={handleAddTalent}
                  onRemove={handleRemoveTalent}
                />
              )}
            </section>
          </>
        ) : (
          <EntrySection
            title="Talents"
            singular="Talent"
            entries={talents.talents.filter((e) => !FAITH_TALENT_IDS.has(e.talentId))}
            listData={REGULAR_TALENT_LIST}
            editable={editable}
            onAdd={handleAddTalent}
            onRemove={handleRemoveTalent}
          />
        )}
      </div>

      {/* DESKTOP: two-column grid when faith talents visible, full width otherwise */}
      <div className={`hidden lg:grid lg:gap-6 lg:items-start ${showFaith ? "lg:grid-cols-2" : "lg:grid-cols-1"}`}>
        <EntrySection
          title="Talents"
          singular="Talent"
          entries={talents.talents.filter((e) => !FAITH_TALENT_IDS.has(e.talentId))}
          listData={REGULAR_TALENT_LIST}
          editable={editable}
          onAdd={handleAddTalent}
          onRemove={handleRemoveTalent}
          columns={showFaith ? 1 : 2}
        />
        {showFaith && (
          <FaithTalentSection
            entries={talents.talents.filter((e) => FAITH_TALENT_IDS.has(e.talentId))}
            editable={editable}
            onAdd={handleAddTalent}
            onRemove={handleRemoveTalent}
          />
        )}
      </div>

    </div>
  );
}
