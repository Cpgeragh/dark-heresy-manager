// src/pages/characterSheet/BackgroundTab.tsx

import { useCallback, useState } from "react";
import type { ReactNode } from "react";
import type { CharacterHeader, CyberneticItem, TalentsAndTraitsBlock } from "../../types/Character";
import { FormField } from "../../components/FormField";
import { InfoModal } from "../../components/InfoModal";
import {
  uiFormLabel,
  uiInfoModalWrapper,
  uiItemName,
  uiSection,
  uiSectionShell,
  uiTextPlaceholder,
} from "../../ui/editableStyles";
import { SectionHeader } from "../../ui/SectionHeader";
import { HOMEWORLD_LIST } from "../../data/homeworldData";
import { findCareerByName, type CareerData, type CareerRankData } from "../../data/careerData";
import { findDivinationByResult, type DivinationData } from "../../data/divinationData";
import { Button } from "../../ui/Button";
import { Chip } from "../../ui/Chip";
import { colourMeta } from "../../ui/colourTokens";
import { RollChip } from "../../ui/RollChip";
import { sourceColour } from "../../ui/sourceStyles";
import { CareerInfoContent, CareerPicker, RankInfoContent, RankPicker } from "./CareerPicker";
import { DivinationInfoContent, DivinationPicker } from "./DivinationPicker";
import { HomeworldInfoContent, HomeworldPicker } from "./HomeworldPicker";
import { TRAIT_LIST } from "../../data/traitData";
import { TraitAcquisitionModal } from "./TraitAcquisitionModal";
import {
  HomeworldTraitAcquisitionModal,
  homeworldNeedsTraitAcquisition,
} from "./HomeworldTraitAcquisitionModal";

interface BackgroundTabProps {
  header: CharacterHeader;
  talents: TalentsAndTraitsBlock;
  editable: boolean;
  /** Owner's first name, derived from their account profile. Read-only. */
  playerName: string | null;
  onUpdateHeader: (next: CharacterHeader) => void;
  onUpdateTalents: (next: TalentsAndTraitsBlock) => void;
  cybernetics?: CyberneticItem[];
  onUpdateCybernetics?: (next: CyberneticItem[]) => void | Promise<void>;
}

