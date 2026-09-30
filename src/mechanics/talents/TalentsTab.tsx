import { memo, useCallback, useMemo, useState } from "react";
import type {
  ArcheotechItem,
  AlternateRankSelection,
  Character,
  CyberneticItem,
  InsanityBlock,
  MeleeWeapon,
  RangedWeapon,
  WeaponTrainingBlock,
  PsychicBlock,
  TalentsAndTraitsBlock,
  TalentEntry,
} from "../../types/Character";
import { TALENT_LIST, type TalentData } from "../../data/reference/talentData";
import { AddButton } from "../../ui/buttons/AddButton";
import { ViewButton } from "../../ui/buttons/ViewButton";
import { uiSection, uiTextPlaceholder } from "../../ui/styles/editableStyles";
import { SectionHeader } from "../../ui/SectionHeader";
import { SegmentedTabs, type SegmentedTabOption } from "../../ui/SegmentedTabs";
import {
  segmentedTabId,
  segmentedTabPanelId,
  uiSwipeableTabPanel,
} from "../../ui/styles/segmentedTabStyles";
import { EntryCard, TalentGroupCard } from "./TalentEntryCards";
import { TalentPickerModal } from "./TalentPickerModal";
import { getAvailablePsychicTalentPurchases, getTalentBehaviour } from "./talentUtils";
import { getGrantedTalentEntries, filterTalentEntriesCoveredByGrants } from "./talentEffects";
import { buildTalentRemovalUpdate, hasRestorableTalentEffect } from "./talentRemovalRules";
import { useSwipeableTabs } from "../../hooks/useSwipeableTabs";
import { Button } from "../../ui/buttons/Button";
import { PickerBody, PickerModal } from "../../ui/pickers/PickerModal";
import { uiTextBody } from "../../ui/styles/editableStyles";
import { recordComponentRender } from "../../performance/performanceMetrics";
import { getFaithTalentGroupChip, type FaithTalentGroupChip } from "./faithTalentGroups";
import { useTalentAcquisitionFlow } from "./useTalentAcquisitionFlow";

interface TalentsTabProps {
  talents: TalentsAndTraitsBlock;
  career?: string;
  rank?: string;
  alternateRanks?: readonly AlternateRankSelection[];
  psychic: PsychicBlock;
  cybernetics?: CyberneticItem[];
  rangedWeapons?: RangedWeapon[];
  meleeWeapons?: MeleeWeapon[];
  archeotech?: ArcheotechItem[];
  insanity?: InsanityBlock;
  willpowerBonus?: number;
  weaponTraining?: WeaponTrainingBlock;
  isDM?: boolean;
  editable: boolean;
  onUpdateTalents: (next: TalentsAndTraitsBlock) => void;
  onUpdateCharacter?: (partial: Partial<Character>) => Promise<boolean>;
}

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
    activeClassName:
      "border-fuchsia-400 bg-fuchsia-600/80 text-white shadow-sm shadow-fuchsia-950/50",
  },
] as const satisfies readonly SegmentedTabOption<ViewGroup>[];
const TALENT_TABS_ID = "talent-groups";

const REGULAR_TALENT_LIST = TALENT_LIST.filter(
  (talent) => !talent.faithGroup && getTalentBehaviour(talent).kind !== "managed-elsewhere"
);
const FAITH_TALENT_LIST = TALENT_LIST.filter((talent) => !!talent.faithGroup);
const FAITH_TALENT_IDS = new Set(FAITH_TALENT_LIST.map((talent) => talent.id));
const TALENT_BY_ID = new Map(TALENT_LIST.map((talent) => [talent.id, talent]));

