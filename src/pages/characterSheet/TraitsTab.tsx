// src/pages/characterSheet/TraitsTab.tsx

import { useCallback, useMemo, useState } from "react";
import type { CyberneticItem, TalentsAndTraitsBlock, TalentEntry } from "../../types/Character";
import { TRAIT_LIST } from "../../data/traitData";
import { EntryCard, TalentPickerModal } from "./talentComponents";
import { getDerivedTraitEntries } from "../../features/traits/traitEffects";
import { AddButton } from "../../ui/AddButton";
import { ViewButton } from "../../ui/ViewButton";
import { SectionHeader } from "../../ui/SectionHeader";
import { ExpandChevron } from "../../ui/ExpandChevron";
import { uiItemName, uiSection, uiSectionShell, uiTextPlaceholder } from "../../ui/editableStyles";
import { TraitAcquisitionModal } from "./TraitAcquisitionModal";

interface TraitsTabProps {
  talents: TalentsAndTraitsBlock;
  career?: string;
  cybernetics?: CyberneticItem[];
  editable: boolean;
  onUpdateTalents: (next: TalentsAndTraitsBlock) => void;
  onUpdateCybernetics?: (next: CyberneticItem[]) => void | Promise<void>;
}

function UnnaturalCharacteristicCards({
  entries,
  editable,
  onRemove,
}: {
  entries: readonly TalentEntry[];
  editable: boolean;
  onRemove: (uid: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const groups = useMemo(() => {
    const byCharacteristic = new Map<string, TalentEntry[]>();
    for (const entry of entries) {
      const key = (entry.specialisation ?? entry.name).trim().toLocaleLowerCase();
      const group = byCharacteristic.get(key) ?? [];
      group.push(entry);
      byCharacteristic.set(key, group);
    }
    return [...byCharacteristic.values()].sort((a, b) => a[0].name.localeCompare(b[0].name));
  }, [entries]);

  const renderCharacteristic = (group: readonly TalentEntry[]) => {
    const entryToRemove = group[group.length - 1];
    return (
      <EntryCard
        key={group[0].specialisation ?? group[0].uid}
        entry={entryToRemove}
        editable={editable}
        onRemove={onRemove}
        confirmDeletion
        deletionNoun="Trait"
        displayName={group[0].name}
        statusChip={`Owned: ${group.length}`}
      />
    );
  };

  if (groups.length === 1) return renderCharacteristic(groups[0]);

  return (
    <div className={`${uiSectionShell} w-full overflow-hidden`}>
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        aria-label={`${expanded ? "Collapse" : "Expand"} Unnatural Characteristic`}
        className="w-full flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 text-left hover:bg-slate-700/40 transition"
      >
        <span className={`flex-1 min-w-0 truncate ${uiItemName}`}>Unnatural Characteristic</span>
        <ExpandChevron expanded={expanded} />
      </button>
      {expanded && (
        <div className="border-t border-slate-700 space-y-2 p-2">
          {groups.map(renderCharacteristic)}
        </div>
      )}
    </div>
  );
}

export function TraitsTab({
  talents,
  career,
  cybernetics = [],
  editable,
  onUpdateTalents,
  onUpdateCybernetics,
}: TraitsTabProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [pendingAcquisition, setPendingAcquisition] = useState<TalentEntry | null>(null);
  const displayTraits = useMemo(
    () => [...talents.traits, ...getDerivedTraitEntries(talents, career)],
    [career, talents]
  );
  const unnaturalEntries = displayTraits.filter(
    (entry) => entry.talentId === "unnatural-characteristic"
  );
  const skinOfIronEntries = displayTraits.filter(
    (entry) => entry.talentId === "skin-of-iron"
  );
  const ordinaryEntries = displayTraits.filter(
    (entry) => !["unnatural-characteristic", "skin-of-iron"].includes(entry.talentId)
  );

  const handleAddTrait = useCallback(
    (entry: TalentEntry) => {
      const trait = TRAIT_LIST.find((item) => item.id === entry.talentId);
      if (trait?.acquisition) {
        setPendingAcquisition(entry);
        return;
      }
      onUpdateTalents({ ...talents, traits: [...talents.traits, entry] });
    },
    [talents, onUpdateTalents]
  );

  const handleRemoveTrait = useCallback(
    (uid: string) => {
      const removed = talents.traits.find((entry) => entry.uid === uid);
      if (onUpdateCybernetics) {
        let nextCybernetics = cybernetics.filter(
          (item) => item.grantedByTalentEntryUid !== uid
        );
        for (const grant of removed?.acquisition?.trait?.skinOfIronGrants ?? []) {
          if (grant.kind === "upgrade" && grant.previousCraftsmanship) {
            nextCybernetics = nextCybernetics.map((item) =>
              item.id === grant.cyberneticId
                ? { ...item, craftsmanship: grant.previousCraftsmanship! }
                : item
            );
          }
        }
        if (JSON.stringify(nextCybernetics) !== JSON.stringify(cybernetics)) {
          void onUpdateCybernetics(nextCybernetics);
        }
      }
      onUpdateTalents({
        ...talents,
        traits: talents.traits.filter((trait) => trait.uid !== uid),
      });
    },
    [cybernetics, onUpdateCybernetics, talents, onUpdateTalents]
  );

  const cards = [
    ...ordinaryEntries.map((entry) => ({
      key: entry.uid,
      sortName: entry.name,
      node: (
        <EntryCard
          entry={entry}
          editable={editable}
          onRemove={handleRemoveTrait}
          confirmDeletion
          deletionNoun="Trait"
        />
      ),
    })),
    ...(unnaturalEntries.length > 0
      ? [{
          key: "unnatural-characteristic-group",
          sortName: "Unnatural Characteristic",
          node: (
            <UnnaturalCharacteristicCards
              entries={unnaturalEntries}
              editable={editable}
              onRemove={handleRemoveTrait}
            />
          ),
        }]
      : []),
    ...(skinOfIronEntries.length > 0
      ? [{
          key: "skin-of-iron-group",
          sortName: "Skin of Iron",
          node: (
            <EntryCard
              entry={skinOfIronEntries[skinOfIronEntries.length - 1]}
              editable={editable}
              onRemove={handleRemoveTrait}
              confirmDeletion
              deletionNoun="Trait"
              displayName="Skin of Iron"
              statusChip={`Owned: ${skinOfIronEntries.length}/4`}
            />
          ),
        }]
      : []),
  ].sort((a, b) => a.sortName.localeCompare(b.sortName));
  const columnSplit = Math.ceil(cards.length / 2);
  const cardColumns = [cards.slice(0, columnSplit), cards.slice(columnSplit)];

  return (
    <div className="space-y-8">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <SectionHeader>Traits</SectionHeader>
          {editable ? (
            <AddButton label="Add Trait" onClick={() => setShowPicker(true)} />
          ) : (
            <ViewButton label="View Traits" onClick={() => setShowPicker(true)} />
          )}
        </div>
        <section className={`${uiSection} space-y-2`}>
          {displayTraits.length === 0 && (
            <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>None added yet.</p>
          )}
          <div
            className="grid grid-cols-1 items-start gap-2 lg:grid-cols-2"
            data-testid="trait-card-list"
          >
            {cardColumns.map((column, index) => (
              <div key={index} className="space-y-2" data-testid="trait-card-column">
                {column.map((card) => <div key={card.key}>{card.node}</div>)}
              </div>
            ))}
          </div>
          {showPicker && (
            <TalentPickerModal
              title={editable ? "Add Trait" : "View Traits"}
              listData={TRAIT_LIST}
              entries={displayTraits}
              editable={editable}
              onAdd={handleAddTrait}
              onClose={() => setShowPicker(false)}
              suspended={!!pendingAcquisition}
            />
          )}
          {pendingAcquisition && (() => {
            const trait = TRAIT_LIST.find((item) => item.id === pendingAcquisition.talentId);
            if (!trait?.acquisition) return null;
            return (
              <TraitAcquisitionModal
                trait={trait}
                entry={pendingAcquisition}
                cybernetics={cybernetics}
                ownedTraitEntries={talents.traits.filter(
                  (entry) => entry.talentId === pendingAcquisition.talentId
                )}
                onComplete={(result) => {
                  onUpdateTalents({
                    ...talents,
                    traits: [...talents.traits, result.entry],
                  });
                  if (result.cybernetics && onUpdateCybernetics) {
                    void onUpdateCybernetics(result.cybernetics);
                  }
                  setPendingAcquisition(null);
                }}
                onClose={() => setPendingAcquisition(null)}
              />
            );
          })()}
        </section>
      </div>
    </div>
  );
}
