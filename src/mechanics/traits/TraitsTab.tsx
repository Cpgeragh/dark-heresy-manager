// src/mechanics/traits/TraitsTab.tsx

import { useCallback, useMemo, useState } from "react";
import type {
  AlternateRankSelection,
  Character,
  CyberneticItem,
  GearItem,
  TalentsAndTraitsBlock,
  TalentEntry,
} from "../../types/Character";
import { TRAIT_LIST } from "../../data/reference/traitData";
import { EntryCard } from "../talents/TalentEntryCards";
import { TalentPickerModal } from "../talents/TalentPickerModal";
import { getActiveTraitEntries } from "./traitEffects";
import { AddButton } from "../../ui/buttons/AddButton";
import { ViewButton } from "../../ui/buttons/ViewButton";
import { SectionHeader } from "../../ui/SectionHeader";
import { AccordionCard } from "../../ui/AccordionCard";
import {
  uiSection,
  uiTextPlaceholder,
  uiStackList,
  uiStackPage,
} from "../../ui/styles/editableStyles";
import { TraitAcquisitionModal } from "./TraitAcquisitionModal";
import { CustomTraitForm } from "./CustomTraitForm";
import { useCampaignCustomItems } from "../../hooks/useCampaignCustomItems";
import { useCustomItemLibraryActions } from "../../hooks/useCustomItemLibraryActions";
import { createDraftCustomItem, saveDraftCustomItem } from "../../services/customItemService";
import { useToast } from "../../components/Toast";
import type { CampaignCustomItem, CustomTraitData } from "../../types/CustomItems";
import { recordComponentRender } from "../../performance/performanceMetrics";

interface TraitsTabProps {
  talents: TalentsAndTraitsBlock;
  career?: string;
  rank?: string;
  alternateRanks?: readonly AlternateRankSelection[];
  cybernetics?: CyberneticItem[];
  gear?: GearItem[];
  editable: boolean;
  onUpdateTalents: (next: TalentsAndTraitsBlock) => void;
  onUpdateCybernetics?: (next: CyberneticItem[]) => void | Promise<boolean | void>;
  onUpdateGear?: (next: GearItem[]) => void | Promise<boolean | void>;
  /** Saves several character fields in one step, so a Trait change that touches talents, cybernetics and gear is accepted or refused as a whole. */
  onUpdateCharacter?: (partial: Partial<Character>) => Promise<boolean>;
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
        removalNoun="Trait"
        displayName={group[0].name}
        statusChip={`Owned: ${group.length}`}
      />
    );
  };

  if (groups.length === 1) return renderCharacteristic(groups[0]);

  return (
    <AccordionCard
      name="Unnatural Characteristic"
      label="Unnatural Characteristic"
      expanded={expanded}
      onToggle={() => setExpanded((value) => !value)}
    >
      <div className={uiStackList}>{groups.map(renderCharacteristic)}</div>
    </AccordionCard>
  );
}

export function TraitsTab({
  talents,
  career,
  rank,
  alternateRanks,
  cybernetics = [],
  gear = [],
  editable,
  onUpdateTalents,
  onUpdateCybernetics,
  onUpdateGear,
  onUpdateCharacter,
  campaignId,
  characterId,
  userId,
  characterName,
  isDM = false,
}: TraitsTabProps) {
  recordComponentRender("TraitsTab");
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
    enabled: showPicker || talents.traits.some((entry) => !!entry.customLibraryId),
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

  const saveCharacter = useCallback(
    async (partial: Partial<Character>): Promise<boolean> => {
      if (onUpdateCharacter) return onUpdateCharacter(partial);
      if (partial.talentsAndTraits) onUpdateTalents(partial.talentsAndTraits);
      if (partial.cybernetics) void onUpdateCybernetics?.(partial.cybernetics);
      if (partial.gear) void onUpdateGear?.(partial.gear);
      return true;
    },
    [onUpdateCharacter, onUpdateTalents, onUpdateCybernetics, onUpdateGear]
  );

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
      const saved = await saveCharacter({
        talentsAndTraits: {
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
        },
      });
      if (saved === false) return;
      setCustomTraitOpen(false);
      toast.success("Custom trait saved as a campaign draft.");
    },
    [userId, campaignId, characterId, characterName, talents, saveCharacter, toast]
  );

  const fromCustomLibrary = useCallback(
    async (item: CampaignCustomItem<"trait">) => {
      const versionId =
        item.status === "published"
          ? item.publishedVersionId
          : (item.draftVersionId ?? item.latestVersionId);
      if (!versionId) {
        toast.error("This custom trait has no usable version.");
        return;
      }
      const saved = await saveCharacter({
        talentsAndTraits: {
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
        },
      });
      if (saved !== false) setShowPicker(false);
    },
    [talents, saveCharacter, toast]
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
        const saved = await saveCharacter({
          talentsAndTraits: {
            ...talents,
            traits: talents.traits.map((entry) =>
              entry.uid === editingCustomTrait.uid
                ? { ...entry, ...data, customLibraryVersionId: versionId }
                : entry
            ),
          },
        });
        if (saved === false) return;
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
      saveCharacter,
      toast,
    ]
  );

  const displayTraits = useMemo(
    () => getActiveTraitEntries(talents, career, alternateRanks),
    [alternateRanks, career, talents]
  );
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
      return saveCharacter({
        talentsAndTraits: { ...talents, traits: [...talents.traits, entry] },
      });
    },
    [talents, saveCharacter]
  );

  const handleRemoveTrait = useCallback(
    (uid: string) => {
      const removed = talents.traits.find((entry) => entry.uid === uid);
      const partial: Partial<Character> = {
        talentsAndTraits: {
          ...talents,
          traits: talents.traits.filter((trait) => trait.uid !== uid),
        },
      };
      if (onUpdateCharacter || onUpdateCybernetics) {
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
          partial.cybernetics = nextCybernetics;
        }
      }
      return saveCharacter(partial);
    },
    [cybernetics, onUpdateCharacter, onUpdateCybernetics, talents, saveCharacter]
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
            removalNoun="Trait"
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
                removalNoun="Trait"
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
    <div className={uiStackPage}>
      <div>
        <div className="mb-3 flex items-center justify-between">
          <SectionHeader>Traits</SectionHeader>
          {editable ? (
            <AddButton label="Add Trait" onClick={() => setShowPicker(true)} />
          ) : (
            <ViewButton label="View Traits" onClick={() => setShowPicker(true)} />
          )}
        </div>
        <section className={`${uiSection} ${uiStackList}`}>
          {displayTraits.length === 0 && (
            <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>None added yet.</p>
          )}
          <div
            className="grid grid-cols-1 items-start gap-2 lg:grid-cols-2"
            data-testid="trait-card-list"
          >
            {cardColumns.map((column, index) => (
              <div key={index} className={uiStackList} data-testid="trait-card-column">
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
              alternateRanks={alternateRanks}
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
              customActionLabel="Add Custom Trait"
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
                  onComplete={async (result) => {
                    const saved = await saveCharacter({
                      talentsAndTraits: {
                        ...talents,
                        traits: [...talents.traits, result.entry],
                      },
                      ...(result.cybernetics ? { cybernetics: result.cybernetics } : {}),
                      ...(result.gear ? { gear: result.gear } : {}),
                    });
                    if (saved !== false) setPendingAcquisition(null);
                    return saved;
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
