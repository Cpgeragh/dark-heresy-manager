import { useCallback, useState } from "react";
import type {
  CharacterHeader,
  CyberneticItem,
  GearItem,
  TalentsAndTraitsBlock,
} from "../../../types/Character";
import { HOMEWORLD_LIST } from "../../../data/reference/homeworldData";
import { findCareerByName, type CareerData } from "../../../data/reference/careerData";
import { SANCTIONING_RESULTS } from "../../../mechanics/traits/sanctioningReference";
import { TRAIT_LIST } from "../../../data/reference/traitData";
import { applyTechPriestImplants, careerNeedsStartingChoice } from "../../../mechanics/career/careerStartingBenefits";
import { Chip } from "../../../ui/chips/Chip";
import { colourMeta, colourRank } from "../../../ui/styles/colourTokens";
import { RollChip } from "../../../ui/chips/RollChip";
import { sourceColour } from "../../../ui/styles/sourceStyles";
import { InfoModal } from "../../../components/InfoModal";
import { uiInfoModalWrapper, uiItemName } from "../../../ui/styles/editableStyles";
import { BackgroundPickerField } from "./BackgroundPickerField";
import { CareerInfoContent, CareerPicker, RankInfoContent } from "../CareerPicker";
import { HomeworldInfoContent, HomeworldPicker } from "../HomeworldPicker";
import { TraitAcquisitionModal } from "../../../mechanics/traits/TraitAcquisitionModal";
import { homeworldNeedsTraitAcquisition } from "../../../mechanics/traits/traitEffects";
import { CareerStartingChoiceModal } from "../CareerStartingChoiceModal";
import { HomeworldTraitAcquisitionModal } from "../HomeworldTraitAcquisitionModal";

export interface BackgroundSetupFieldsProps {
  header: CharacterHeader;
  talents: TalentsAndTraitsBlock;
  editable: boolean;
  onUpdateHeader: (next: CharacterHeader) => void;
  onUpdateTalents: (next: TalentsAndTraitsBlock) => void;
  cybernetics?: CyberneticItem[];
  onUpdateCybernetics?: (next: CyberneticItem[]) => void | Promise<void>;
  gear?: GearItem[];
  onUpdateGear?: (next: GearItem[]) => void | Promise<void>;
}

