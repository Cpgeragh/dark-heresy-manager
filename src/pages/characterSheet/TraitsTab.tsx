// src/pages/characterSheet/TraitsTab.tsx

import { useCallback, useMemo, useState } from "react";
import type {
  CyberneticItem,
  GearItem,
  TalentsAndTraitsBlock,
  TalentEntry,
} from "../../types/Character";
import { TRAIT_LIST } from "../../data/traitData";
import { EntryCard, TalentPickerModal } from "./talentComponents";
import { getActiveTraitEntries } from "../../features/traits/traitEffects";
import { AddButton } from "../../ui/AddButton";
import { ViewButton } from "../../ui/ViewButton";
import { SectionHeader } from "../../ui/SectionHeader";
import { ExpandChevron } from "../../ui/ExpandChevron";
import { uiItemName, uiSection, uiSectionShell, uiTextPlaceholder } from "../../ui/editableStyles";
import { TraitAcquisitionModal } from "./TraitAcquisitionModal";
import { CustomTraitForm } from "./CustomTraitForm";
import { useCampaignCustomItems } from "../../hooks/useCampaignCustomItems";
import { useCustomItemLibraryActions } from "../../hooks/useCustomItemLibraryActions";
import { createDraftCustomItem, saveDraftCustomItem } from "../../services/customItemService";
import { useToast } from "../../components/Toast";
import type { CampaignCustomItem, CustomTraitData } from "../../types/CustomItems";

interface TraitsTabProps {
  talents: TalentsAndTraitsBlock;
  career?: string;
  rank?: string;
  cybernetics?: CyberneticItem[];
  gear?: GearItem[];
  editable: boolean;
  onUpdateTalents: (next: TalentsAndTraitsBlock) => void;
  onUpdateCybernetics?: (next: CyberneticItem[]) => void | Promise<void>;
  onUpdateGear?: (next: GearItem[]) => void | Promise<void>;
  campaignId?: string;
  characterId?: string;
  userId?: string | null;
  characterName?: string;
  isDM?: boolean;
}