function FaithTalentSection({
  entries,
  psychic,
  editable,
  isDM,
  onAdd,
  onRemove,
  pickerSuspended = false,
  career,
  rank,
  alternateRanks,
}: {
  entries: TalentEntry[];
  psychic: PsychicBlock;
  editable: boolean;
  isDM: boolean;
  onAdd: (entry: TalentEntry) => void;
  onRemove: (uid: string) => void;
  pickerSuspended?: boolean;
  career?: string;
  rank?: string;
  alternateRanks?: readonly AlternateRankSelection[];
}) {
  const [showPicker, setShowPicker] = useState(false);
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <SectionHeader>Faith Talents</SectionHeader>
        {editable ? (
          <AddButton label="Add Faith Talent" onClick={() => setShowPicker(true)} />
        ) : (
          <ViewButton label="View Faith Talents" onClick={() => setShowPicker(true)} />
        )}
      </div>
      <section className={uiSection + " space-y-2"}>
        {entries.length === 0 && (
          <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>None added yet.</p>
        )}
        <div className="grid grid-cols-1 gap-2">
          <TalentCards
            entries={entries}
            psychic={psychic}
            editable={editable}
            onRemove={onRemove}
            getStatusChip={(talentId) => getFaithTalentGroupChip(TALENT_BY_ID.get(talentId))}
          />
        </div>
        {showPicker && (
          <TalentPickerModal
            title={editable ? "Add Faith Talent" : "View Faith Talents"}
            listData={FAITH_TALENT_LIST}
            entries={entries}
            useTalentBehaviours
            editable={editable}
            isDM={isDM}
            onAdd={onAdd}
            onClose={() => setShowPicker(false)}
            suspended={pickerSuspended}
            career={career}
            rank={rank}
            alternateRanks={alternateRanks}
          />
        )}
      </section>
    </div>
  );
}

const TalentCards = memo(function TalentCards({
  entries,
  psychic,
  editable,
  onRemove,
  getStatusChip,
}: {
  entries: TalentEntry[];
  psychic: PsychicBlock;
  editable: boolean;
  onRemove: (uid: string) => void;
  getStatusChip?: (talentId: string) => FaithTalentGroupChip | undefined;
}) {
  recordComponentRender("TalentCards");
  const groups = new Map<string, TalentEntry[]>();
  for (const entry of entries) {
    const current = groups.get(entry.talentId) ?? [];
    current.push(entry);
    groups.set(entry.talentId, current);
  }

  return [...groups.entries()]
    .sort(([aId, aEntries], [bId, bEntries]) =>
      (TALENT_BY_ID.get(aId)?.name ?? aEntries[0].name).localeCompare(
        TALENT_BY_ID.get(bId)?.name ?? bEntries[0].name
      )
    )
    .map(([talentId, talentEntries]) => {
      const reference = TALENT_BY_ID.get(talentId) as TalentData | undefined;
      const behaviour = reference ? getTalentBehaviour(reference) : { kind: "ordinary" as const };
      const statusChip = getStatusChip?.(talentId);

      if (behaviour.kind === "ranked") {
        return (
          <EntryCard
            key={talentId}
            entry={talentEntries[talentEntries.length - 1]}
            displayName={`${reference?.name ?? talentEntries[0].name} (${talentEntries.length})`}
            editable={editable}
            onRemove={onRemove}
            confirmDeletion
            statusAfterSource
            statusChip={statusChip?.label}
            statusChipClassName={statusChip?.className}
          />
        );
      }

      if (behaviour.kind === "psychic-purchase") {
        const available = getAvailablePsychicTalentPurchases(
          { homeworld: "", talents: entries, traits: [] },
          psychic,
          behaviour.powerGroup
        );
        const removableEntry = available[0] ?? talentEntries[0];
        return (
          <EntryCard
            key={talentId}
            entry={removableEntry}
            displayName={reference?.name ?? talentEntries[0].name}
            statusChip={`Owned: ${talentEntries.length}`}
            editable={editable}
            removable={available.length > 0}
            deletionBlockedMessage={
              available.length === 0
                ? "This Talent cannot be deleted until its linked Psychic powers are deleted."
                : undefined
            }
            onRemove={onRemove}
            confirmDeletion
            statusAfterSource
          />
        );
      }

      const groupable =
        behaviour.kind === "fixed-repeatable" ||
        behaviour.kind === "hybrid" ||
        behaviour.kind === "repeatable-free-text";
      if (groupable && talentEntries.length > 1) {
        return (
          <TalentGroupCard
            key={talentId}
            name={reference?.name ?? talentEntries[0].name}
            entries={talentEntries}
            editable={editable}
            onRemove={onRemove}
            statusAfterSource
            statusChip={statusChip?.label}
            statusChipClassName={statusChip?.className}
          />
        );
      }

      return talentEntries.map((entry) => (
        <EntryCard
          key={entry.uid}
          entry={entry}
          editable={editable}
          onRemove={onRemove}
          confirmDeletion
          statusChip={statusChip?.label}
          statusChipClassName={statusChip?.className}
          statusAfterSource
          removable={
            !entry.grantedByTalentEntryUid &&
            ![...psychic.minorPowers, ...psychic.majorPowers].some(
              (power) => power.psyRatingTalentEntryUid === entry.uid
            )
          }
          deletionBlockedMessage={
            !entry.grantedByTalentEntryUid &&
            [...psychic.minorPowers, ...psychic.majorPowers].some(
              (power) => power.psyRatingTalentEntryUid === entry.uid
            )
              ? "This Talent cannot be deleted until its linked Psychic powers are deleted."
              : undefined
          }
        />
      ));
    });
});

