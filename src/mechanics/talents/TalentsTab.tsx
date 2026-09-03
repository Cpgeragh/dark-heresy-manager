import { useCallback, useMemo, useState } from "react";
import type {
  ArcheotechItem,
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
import { uiFormLabel, uiSection, uiTextPlaceholder } from "../../ui/styles/editableStyles";
import { SectionHeader } from "../../ui/SectionHeader";
import { SegmentedTabs, type SegmentedTabOption } from "../../ui/SegmentedTabs";
import {
  segmentedTabId,
  segmentedTabPanelId,
  uiSwipeableTabPanel,
} from "../../ui/styles/segmentedTabStyles";
import {
  EntryCard,
  TalentGroupCard,
  TalentPickerModal,
} from "./talentComponents";
import {
  getAvailablePsychicTalentPurchases,
  getTalentBehaviour,
} from "./talentUtils";
import { getGrantedTalentEntries, filterTalentEntriesCoveredByGrants } from "./talentEffects";
import {
  needsTalentAcquisition,
  TalentAcquisitionModal,
  type TalentAcquisitionResult,
} from "./TalentAcquisitionModal";
import { useSwipeableTabs } from "../../hooks/useSwipeableTabs";
import { Button } from "../../ui/buttons/Button";
import { PickerBody, PickerModal } from "../../ui/pickers/PickerModal";
import { uiTextBody } from "../../ui/styles/editableStyles";

interface TalentsTabProps {
  talents: TalentsAndTraitsBlock;
  career?: string;
  rank?: string;
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
  onUpdateCharacter?: (partial: Partial<Character>) => void;
}

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

const REGULAR_TALENT_LIST = TALENT_LIST.filter(
  (talent) => !talent.faithGroup && getTalentBehaviour(talent).kind !== "managed-elsewhere"
);
const FAITH_TALENT_LIST = TALENT_LIST.filter((talent) => !!talent.faithGroup);
const FAITH_TALENT_IDS = new Set(FAITH_TALENT_LIST.map((talent) => talent.id));
const TALENT_BY_ID = new Map(TALENT_LIST.map((talent) => [talent.id, talent]));

function getFaithGroup(talentId: string): string | undefined {
  return FAITH_TALENT_LIST.find((talent) => talent.id === talentId)?.faithGroup;
}

function FaithTalentSection({
  entries,
  editable,
  isDM,
  onAdd,
  onRemove,
  pickerSuspended = false,
  career,
  rank,
}: {
  entries: TalentEntry[];
  editable: boolean;
  isDM: boolean;
  onAdd: (entry: TalentEntry) => void;
  onRemove: (uid: string) => void;
  pickerSuspended?: boolean;
  career?: string;
  rank?: string;
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
      <section className={uiSection + " space-y-4"}>
        {FAITH_GROUP_ORDER.map((group) => {
          const groupEntries = entries
            .filter((entry) => getFaithGroup(entry.talentId) === group)
            .sort((a, b) => a.name.localeCompare(b.name));
          return (
            <div key={group}>
              <p className={`${uiFormLabel} mb-1.5`}>{FAITH_GROUP_LABELS[group]}</p>
              {groupEntries.length === 0 && (
                <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>None.</p>
              )}
              <div className="grid grid-cols-1 gap-2">
                {groupEntries.map((entry) => (
                  <EntryCard
                    key={entry.uid}
                    entry={entry}
                    editable={editable}
                    onRemove={onRemove}
                    confirmDeletion
                    statusAfterSource
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
            entries={entries}
            useTalentBehaviours
            editable={editable}
            isDM={isDM}
            onAdd={onAdd}
            onClose={() => setShowPicker(false)}
            suspended={pickerSuspended}
            career={career}
            rank={rank}
          />
        )}
      </section>
    </div>
  );
}

function TalentCards({
  entries,
  psychic,
  editable,
  onRemove,
}: {
  entries: TalentEntry[];
  psychic: PsychicBlock;
  editable: boolean;
  onRemove: (uid: string) => void;
}) {
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
            deletionBlockedMessage={available.length === 0
              ? "This Talent cannot be deleted until its linked Psychic powers are deleted."
              : undefined}
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
}

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
          <TalentCards entries={entries} psychic={psychic} editable={editable} onRemove={onRemove} />
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
  const [pendingAcquisition, setPendingAcquisition] = useState<TalentEntry | null>(null);
  const [pendingEffectDeletion, setPendingEffectDeletion] = useState<TalentEntry | null>(null);
  const handleAddTalent = useCallback(
    (entry: TalentEntry) => {
      const psyRatingMatch = entry.talentId.match(/^psy-rating-[1-6]$/);
      const psyRating = psyRatingMatch ? Number(entry.talentId.slice(-1)) : 0;
      const minorGrants = psyRating === 1 || psyRating === 2
        ? Math.ceil(willpowerBonus / 2)
        : undefined;
      const preparedEntry = psyRatingMatch
        ? {
            ...entry,
            acquisition: {
              ...entry.acquisition,
              psyRatingWillpowerBonus: willpowerBonus,
              ...(minorGrants !== undefined ? { psyRatingMinorPowerGrants: minorGrants } : {}),
            },
          }
        : entry;
      if (needsTalentAcquisition(preparedEntry, talents)) {
        setPendingAcquisition(preparedEntry);
        return;
      }
      onUpdateTalents({ ...talents, talents: [...talents.talents, preparedEntry] });
    },
    [talents, onUpdateTalents, willpowerBonus]
  );

  const handleAcquisitionComplete = useCallback(
    (result: TalentAcquisitionResult) => {
      const nextTalents = {
        ...talents,
        talents: [
          ...talents.talents,
          result.entry,
          ...(result.additionalTalentEntries ?? []),
        ],
      };
      const grantedDiscipline = result.entry.acquisition?.psyRatingNewDiscipline
        ? result.entry.acquisition.psyRatingDiscipline
        : undefined;
      const nextPsychic = grantedDiscipline && !(psychic.disciplines ?? []).includes(grantedDiscipline)
        ? { ...psychic, disciplines: [...(psychic.disciplines ?? []), grantedDiscipline] }
        : psychic;
      if (onUpdateCharacter) {
        onUpdateCharacter({
          talentsAndTraits: nextTalents,
          ...(nextPsychic !== psychic ? { psychic: nextPsychic } : {}),
          ...(result.cybernetics ? { cybernetics: result.cybernetics } : {}),
          ...(result.rangedWeapons ? { rangedWeapons: result.rangedWeapons } : {}),
          ...(result.meleeWeapons ? { meleeWeapons: result.meleeWeapons } : {}),
          ...(result.archeotech ? { archeotech: result.archeotech } : {}),
          ...(result.insanity ? { insanity: result.insanity } : {}),
        });
      } else {
        onUpdateTalents(nextTalents);
      }
      setPendingAcquisition(null);
    },
    [talents, psychic, onUpdateCharacter, onUpdateTalents]
  );
  const applyTalentRemoval = useCallback(
    (entry: TalentEntry, restoreOneTimeEffects: boolean) => {
      const nextTalents = {
        ...talents,
        talents: talents.talents.filter((talent) => talent.uid !== entry.uid),
      };
      const removedDiscipline = entry.acquisition?.psyRatingNewDiscipline
        ? entry.acquisition.psyRatingDiscipline
        : undefined;
      const disciplineStillGranted = removedDiscipline
        ? nextTalents.talents.some(
            (talent) =>
              talent.acquisition?.psyRatingNewDiscipline &&
              talent.acquisition.psyRatingDiscipline?.toLocaleLowerCase() ===
                removedDiscipline.toLocaleLowerCase()
          )
        : false;
      const nextPsychic = removedDiscipline && !disciplineStillGranted
        ? {
            ...psychic,
            disciplines: (psychic.disciplines ?? []).filter(
              (discipline) => discipline.toLocaleLowerCase() !== removedDiscipline.toLocaleLowerCase()
            ),
          }
        : psychic;
      const grantedCyberneticIds = new Set(
        cybernetics
          .filter((item) => item.grantedByTalentEntryUid === entry.uid)
          .map((item) => item.id)
      );
      let nextCybernetics = cybernetics.filter(
        (item) => item.grantedByTalentEntryUid !== entry.uid
      );
      let nextInsanity = insanity;
      let nextRangedWeapons = grantedCyberneticIds.size > 0
        ? rangedWeapons.map((weapon) =>
            weapon.concealedBionic && grantedCyberneticIds.has(weapon.concealedBionic.cyberneticId)
              ? { ...weapon, concealedBionic: undefined }
              : weapon
          )
        : rangedWeapons;
      let nextMeleeWeapons = grantedCyberneticIds.size > 0
        ? meleeWeapons.map((weapon) =>
            weapon.concealedBionic && grantedCyberneticIds.has(weapon.concealedBionic.cyberneticId)
              ? { ...weapon, concealedBionic: undefined }
              : weapon
          )
        : meleeWeapons;
      let nextArcheotech = archeotech;

      if (restoreOneTimeEffects && entry.talentId === "purity-of-flesh") {
        const removed = entry.acquisition?.purity?.removedCybernetics ?? [];
        const currentIds = new Set(nextCybernetics.map((item) => item.id));
        nextCybernetics = [
          ...nextCybernetics,
          ...removed.filter((item) => !currentIds.has(item.id)),
        ];
        const links = entry.acquisition?.purity?.removedConcealedWeaponLinks ?? [];
        const rangedLinks = new Map(
          links.filter((link) => link.weaponType === "ranged").map((link) => [link.weaponId, link])
        );
        const meleeLinks = new Map(
          links.filter((link) => link.weaponType === "melee").map((link) => [link.weaponId, link])
        );
        const removedRanged = entry.acquisition?.purity?.removedIntegratedRangedWeapons ?? [];
        const currentRangedIds = new Set(nextRangedWeapons.map((weapon) => weapon.id));
        nextRangedWeapons = [
          ...nextRangedWeapons,
          ...removedRanged.filter((weapon) => !currentRangedIds.has(weapon.id)),
        ].map((weapon) => {
          const link = rangedLinks.get(weapon.id);
          return link && !weapon.concealedBionic
            ? { ...weapon, concealedBionic: { cyberneticId: link.cyberneticId, craftsmanship: link.craftsmanship } }
            : weapon;
        });
        const removedMelee = entry.acquisition?.purity?.removedIntegratedMeleeWeapons ?? [];
        const currentMeleeIds = new Set(nextMeleeWeapons.map((weapon) => weapon.id));
        nextMeleeWeapons = [
          ...nextMeleeWeapons,
          ...removedMelee.filter((weapon) => !currentMeleeIds.has(weapon.id)),
        ].map((weapon) => {
          const link = meleeLinks.get(weapon.id);
          return link && !weapon.concealedBionic
            ? { ...weapon, concealedBionic: { cyberneticId: link.cyberneticId, craftsmanship: link.craftsmanship } }
            : weapon;
        });
        const removedArcheotech = entry.acquisition?.purity?.removedArcheotech ?? [];
        const currentArcheotechIds = new Set(nextArcheotech.map((item) => item.id));
        nextArcheotech = [
          ...nextArcheotech,
          ...removedArcheotech.filter((item) => !currentArcheotechIds.has(item.id)),
        ];
      }

      if (restoreOneTimeEffects && entry.talentId === "rite-of-pure-thought") {
        const current = Array.isArray(insanity.disorders) ? insanity.disorders : [];
        const replacementIds = new Set(entry.acquisition?.riteReplacementDisorderIds ?? []);
        nextInsanity = {
          ...insanity,
          disorders: [
            ...current.filter((disorder) => !replacementIds.has(disorder.id)),
            ...(entry.acquisition?.riteOriginalDisorders ?? []),
          ],
        };
      }

      if (onUpdateCharacter) {
        onUpdateCharacter({
          talentsAndTraits: nextTalents,
          ...(nextPsychic !== psychic ? { psychic: nextPsychic } : {}),
          ...(nextCybernetics !== cybernetics ? { cybernetics: nextCybernetics } : {}),
          ...(nextInsanity !== insanity ? { insanity: nextInsanity } : {}),
          ...(nextRangedWeapons !== rangedWeapons ? { rangedWeapons: nextRangedWeapons } : {}),
          ...(nextMeleeWeapons !== meleeWeapons ? { meleeWeapons: nextMeleeWeapons } : {}),
          ...(nextArcheotech !== archeotech ? { archeotech: nextArcheotech } : {}),
        });
      } else {
        onUpdateTalents(nextTalents);
      }
      setPendingEffectDeletion(null);
    },
    [talents, psychic, cybernetics, insanity, rangedWeapons, meleeWeapons, archeotech, onUpdateCharacter, onUpdateTalents]
  );

  const handleRemoveTalent = useCallback(
    (uid: string) => {
      const entry = talents.talents.find((talent) => talent.uid === uid);
      if (!entry) return;
      const hasRestorableEffect =
        (entry.talentId === "purity-of-flesh" && (
          (entry.acquisition?.purity?.removedCybernetics?.length ?? 0) > 0 ||
          (entry.acquisition?.purity?.removedIntegratedRangedWeapons?.length ?? 0) > 0 ||
          (entry.acquisition?.purity?.removedIntegratedMeleeWeapons?.length ?? 0) > 0 ||
          (entry.acquisition?.purity?.removedArcheotech?.length ?? 0) > 0
        )) ||
        (entry.talentId === "rite-of-pure-thought" && (entry.acquisition?.riteOriginalDisorders?.length ?? 0) > 0);
      if (hasRestorableEffect) {
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
                  pickerSuspended={pendingAcquisition !== null}
                  career={career}
                  rank={rank}
                />
              ) : (
                <FaithTalentSection
                  entries={faithEntries}
                  editable={editable}
                  isDM={isDM}
                  onAdd={handleAddTalent}
                  onRemove={handleRemoveTalent}
                  pickerSuspended={pendingAcquisition !== null}
                  career={career}
                  rank={rank}
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
            pickerSuspended={pendingAcquisition !== null}
            career={career}
            rank={rank}
          />
        )}
      </div>

      <div className={`hidden lg:grid lg:gap-6 lg:items-start ${showFaith ? "lg:grid-cols-2" : "lg:grid-cols-1"}`}>
        <RegularTalentSection
          entries={regularEntries}
          psychic={psychic}
          editable={editable}
          isDM={isDM}
          onAdd={handleAddTalent}
          onRemove={handleRemoveTalent}
          columns={showFaith ? 1 : 2}
          pickerSuspended={pendingAcquisition !== null}
          career={career}
          rank={rank}
        />
        {showFaith && (
          <FaithTalentSection
            entries={faithEntries}
            editable={editable}
            isDM={isDM}
            onAdd={handleAddTalent}
            onRemove={handleRemoveTalent}
            pickerSuspended={pendingAcquisition !== null}
            career={career}
            rank={rank}
          />
        )}
      </div>

      {pendingAcquisition && (
        <TalentAcquisitionModal
          entry={pendingAcquisition}
          talents={talents}
          career={career}
          currentHomeworldId={talents.homeworld}
          cybernetics={cybernetics}
          rangedWeapons={rangedWeapons}
          meleeWeapons={meleeWeapons}
          archeotech={archeotech}
          insanity={insanity}
          willpowerBonus={willpowerBonus}
          knownDisciplines={psychic.disciplines ?? []}
          weaponTraining={weaponTraining}
          onComplete={handleAcquisitionComplete}
          onClose={() => setPendingAcquisition(null)}
        />
      )}

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
              This Talent recorded a one-time change. Choose whether deleting the Talent should also restore what that acquisition changed.
            </p>
            <div className="space-y-2">
              <Button fullWidth onClick={() => applyTalentRemoval(pendingEffectDeletion, true)}>
                Delete and restore recorded changes
              </Button>
              <Button fullWidth variant="ghost" onClick={() => applyTalentRemoval(pendingEffectDeletion, false)}>
                Delete Talent only
              </Button>
              <Button fullWidth variant="ghost" onClick={() => setPendingEffectDeletion(null)}>
                Cancel
              </Button>
            </div>
          </PickerBody>
        </PickerModal>
      )}
    </div>
  );
}
