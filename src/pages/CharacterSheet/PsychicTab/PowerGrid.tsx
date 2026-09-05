import type { PsychicPower, TalentsAndTraitsBlock } from "../../../types/Character";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import type { CustomItemLibraryAction } from "../../../types/CustomItemActions";
import { PowerCard } from "./PowerCard";

export function PowerGrid({
  powers,
  talents,
  editable,
  isDM,
  userId,
  campaignCustomPowersById,
  getBusyAction,
  onRemove,
  onEdit,
  onPublishPower,
  onArchivePower,
  onUpdateAllPowerCopies,
  canLinkPurchase,
  onLinkPurchase,
  canLinkPsyRatingGrant,
  onLinkPsyRatingGrant,
}: {
  powers: PsychicPower[];
  talents: TalentsAndTraitsBlock;
  editable: boolean;
  isDM: boolean;
  userId: string | null;
  campaignCustomPowersById: Map<string, CampaignCustomItem<"power">>;
  getBusyAction: (itemId: string) => CustomItemLibraryAction | null;
  onRemove: (id: string) => void;
  onEdit: (power: PsychicPower) => void;
  onPublishPower: (item: CampaignCustomItem<"power">) => void;
  onArchivePower: (item: CampaignCustomItem<"power">) => void;
  onUpdateAllPowerCopies: (item: CampaignCustomItem<"power">) => void;
  canLinkPurchase: boolean;
  onLinkPurchase: (power: PsychicPower) => void;
  canLinkPsyRatingGrant: (power: PsychicPower) => boolean;
  onLinkPsyRatingGrant: (power: PsychicPower) => void;
}) {
  const sortedPowers = [...powers].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-3">
      {sortedPowers.map((power) => {
        const linkedTalentUid = power.talentEntryUid ?? power.psyRatingTalentEntryUid;
        const talentSourceName = linkedTalentUid
          ? talents.talents.find((entry) => entry.uid === linkedTalentUid)?.name
          : undefined;
        const libraryItem = power.customLibraryId
          ? campaignCustomPowersById.get(power.customLibraryId)
          : undefined;
        const canEditDefinition =
          !!libraryItem &&
          editable &&
          (isDM || (!!userId && libraryItem.creator.userId === userId));
        const busyAction = libraryItem ? getBusyAction(libraryItem.id) : null;

        return (
          <PowerCard
            key={power.id}
            power={power}
            talentSourceName={talentSourceName}
            editable={editable}
            onRemove={onRemove}
            libraryItem={libraryItem}
            isDM={isDM && editable}
            canEditDefinition={canEditDefinition}
            busyAction={busyAction}
            onEditDefinition={() => onEdit(power)}
            onPublish={() => libraryItem && onPublishPower(libraryItem)}
            onArchive={() => libraryItem && onArchivePower(libraryItem)}
            onUpdateAllCopies={() => libraryItem && onUpdateAllPowerCopies(libraryItem)}
            onLinkPurchase={
              canLinkPurchase && !power.talentEntryUid && !power.psyRatingTalentEntryUid
                ? () => onLinkPurchase(power)
                : undefined
            }
            onLinkPsyRatingGrant={
              canLinkPsyRatingGrant(power) &&
              !power.talentEntryUid &&
              !power.psyRatingTalentEntryUid
                ? () => onLinkPsyRatingGrant(power)
                : undefined
            }
          />
        );
      })}
    </div>
  );
}