function RegularTalentSection({
  entries,
  psychic,
  editable,
  isDM,
  onAdd,
  onRemove,
  columns = 1,
  pickerSuspended = false,
  career,
  rank,
  alternateRanks,
}: {
  entries: TalentEntry[];
  psychic: PsychicBlock;
  editable: boolean;
  isDM: boolean;
  onAdd: (entry: TalentEntry) => void;
  onRemove: (uid: string) => void;
  columns?: 1 | 2;
  pickerSuspended?: boolean;
  career?: string;
  rank?: string;
  alternateRanks?: readonly AlternateRankSelection[];
}) {
  const [showPicker, setShowPicker] = useState(false);
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <SectionHeader>Talents</SectionHeader>
        {editable ? (
          <AddButton label="Add Talent" onClick={() => setShowPicker(true)} />
        ) : (
          <ViewButton label="View Talents" onClick={() => setShowPicker(true)} />
        )}
      </div>
      <section className={uiSection + " space-y-2"}>
        {entries.length === 0 && (
          <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>None added yet.</p>
        )}
        <div className={`grid gap-2 ${columns === 2 ? "lg:grid-cols-2" : "grid-cols-1"}`}>
          <TalentCards
            entries={entries}
            psychic={psychic}
            editable={editable}
            onRemove={onRemove}
          />
        </div>
        {showPicker && (
          <TalentPickerModal
            title={editable ? "Add Talent" : "View Talents"}
            listData={REGULAR_TALENT_LIST}
            entries={entries}
            useTalentBehaviours
            editable={editable}
            isDM={isDM}
            onAdd={onAdd}
            onClose={() => setShowPicker(false)}
            suspended={pickerSuspended}
            career={career}
            rank={rank}
            alternateRanks={alternateRanks}
          />
        )}
      </section>
    </div>
  );
}