export function BackgroundSetupFields({
  header,
  talents,
  editable,
  onUpdateHeader,
  onUpdateTalents,
  cybernetics = [],
  onUpdateCybernetics,
  gear = [],
  onUpdateGear,
}: BackgroundSetupFieldsProps) {
  const [showHomeworldPicker, setShowHomeworldPicker] = useState(false);
  const [showCareerPicker, setShowCareerPicker] = useState(false);
  const [pendingHomeworldId, setPendingHomeworldId] = useState<string | null>(null);
  const [pendingCareer, setPendingCareer] = useState<CareerData | null>(null);
  const [pendingStartingChoiceCareer, setPendingStartingChoiceCareer] = useState<CareerData | null>(null);

  const selectedHomeworld = HOMEWORLD_LIST.find((homeworld) => homeworld.id === talents.homeworld);
  const selectedCareer = findCareerByName(header.career);
  const selectedRank = selectedCareer?.ranks.find(
    (rank) => rank.name.toLowerCase() === header.rank?.toLowerCase()
  );

  const headerForCareer = useCallback(
    (career: CareerData): CharacterHeader => {
      const sameCareer = header.career?.toLowerCase() === career.name.toLowerCase();
      const currentRankBelongsToCareer = career.ranks.some(
        (rank) => rank.name.toLowerCase() === header.rank?.toLowerCase()
      );
      return {
        ...header,
        career: career.name,
        rank:
          sameCareer && currentRankBelongsToCareer
            ? header.rank
            : career.startingRank,
        careerPath: sameCareer ? header.careerPath : undefined,
      };
    },
    [header]
  );

  const handleHomeworldSelect = useCallback(
    (value: string) => {
      if (homeworldNeedsTraitAcquisition(value)) {
        setShowHomeworldPicker(false);
        setPendingHomeworldId(value);
        return;
      }
      const homeworld = HOMEWORLD_LIST.find((entry) => entry.id === value);
      const currentCareerIsAllowed =
        !header.career ||
        homeworld?.careers.some(
          (career) => (career.careerName ?? career.name) === header.career
        );

      onUpdateTalents({
        ...talents,
        homeworld: value,
        homeworldTraitChoices: undefined,
        ...(currentCareerIsAllowed ? {} : { careerTraitAcquisition: undefined }),
      });
      if (!currentCareerIsAllowed) {
        onUpdateHeader({ ...header, career: "", rank: "", careerPath: undefined });
        if (onUpdateCybernetics) {
          void onUpdateCybernetics(cybernetics.filter(
            (item) => item.grantedByTalentEntryUid !== "career:imperial-psyker:sanctioned-psyker"
          ));
        }
      }
      setShowHomeworldPicker(false);
    },
    [cybernetics, header, onUpdateCybernetics, talents, onUpdateHeader, onUpdateTalents]
  );

  const handleCareerSelect = useCallback(
    (career: CareerData) => {
      if (career.name === "Imperial Psyker") {
        setShowCareerPicker(false);
        setPendingCareer(career);
        return;
      }
      if (careerNeedsStartingChoice(career.name)) {
        setShowCareerPicker(false);
        setPendingStartingChoiceCareer(career);
        return;
      }
      onUpdateHeader(headerForCareer(career));
      onUpdateTalents({
        ...talents,
        careerTraitAcquisition: undefined,
        careerStartingChoices: undefined,
      });
      if (onUpdateCybernetics) {
        void onUpdateCybernetics(
          applyTechPriestImplants(
            cybernetics.filter(
              (item) => item.grantedByTalentEntryUid !== "career:imperial-psyker:sanctioned-psyker"
            ),
            career.name
          )
        );
      }
      setShowCareerPicker(false);
    },
    [cybernetics, headerForCareer, onUpdateCybernetics, onUpdateHeader, onUpdateTalents, talents]
  );

  const sanctioning = talents.careerTraitAcquisition?.sanctioning;
  const sanctioningRef = sanctioning
    ? SANCTIONING_RESULTS.find((result) => result.id === sanctioning.resultId)
    : undefined;

  return (
    <>
      <div className="space-y-4">
        <BackgroundPickerField
          label="Homeworld"
          selected={!!selectedHomeworld}
          value={
            selectedHomeworld && (
              <div className="flex min-w-0 flex-col gap-1.5">
                <span className={`${uiItemName} truncate`}>{selectedHomeworld.name}</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <RollChip>{selectedHomeworld.roll}</RollChip>
                  <Chip className={`bg-slate-800/40 font-code ${sourceColour(selectedHomeworld.source)}`}>
                    {selectedHomeworld.source}
                  </Chip>
                </div>
              </div>
            )
          }
          emptyText="— Select homeworld —"
          showAction={editable}
          disabled={!editable}
          onClick={() => setShowHomeworldPicker(true)}
          info={
            selectedHomeworld && (
              <span className={uiInfoModalWrapper}>
                <InfoModal
                  title={selectedHomeworld.name}
                  content={<HomeworldInfoContent homeworld={selectedHomeworld} />}
                />
              </span>
            )
          }
        />

        <div className="border-t border-slate-700/70" />

        <BackgroundPickerField
          label="Career"
          selected={!!header.career}
          value={
            selectedCareer && (
              <div className="flex min-w-0 flex-col gap-1.5">
                <span className={`${uiItemName} truncate`}>{selectedCareer.name}</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Chip className={`bg-slate-800/40 font-code ${sourceColour(selectedCareer.source)}`}>
                    {selectedCareer.source}
                  </Chip>
                </div>
              </div>
            )
          }
          emptyText={selectedHomeworld ? "— Select career —" : "Select a homeworld first"}
          showAction={editable}
          disabled={!editable || !selectedHomeworld}
          onClick={() => setShowCareerPicker(true)}
          info={
            selectedCareer && (
              <span className={uiInfoModalWrapper}>
                <InfoModal
                  title={selectedCareer.name}
                  content={<CareerInfoContent career={selectedCareer} homeworld={selectedHomeworld} />}
                />
              </span>
            )
          }
        />

        {sanctioning && selectedCareer && (
          <BackgroundPickerField
            label="Sanctioning Effect"
            selected
            value={
              <div className="flex min-w-0 flex-col gap-1.5">
                <span className={`${uiItemName} truncate`}>{sanctioning.resultName}</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {sanctioningRef && <RollChip>{sanctioningRef.roll}</RollChip>}
                  <Chip className={`bg-slate-800/40 font-code ${sourceColour(selectedCareer.source)}`}>
                    {selectedCareer.source}
                  </Chip>
                </div>
              </div>
            }
            emptyText=""
            showAction={false}
            disabled={false}
            onClick={() => {}}
            info={
              sanctioningRef?.effect && (
                <span className={uiInfoModalWrapper}>
                  <InfoModal title={sanctioning.resultName} content={sanctioningRef.effect} />
                </span>
              )
            }
          />
        )}

        <BackgroundPickerField
          label="Rank"
          selected={!!header.rank}
          value={
            selectedCareer &&
            selectedRank && (
              <div className="flex min-w-0 flex-col gap-1.5">
                <span className={`${uiItemName} truncate`}>{selectedRank.name}</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Chip className={colourRank}>Rank {selectedRank.tier}</Chip>
                  <Chip className={colourMeta}>{selectedRank.xpLevel} XP</Chip>
                  {selectedRank.paths?.length && (
                    <Chip className={colourMeta}>
                      {selectedRank.paths.length > 1 ? "Paths" : "Path"}: {selectedRank.paths.join(" / ")}
                    </Chip>
                  )}
                  <Chip className={`bg-slate-800/40 font-code ${sourceColour(selectedCareer.source)}`}>
                    {selectedCareer.source}
                  </Chip>
                </div>
              </div>
            )
          }
          emptyText={selectedCareer ? "Assigned by Career progression" : "Select a career first"}
          showAction={false}
          disabled
          onClick={() => {}}
          info={
            selectedCareer &&
            selectedRank && (
              <span className={uiInfoModalWrapper}>
                <InfoModal
                  title={selectedRank.name}
                  content={<RankInfoContent career={selectedCareer} rank={selectedRank} />}
                />
              </span>
            )
          }
        />
      </div>

      {showHomeworldPicker && (
        <HomeworldPicker
          selected={talents.homeworld}
          onSelect={(homeworld) => handleHomeworldSelect(homeworld.id)}
          onClose={() => setShowHomeworldPicker(false)}
        />
      )}

      {showCareerPicker && selectedHomeworld && (
        <CareerPicker
          selected={header.career}
          homeworld={selectedHomeworld}
          onSelect={handleCareerSelect}
          onClose={() => setShowCareerPicker(false)}
        />
      )}

      {pendingHomeworldId && (
        <HomeworldTraitAcquisitionModal
          homeworldId={pendingHomeworldId}
          onComplete={(choices) => {
            const homeworld = HOMEWORLD_LIST.find((entry) => entry.id === pendingHomeworldId);
            const currentCareerIsAllowed =
              !header.career ||
              homeworld?.careers.some(
                (career) => (career.careerName ?? career.name) === header.career
              );
            onUpdateTalents({
              ...talents,
              homeworld: pendingHomeworldId,
              homeworldTraitChoices: choices,
              ...(currentCareerIsAllowed ? {} : { careerTraitAcquisition: undefined }),
            });
            if (!currentCareerIsAllowed) {
              onUpdateHeader({ ...header, career: "", rank: "", careerPath: undefined });
              if (onUpdateCybernetics) {
                void onUpdateCybernetics(cybernetics.filter(
                  (item) => item.grantedByTalentEntryUid !== "career:imperial-psyker:sanctioned-psyker"
                ));
              }
            }
            setPendingHomeworldId(null);
          }}
          onClose={() => {
            setPendingHomeworldId(null);
            setShowHomeworldPicker(true);
          }}
        />
      )}

      {pendingCareer && (() => {
        const trait = TRAIT_LIST.find((item) => item.id === "sanctioned-psyker");
        if (!trait) return null;
        return (
          <TraitAcquisitionModal
            trait={trait}
            entry={{
              uid: "career:imperial-psyker:sanctioned-psyker",
              talentId: trait.id,
              name: trait.name,
            }}
            cybernetics={cybernetics}
            gear={gear}
            onComplete={(result) => {
              onUpdateHeader(headerForCareer(pendingCareer));
              onUpdateTalents({
                ...talents,
                careerTraitAcquisition: result.entry.acquisition?.trait,
                careerStartingChoices: undefined,
              });
              if (onUpdateCybernetics) {
                void onUpdateCybernetics(
                  applyTechPriestImplants(result.cybernetics ?? cybernetics, pendingCareer.name)
                );
              }
              if (result.gear && onUpdateGear) {
                void onUpdateGear(result.gear);
              }
              setPendingCareer(null);
            }}
            onClose={() => {
              setPendingCareer(null);
              setShowCareerPicker(true);
            }}
          />
        );
      })()}

      {pendingStartingChoiceCareer && (
        <CareerStartingChoiceModal
          career={pendingStartingChoiceCareer}
          onComplete={(choices) => {
            onUpdateHeader(headerForCareer(pendingStartingChoiceCareer));
            onUpdateTalents({
              ...talents,
              careerTraitAcquisition: undefined,
              careerStartingChoices: choices,
            });
            if (onUpdateCybernetics) {
              void onUpdateCybernetics(
                applyTechPriestImplants(
                  cybernetics.filter(
                    (item) => item.grantedByTalentEntryUid !== "career:imperial-psyker:sanctioned-psyker"
                  ),
                  pendingStartingChoiceCareer.name
                )
              );
            }
            setPendingStartingChoiceCareer(null);
          }}
          onClose={() => {
            setPendingStartingChoiceCareer(null);
            setShowCareerPicker(true);
          }}
        />
      )}
    </>
  );
}