function buildTraitSnapshot(
  uid: string,
  talentId: string,
  data: CustomTraitData,
  customLibraryId: string,
  customLibraryVersionId: string
): TalentEntry {
  return { uid, talentId, ...data, customLibraryId, customLibraryVersionId };
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
  rank,
  cybernetics = [],
  gear = [],
  editable,
  onUpdateTalents,
  onUpdateCybernetics,
  onUpdateGear,
  campaignId,
  characterId,
  userId,
  characterName,
  isDM = false,
}: TraitsTabProps) {
  const toast = useToast();
  const [showPicker, setShowPicker] = useState(false);
  const [customTraitOpen, setCustomTraitOpen] = useState(false);
  const [editingCustomTrait, setEditingCustomTrait] = useState<TalentEntry | null>(null);
  const [pendingAcquisition, setPendingAcquisition] = useState<TalentEntry | null>(null);
  const { items: campaignCustomTraits } = useCampaignCustomItems({
    campaignId,
    category: "trait",
    mode: "picker",
    userId,
  }) as { items: CampaignCustomItem<"trait">[] };
  const campaignCustomTraitsById = useMemo(
    () => new Map(campaignCustomTraits.map((item) => [item.id, item])),
    [campaignCustomTraits]
  );
  const { publishDefinition, archiveDefinition, updateAllCopies, getBusyAction } =
    useCustomItemLibraryActions<"trait">({
      campaignId: campaignId ?? "",
      userId,
      itemLabel: "trait",
    });

  const addCustomTrait = useCallback(
    async (data: CustomTraitData) => {
      if (!userId || !campaignId) {
        toast.error("You must be signed in to create campaign custom traits.");
        return;
      }
      const { customItemId, versionId } = await createDraftCustomItem({
        campaignId,
        category: "trait",
        creator: { userId, characterId, characterName },
        data,
      });
      onUpdateTalents({
        ...talents,
        traits: [
          ...talents.traits,
          buildTraitSnapshot(
            crypto.randomUUID(),
            `custom-trait:${customItemId}`,
            data,
            customItemId,
            versionId
          ),
        ],
      });
      setCustomTraitOpen(false);
      toast.success("Custom trait saved as a campaign draft.");
    },
    [userId, campaignId, characterId, characterName, talents, onUpdateTalents, toast]
  );

  const fromCustomLibrary = useCallback(
    (item: CampaignCustomItem<"trait">) => {
      const versionId =
        item.status === "published"
          ? item.publishedVersionId
          : (item.draftVersionId ?? item.latestVersionId);
      if (!versionId) {
        toast.error("This custom trait has no usable version.");
        return;
      }
      onUpdateTalents({
        ...talents,
        traits: [
          ...talents.traits,
          buildTraitSnapshot(
            crypto.randomUUID(),
            `custom-trait:${item.id}`,
            item.data,
            item.id,
            versionId
          ),
        ],
      });
      setShowPicker(false);
    },
    [talents, onUpdateTalents, toast]
  );

  const updateCustomTrait = useCallback(
    async (data: CustomTraitData) => {
      if (!userId || !campaignId || !editingCustomTrait?.customLibraryId) return;
      try {
        const versionId = await saveDraftCustomItem({
          campaignId,
          customItemId: editingCustomTrait.customLibraryId,
          category: "trait",
          editor: { userId, characterId, characterName },
          data,
        });
        onUpdateTalents({
          ...talents,
          traits: talents.traits.map((entry) =>
            entry.uid === editingCustomTrait.uid
              ? { ...entry, ...data, customLibraryVersionId: versionId }
              : entry
          ),
        });
        setEditingCustomTrait(null);
        toast.success("Custom trait draft updated.");
      } catch (err) {
        console.error("Failed to update custom trait definition:", err);
        toast.error("Failed to update custom trait definition.");
      }
    },
    [
      userId,
      campaignId,
      characterId,
      characterName,
      editingCustomTrait,
      talents,
      onUpdateTalents,
      toast,
    ]
  );

  const displayTraits = useMemo(() => getActiveTraitEntries(talents, career), [talents, career]);
  const unnaturalEntries = displayTraits.filter(
    (entry) => entry.talentId === "unnatural-characteristic"
  );
  const skinOfIronEntries = displayTraits.filter((entry) => entry.talentId === "skin-of-iron");
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
        let nextCybernetics = cybernetics.filter((item) => item.grantedByTalentEntryUid !== uid);
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
    ...ordinaryEntries.map((entry) => {
      const libraryItem = entry.customLibraryId
        ? campaignCustomTraitsById.get(entry.customLibraryId)
        : undefined;
      const canEditDefinition =
        !!libraryItem && editable && (isDM || (!!userId && libraryItem.creator.userId === userId));
      const busyAction = libraryItem ? getBusyAction(libraryItem.id) : null;
      return {
        key: entry.uid,
        sortName: entry.name,
        node: (
          <EntryCard
            entry={entry}
            editable={editable}
            onRemove={handleRemoveTrait}
            confirmDeletion
            deletionNoun="Trait"
            libraryItem={libraryItem}
            isDM={isDM && editable}
            canEditDefinition={canEditDefinition}
            busyAction={busyAction}
            onEditDefinition={() => setEditingCustomTrait(entry)}
            onPublish={() => libraryItem && publishDefinition(libraryItem)}
            onArchive={() => libraryItem && archiveDefinition(libraryItem)}
            onUpdateAllCopies={() => libraryItem && updateAllCopies(libraryItem)}
          />
        ),
      };
    }),
    ...(unnaturalEntries.length > 0
      ? [
          {
            key: "unnatural-characteristic-group",
            sortName: "Unnatural Characteristic",
            node: (
              <UnnaturalCharacteristicCards
                entries={unnaturalEntries}
                editable={editable}
                onRemove={handleRemoveTrait}
              />
            ),
          },
        ]
      : []),
    ...(skinOfIronEntries.length > 0
      ? [
          {
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
          },
        ]
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
                {column.map((card) => (
                  <div key={card.key}>{card.node}</div>
                ))}
              </div>
            ))}
          </div>
          {showPicker && (
            <TalentPickerModal
              title={editable ? "Add Trait" : "View Traits"}
              listData={TRAIT_LIST}
              entries={displayTraits}
              career={career}
              rank={rank}
              editable={editable}
              isDM={isDM}
              onAdd={handleAddTrait}
              onClose={() => setShowPicker(false)}
              suspended={!!pendingAcquisition}
              customItems={campaignCustomTraits}
              onSelectCustomItem={fromCustomLibrary}
              onCustomAction={
                editable
                  ? () => {
                      setShowPicker(false);
                      setCustomTraitOpen(true);
                    }
                  : undefined
              }
              customActionLabel="Custom Trait"
            />
          )}
          {customTraitOpen && (
            <CustomTraitForm onAdd={addCustomTrait} onCancel={() => setCustomTraitOpen(false)} />
          )}
          {editingCustomTrait && (
            <CustomTraitForm
              title="Edit Custom Trait"
              submitLabel="Save"
              initialTrait={
                editingCustomTrait.customLibraryId
                  ? campaignCustomTraitsById.get(editingCustomTrait.customLibraryId)?.data
                  : undefined
              }
              onAdd={updateCustomTrait}
              onCancel={() => setEditingCustomTrait(null)}
            />
          )}
          {pendingAcquisition &&
            (() => {
              const trait = TRAIT_LIST.find((item) => item.id === pendingAcquisition.talentId);
              if (!trait?.acquisition) return null;
              return (
                <TraitAcquisitionModal
                  trait={trait}
                  entry={pendingAcquisition}
                  cybernetics={cybernetics}
                  gear={gear}
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
                    if (result.gear && onUpdateGear) {
                      void onUpdateGear(result.gear);
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
