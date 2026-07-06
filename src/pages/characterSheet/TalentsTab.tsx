// src/pages/characterSheet/TalentsTab.tsx

import { useCallback, useMemo, useState } from "react";
import type {
  TalentsAndTraitsBlock,
  TalentEntry,
} from "../../types/Character";
import { TALENT_LIST } from "../../data/talentData";
import { uiSection, uiTextPlaceholder, uiFormLabel } from "../../ui/editableStyles";
import { SectionHeader } from "../../ui/SectionHeader";
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
        <button
          onClick={() => setShowPicker(true)}
          className="text-xs lg:text-sm px-3 lg:px-4 py-1 lg:py-1.5 rounded border border-red-500 text-red-500 font-semibold hover:bg-red-500/10 transition"
        >
          {editable ? "+ Add Faith Talent" : "View Faith Talents"}
        </button>
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

const [activeView, setActiveView] = useState<"talents" | "faith">("talents");
  const { containerRef, transition, switchTo } = useSwipeableTabs(VIEW_GROUPS, activeView, setActiveView);

  const transitionClass = transition === "sliding"
    ? activeView === "talents" ? "opacity-0 -translate-x-3" : "opacity-0 translate-x-3"
    : "opacity-100";

  const hasFaithTalents = talents.talents.some((e) => FAITH_TALENT_IDS.has(e.talentId));
  const showFaith = editable || hasFaithTalents;

  return (
    <div className="space-y-8">
      {/* MOBILE: swipe tabs */}
      <div ref={containerRef} className="lg:hidden">
        {showFaith ? (
          <>
            <div
              className="grid grid-cols-2 rounded-lg border border-slate-600 bg-slate-950/70 p-1 mb-4"
              role="tablist"
              aria-label="Talent groups"
            >
              {(["talents", "faith"] as const).map((view) => {
                const active = activeView === view;
                return (
                  <button
                    key={view}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => switchTo(view)}
                    className={[
                      "rounded-md px-3 py-1.5 text-xs font-semibold transition border",
                      active
                        ? view === "talents"
                          ? "border-violet-400 bg-violet-600/80 text-white shadow-sm shadow-violet-950/50"
                          : "border-fuchsia-400 bg-fuchsia-600/80 text-white shadow-sm shadow-fuchsia-950/50"
                        : "border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200",
                    ].join(" ")}
                  >
                    {view === "talents" ? "Talents" : "Faith Talents"}
                  </button>
                );
              })}
            </div>
            <section
              key={activeView}
              className={`transition-all duration-150 ease-out motion-reduce:transition-none ${transitionClass}`}
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