export function TalentsTab({
  talents,
  career,
  rank,
  alternateRanks,
  psychic,
  cybernetics = [],
  rangedWeapons = [],
  meleeWeapons = [],
  archeotech = [],
  insanity = { points: 0, disorders: [] },
  willpowerBonus = 0,
  weaponTraining = { trained: [], exoticWeapons: [] },
  isDM = false,
  editable,
  onUpdateTalents,
  onUpdateCharacter,
}: TalentsTabProps) {
  recordComponentRender("TalentsTab");
  const [savingTalentMutation, setSavingTalentMutation] = useState(false);
  const [pendingEffectDeletion, setPendingEffectDeletion] = useState<TalentEntry | null>(null);
  const saveTalentAcquisition = useCallback(
    async (partial: Partial<Character>): Promise<boolean> => {
      if (onUpdateCharacter) return onUpdateCharacter(partial);
      if (partial.talentsAndTraits) onUpdateTalents(partial.talentsAndTraits);
      return true;
    },
    [onUpdateCharacter, onUpdateTalents]
  );
  const {
    addTalent: handleAddTalent,
    acquisitionPending,
    acquisitionModal,
  } = useTalentAcquisitionFlow({
    talents,
    career,
    psychic,
    cybernetics,
    rangedWeapons,
    meleeWeapons,
    archeotech,
    insanity,
    willpowerBonus,
    weaponTraining,
    onSave: saveTalentAcquisition,
  });
  const applyTalentRemoval = useCallback(
    async (entry: TalentEntry, restoreOneTimeEffects: boolean) => {
      const update = buildTalentRemovalUpdate({
        entry,
        restoreOneTimeEffects,
        talents,
        psychic,
        cybernetics,
        insanity,
        rangedWeapons,
        meleeWeapons,
        archeotech,
      });
      if (onUpdateCharacter) {
        setSavingTalentMutation(true);
        const saved = await onUpdateCharacter(update);
        setSavingTalentMutation(false);
        if (saved === false) return;
      } else {
        onUpdateTalents(update.talentsAndTraits);
      }
      setPendingEffectDeletion(null);
    },
    [
      talents,
      psychic,
      cybernetics,
      insanity,
      rangedWeapons,
      meleeWeapons,
      archeotech,
      onUpdateCharacter,
      onUpdateTalents,
    ]
  );
  const handleRemoveTalent = useCallback(
    (uid: string) => {
      const entry = talents.talents.find((talent) => talent.uid === uid);
      if (!entry) return;
      if (hasRestorableTalentEffect(entry)) {
        setPendingEffectDeletion(entry);
        return;
      }
      applyTalentRemoval(entry, false);
    },
    [talents.talents, applyTalentRemoval]
  );
  const [activeView, setActiveView] = useState<ViewGroup>("talents");
  const { containerRef, transitionClass, switchTo } = useSwipeableTabs(
    VIEW_GROUPS,
    activeView,
    setActiveView
  );
  const regularEntries = useMemo(() => {
    const grantedEntries = getGrantedTalentEntries(talents, career);
    return [
      ...filterTalentEntriesCoveredByGrants(
        talents.talents.filter((entry) => !FAITH_TALENT_IDS.has(entry.talentId)),
        grantedEntries
      ),
      ...grantedEntries,
    ];
  }, [talents, career]);
  const faithEntries = useMemo(
    () => talents.talents.filter((entry) => FAITH_TALENT_IDS.has(entry.talentId)),
    [talents.talents]
  );
  const showFaith = editable || faithEntries.length > 0;

  return (
    <div className="space-y-8">
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
                <RegularTalentSection
                  entries={regularEntries}
                  psychic={psychic}
                  editable={editable}
                  isDM={isDM}
                  onAdd={handleAddTalent}
                  onRemove={handleRemoveTalent}
                  pickerSuspended={acquisitionPending}
                  career={career}
                  rank={rank}
                  alternateRanks={alternateRanks}
                />
              ) : (
                <FaithTalentSection
                  entries={faithEntries}
                  psychic={psychic}
                  editable={editable}
                  isDM={isDM}
                  onAdd={handleAddTalent}
                  onRemove={handleRemoveTalent}
                  pickerSuspended={acquisitionPending}
                  career={career}
                  rank={rank}
                  alternateRanks={alternateRanks}
                />
              )}
            </section>
          </>
        ) : (
          <RegularTalentSection
            entries={regularEntries}
            psychic={psychic}
            editable={editable}
            isDM={isDM}
            onAdd={handleAddTalent}
            onRemove={handleRemoveTalent}
            pickerSuspended={acquisitionPending}
            career={career}
            rank={rank}
            alternateRanks={alternateRanks}
          />
        )}
      </div>

      <div
        className={`hidden lg:grid lg:gap-6 lg:items-start ${showFaith ? "lg:grid-cols-2" : "lg:grid-cols-1"}`}
      >
        <RegularTalentSection
          entries={regularEntries}
          psychic={psychic}
          editable={editable}
          isDM={isDM}
          onAdd={handleAddTalent}
          onRemove={handleRemoveTalent}
          columns={showFaith ? 1 : 2}
          pickerSuspended={acquisitionPending}
          career={career}
          rank={rank}
          alternateRanks={alternateRanks}
        />
        {showFaith && (
          <FaithTalentSection
            entries={faithEntries}
            psychic={psychic}
            editable={editable}
            isDM={isDM}
            onAdd={handleAddTalent}
            onRemove={handleRemoveTalent}
            pickerSuspended={acquisitionPending}
            career={career}
            rank={rank}
            alternateRanks={alternateRanks}
          />
        )}
      </div>

      {acquisitionModal}

      {pendingEffectDeletion && (
        <PickerModal
          title={`Delete ${pendingEffectDeletion.name}`}
          query=""
          onQueryChange={() => undefined}
          onClose={() => setPendingEffectDeletion(null)}
          isEmpty={false}
          hideSearch
          maxWidth="max-w-md"
        >
          <PickerBody>
            <p className={`text-sm ${uiTextBody}`}>
              This Talent recorded a one-time change. Choose whether deleting the Talent should also
              restore what that acquisition changed.
            </p>
            <div className="space-y-2">
              <Button
                fullWidth
                loading={savingTalentMutation}
                loadingLabel="Saving"
                onClick={() => void applyTalentRemoval(pendingEffectDeletion, true)}
              >
                Delete and restore recorded changes
              </Button>
              <Button
                fullWidth
                variant="ghost"
                disabled={savingTalentMutation}
                onClick={() => void applyTalentRemoval(pendingEffectDeletion, false)}
              >
                Delete Talent only
              </Button>
              <Button
                fullWidth
                variant="neutral"
                disabled={savingTalentMutation}
                onClick={() => setPendingEffectDeletion(null)}
              >
                Cancel
              </Button>
            </div>
          </PickerBody>
        </PickerModal>
      )}
    </div>
  );
}