function BackgroundPickerField({
  label,
  selected,
  value,
  emptyText,
  showAction,
  disabled,
  onClick,
  info,
}: {
  label: string;
  selected: boolean;
  value: ReactNode;
  emptyText: string;
  showAction: boolean;
  disabled: boolean;
  onClick: () => void;
  info?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className={uiFormLabel}>{label}</span>
          {info}
        </div>
        {showAction && (
          <Button
            size="xs"
            disabled={disabled}
            onClick={onClick}
            aria-label={`${selected ? "Change" : "Select"} ${label}`}
            className="shrink-0"
          >
            {selected ? "Change" : "Select"}
          </Button>
        )}
      </div>
      <div className={uiSectionShell + " overflow-hidden"}>
        <div className="min-h-11 px-3 py-2.5 lg:px-4 lg:py-3">
          <div className={`min-w-0 ${selected ? "" : uiTextPlaceholder}`}>
            {selected ? value : emptyText}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BackgroundTab({
  header,
  talents,
  editable,
  playerName,
  onUpdateHeader,
  onUpdateTalents,
  cybernetics = [],
  onUpdateCybernetics,
}: BackgroundTabProps) {
  const [showHomeworldPicker, setShowHomeworldPicker] = useState(false);
  const [showCareerPicker, setShowCareerPicker] = useState(false);
  const [showRankPicker, setShowRankPicker] = useState(false);
  const [showDivinationPicker, setShowDivinationPicker] = useState(false);
  const [pendingHomeworldId, setPendingHomeworldId] = useState<string | null>(null);
  const [pendingCareer, setPendingCareer] = useState<CareerData | null>(null);

  const selectedHomeworld = HOMEWORLD_LIST.find((hw) => hw.id === talents.homeworld);
  const selectedCareer = findCareerByName(header.career);
  const selectedRank = selectedCareer?.ranks.find(
    (rank) => rank.name.toLowerCase() === header.rank?.toLowerCase()
  );
  const selectedDivination = findDivinationByResult(header.divination);

  // ── Header field helpers ───────────────────────────────────────────────────
  const updateHeaderField = useCallback(
    <K extends keyof CharacterHeader>(key: K, value: CharacterHeader[K]) => {
      onUpdateHeader({ ...header, [key]: value });
    },
    [header, onUpdateHeader]
  );

  const handleCharacterName = useCallback(
    (v: string) => updateHeaderField("characterName", v),
    [updateHeaderField]
  );
  const handleDescription = useCallback(
    (v: string) => updateHeaderField("description", v),
    [updateHeaderField]
  );

  // ── Talent / homeworld helpers ─────────────────────────────────────────────
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
        onUpdateHeader({ ...header, career: "", rank: "" });
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
      const currentRankBelongsToCareer = career.ranks.some(
        (rank) => rank.name.toLowerCase() === header.rank?.toLowerCase()
      );
      onUpdateHeader({
        ...header,
        career: career.name,
        rank: currentRankBelongsToCareer ? header.rank : career.startingRank,
      });
      onUpdateTalents({ ...talents, careerTraitAcquisition: undefined });
      if (onUpdateCybernetics) {
        void onUpdateCybernetics(cybernetics.filter(
          (item) => item.grantedByTalentEntryUid !== "career:imperial-psyker:sanctioned-psyker"
        ));
      }
      setShowCareerPicker(false);
    },
    [cybernetics, header, onUpdateCybernetics, onUpdateHeader, onUpdateTalents, talents]
  );

  const handleRankSelect = useCallback(
    (rank: CareerRankData) => {
      updateHeaderField("rank", rank.name);
      setShowRankPicker(false);
    },
    [updateHeaderField]
  );

  const handleDivinationSelect = useCallback(
    (divination: DivinationData) => {
      updateHeaderField("divination", divination.result);
      setShowDivinationPicker(false);
    },
    [updateHeaderField]
  );

  const handleBackgroundNotes = useCallback(
    (v: string) => {
      if (!editable) return;
      onUpdateTalents({ ...talents, homeworldNotes: v });
    },
    [editable, talents, onUpdateTalents]
  );

  return (
    <div className="space-y-6 text-slate-100">
      {/* IDENTITY */}
      <div>
        <SectionHeader className="mb-3">Identity</SectionHeader>
        <section className={uiSection + " space-y-3"}>
          <FormField
            label="Character Name"
            value={header.characterName ?? ""}
            onChange={handleCharacterName}
            editable={editable}
            placeholder="e.g. Brother Corvus"
          />
          <FormField
            label="Player Name"
            value={playerName ?? ""}
            onChange={() => {}}
            editable={false}
            placeholder="Set from the player's account"
            description="Taken from the player's account name."
          />
        </section>
      </div>

      {/* APPEARANCE */}
      <div>
        <SectionHeader className="mb-3">Appearance</SectionHeader>
        <section className={uiSection}>
          <FormField
            label="Description"
            value={header.description ?? ""}
            onChange={handleDescription}
            editable={editable}
            type="textarea"
            rows={4}
            placeholder="Physical appearance, mannerisms, distinguishing features…"
          />
        </section>
      </div>

      {/* BACKGROUND */}
      <div>
        <SectionHeader className="mb-3">Background</SectionHeader>
        <section className={uiSection + " space-y-4"}>
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                      content={
                        <CareerInfoContent career={selectedCareer} homeworld={selectedHomeworld} />
                      }
                    />
                  </span>
                )
              }
            />

            <BackgroundPickerField
              label="Rank"
              selected={!!header.rank}
              value={
                selectedCareer &&
                selectedRank && (
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <span className={`${uiItemName} truncate`}>{selectedRank.name}</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Chip className={colourMeta}>Rank {selectedRank.tier}</Chip>
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
              emptyText={
                selectedHomeworld
                  ? selectedCareer
                    ? "— Select rank —"
                    : "Select a career first"
                  : "Select a homeworld first"
              }
              showAction={editable}
              disabled={!editable || !selectedHomeworld || !selectedCareer}
              onClick={() => setShowRankPicker(true)}
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

          <div className="border-t border-slate-700/70" />

          <BackgroundPickerField
            label="Divination"
            selected={!!header.divination}
            value={
              selectedDivination && (
                <div className="flex min-w-0 flex-col gap-1.5">
                  <span className={`${uiItemName} truncate`}>{selectedDivination.result}</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Chip className={`bg-slate-800/40 font-code ${sourceColour(selectedDivination.source)}`}>
                      {selectedDivination.source}
                    </Chip>
                  </div>
                </div>
              )
            }
            emptyText="— Select divination —"
            showAction={editable}
            disabled={!editable}
            onClick={() => setShowDivinationPicker(true)}
            info={
              selectedDivination && (
                <span className={uiInfoModalWrapper}>
                  <InfoModal
                    title={selectedDivination.result}
                    content={<DivinationInfoContent divination={selectedDivination} />}
                  />
                </span>
              )
            }
          />

          <div className="border-t border-slate-700/70" />

          <FormField
            label="Background Notes"
            value={talents.homeworldNotes ?? ""}
            onChange={handleBackgroundNotes}
            editable={editable}
            type="textarea"
            rows={3}
            placeholder="Origin story, connections, history…"
          />
        </section>
      </div>

      {showHomeworldPicker && (
        <HomeworldPicker
          selected={talents.homeworld}
          onSelect={(homeworld) => handleHomeworldSelect(homeworld.id)}
          onClose={() => setShowHomeworldPicker(false)}
        />
      )}

      {showCareerPicker && (
        <CareerPicker
          selected={header.career}
          homeworld={selectedHomeworld!}
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
              onUpdateHeader({ ...header, career: "", rank: "" });
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
            onComplete={(result) => {
              const currentRankBelongsToCareer = pendingCareer.ranks.some(
                (rank) => rank.name.toLowerCase() === header.rank?.toLowerCase()
              );
              onUpdateHeader({
                ...header,
                career: pendingCareer.name,
                rank: currentRankBelongsToCareer ? header.rank : pendingCareer.startingRank,
              });
              onUpdateTalents({
                ...talents,
                careerTraitAcquisition: result.entry.acquisition?.trait,
              });
              if (result.cybernetics && onUpdateCybernetics) {
                void onUpdateCybernetics(result.cybernetics);
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

      {showRankPicker && selectedCareer && (
        <RankPicker
          career={selectedCareer}
          selected={header.rank}
          onSelect={handleRankSelect}
          onClose={() => setShowRankPicker(false)}
        />
      )}

      {showDivinationPicker && (
        <DivinationPicker
          selected={header.divination}
          onSelect={handleDivinationSelect}
          onClose={() => setShowDivinationPicker(false)}
        />
      )}
    </div>
  );
}
