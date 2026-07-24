// src/pages/characterSheet/BackgroundTab.tsx

import { useCallback, useState } from "react";
import type { CharacterHeader, TalentsAndTraitsBlock } from "../../types/Character";
import { FormField } from "../../components/FormField";
import { InfoModal } from "../../components/InfoModal";
import {
  editableInputClass,
  uiFormLabelSecondary,
  uiInfoModalWrapper,
  uiSection,
  uiTextBody,
} from "../../ui/editableStyles";
import { SectionHeader } from "../../ui/SectionHeader";
import { HOMEWORLD_LIST } from "../../data/homeworldData";
import { findCareerByName, type CareerData, type CareerRankData } from "../../data/careerData";
import { findDivinationByResult, type DivinationData } from "../../data/divinationData";
import { OptionPickerScreen } from "../../ui/OptionPickerScreen";
import { ArrowRight } from "../../ui/PickerArrows";
import { CareerInfoContent, CareerPicker, RankInfoContent, RankPicker } from "./CareerPicker";
import { DivinationInfoContent, DivinationPicker } from "./DivinationPicker";

interface BackgroundTabProps {
  header: CharacterHeader;
  talents: TalentsAndTraitsBlock;
  editable: boolean;
  /** Owner's first name, derived from their account profile. Read-only. */
  playerName: string | null;
  onUpdateHeader: (next: CharacterHeader) => void;
  onUpdateTalents: (next: TalentsAndTraitsBlock) => void;
}

export function BackgroundTab({
  header,
  talents,
  editable,
  playerName,
  onUpdateHeader,
  onUpdateTalents,
}: BackgroundTabProps) {
  const [showHomeworldPicker, setShowHomeworldPicker] = useState(false);
  const [showCareerPicker, setShowCareerPicker] = useState(false);
  const [showRankPicker, setShowRankPicker] = useState(false);
  const [showDivinationPicker, setShowDivinationPicker] = useState(false);

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
      onUpdateTalents({ ...talents, homeworld: value });
      setShowHomeworldPicker(false);
    },
    [talents, onUpdateTalents]
  );

  const handleCareerSelect = useCallback(
    (career: CareerData) => {
      const currentRankBelongsToCareer = career.ranks.some(
        (rank) => rank.name.toLowerCase() === header.rank?.toLowerCase()
      );
      onUpdateHeader({
        ...header,
        career: career.name,
        rank: currentRankBelongsToCareer ? header.rank : career.startingRank,
      });
      setShowCareerPicker(false);
    },
    [header, onUpdateHeader]
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

      {/* CAREER */}
      <div>
        <SectionHeader className="mb-3">Career</SectionHeader>
        <section className={uiSection}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <span className={`${uiFormLabelSecondary} mb-0`}>Career</span>
                {selectedCareer && (
                  <span className={uiInfoModalWrapper}>
                    <InfoModal
                      title={selectedCareer.name}
                      content={<CareerInfoContent career={selectedCareer} />}
                    />
                  </span>
                )}
              </div>
              <button
                type="button"
                disabled={!editable}
                onClick={editable ? () => setShowCareerPicker(true) : undefined}
                className={`${editableInputClass(editable)} appearance-none text-left flex items-center justify-between`}
              >
                <span className={header.career ? "" : "text-slate-500"}>
                  {header.career || "— Select career —"}
                </span>
                {editable && <ArrowRight />}
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <span className={`${uiFormLabelSecondary} mb-0`}>Rank</span>
                {selectedCareer && selectedRank && (
                  <span className={uiInfoModalWrapper}>
                    <InfoModal
                      title={selectedRank.name}
                      content={<RankInfoContent career={selectedCareer} rank={selectedRank} />}
                    />
                  </span>
                )}
              </div>
              <button
                type="button"
                disabled={!editable || !selectedCareer}
                onClick={editable && selectedCareer ? () => setShowRankPicker(true) : undefined}
                className={`${editableInputClass(editable && !!selectedCareer)} appearance-none text-left flex items-center justify-between`}
              >
                <span className={header.rank ? "" : "text-slate-500"}>
                  {header.rank || (selectedCareer ? "— Select rank —" : "Select a career first")}
                </span>
                {editable && selectedCareer && <ArrowRight />}
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* DIVINATION */}
      <div>
        <SectionHeader className="mb-3">Divination</SectionHeader>
        <section className={uiSection}>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span className={`${uiFormLabelSecondary} mb-0`}>Divination</span>
              {selectedDivination && (
                <span className={uiInfoModalWrapper}>
                  <InfoModal
                    title={selectedDivination.result}
                    content={<DivinationInfoContent divination={selectedDivination} />}
                  />
                </span>
              )}
            </div>
            <button
              type="button"
              disabled={!editable}
              onClick={editable ? () => setShowDivinationPicker(true) : undefined}
              className={`${editableInputClass(editable)} appearance-none text-left flex items-center justify-between`}
            >
              <span className={header.divination ? "" : "text-slate-500"}>
                {header.divination || "— Select divination —"}
              </span>
              {editable && <ArrowRight />}
            </button>
          </div>
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

      {/* HOMEWORLD */}
      <div>
        <SectionHeader className="mb-3">Homeworld</SectionHeader>
        <section className={uiSection + " space-y-3"}>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              disabled={!editable}
              onClick={editable ? () => setShowHomeworldPicker(true) : undefined}
              className={
                editableInputClass(editable) +
                " appearance-none text-left flex items-center justify-between"
              }
            >
              <span className={selectedHomeworld ? "" : "text-slate-500"}>
                {selectedHomeworld
                  ? `${selectedHomeworld.name} (${selectedHomeworld.source})`
                  : "— Select homeworld —"}
              </span>
              {editable && <ArrowRight />}
            </button>
            {selectedHomeworld && (
              <p className={`text-xs lg:text-sm ${uiTextBody} italic px-1 mt-1`}>
                {selectedHomeworld.description}
              </p>
            )}
          </div>

          <FormField
            label="Background Notes"
            value={talents.homeworldNotes ?? ""}
            onChange={handleBackgroundNotes}
            editable={editable}
            type="textarea"
            rows={4}
            placeholder="Origin story, connections, history…"
          />
        </section>
      </div>

      {showHomeworldPicker && (
        <OptionPickerScreen
          title="Homeworld"
          options={[...HOMEWORLD_LIST]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((hw) => ({ value: hw.id, label: `${hw.name} (${hw.source})` }))}
          selected={talents.homeworld}
          onSelect={handleHomeworldSelect}
          onClose={() => setShowHomeworldPicker(false)}
        />
      )}

      {showCareerPicker && (
        <CareerPicker
          selected={header.career}
          onSelect={handleCareerSelect}
          onClose={() => setShowCareerPicker(false)}
        />
      )}

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
