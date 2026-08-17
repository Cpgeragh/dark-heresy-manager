// src/pages/characterSheet/BackgroundTab.tsx

import { useCallback, useState } from "react";
import type { ReactNode } from "react";
import type { CharacterHeader, CyberneticItem, GearItem, TalentsAndTraitsBlock } from "../../types/Character";
import { FormField } from "../../components/FormField";
import { InfoModal } from "../../components/InfoModal";
import {
  editableInputClass,
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
import { EYE_OPTIONS, HAIR_OPTIONS, SKIN_OPTIONS } from "../../data/appearanceData";
import { Button } from "../../ui/Button";
import { Chip } from "../../ui/Chip";
import { colourActiveRose, colourActiveSky, colourMeta } from "../../ui/colourTokens";
import { RollChip } from "../../ui/RollChip";
import { sourceColour } from "../../ui/sourceStyles";
import { useSwipeableTabs } from "../../hooks/useSwipeableTabs";
import { SegmentedTabs, type SegmentedTabOption } from "../../ui/SegmentedTabs";
import {
  segmentedTabId,
  segmentedTabPanelId,
  uiSwipeableTabPanel,
} from "../../ui/segmentedTabStyles";
import { CareerInfoContent, CareerPicker, RankInfoContent, RankPicker } from "./CareerPicker";
import { SANCTIONING_RESULTS } from "../../features/traits/sanctioningReference";
import { DivinationInfoContent, DivinationPicker } from "./DivinationPicker";
import { HomeworldInfoContent, HomeworldPicker } from "./HomeworldPicker";
import { AppearanceTraitPicker } from "./AppearanceTraitPicker";
import { GenderPicker } from "./GenderPicker";
import { QuirkPicker } from "./QuirkPicker";
import { AddButton } from "../../ui/AddButton";
import { CloseIcon } from "../../ui/CloseButton";
import { uiDismissButton } from "../../ui/buttonStyles";
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
  gear?: GearItem[];
  onUpdateGear?: (next: GearItem[]) => void | Promise<void>;
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
  compact = false,
}: {
  label: string;
  selected: boolean;
  value: ReactNode;
  emptyText: string;
  showAction: boolean;
  disabled: boolean;
  onClick: () => void;
  info?: ReactNode;
  /** Smaller box/text — for short single-word values in narrow grid cells (Gender/Skin/Hair/Eyes). */
  compact?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className={uiFormLabel}>{label}</span>
          {info}
        </div>
        <Button
          size="xs"
          disabled={disabled}
          onClick={onClick}
          aria-label={`${selected ? "Change" : "Select"} ${label}`}
          className={`shrink-0 ${showAction ? "" : "invisible"}`}
        >
          {selected ? "Change" : "Select"}
        </Button>
      </div>
      <div className={uiSectionShell + " overflow-hidden"}>
        <div className={compact ? "min-h-9 px-2.5 py-1.5 lg:px-3 lg:py-2" : "min-h-11 px-3 py-2.5 lg:px-4 lg:py-3"}>
          <div className={`min-w-0 ${compact ? "text-sm lg:text-base" : ""} ${selected ? "" : uiTextPlaceholder}`}>
            {selected ? value : emptyText}
          </div>
        </div>
      </div>
    </div>
  );
}

type BackgroundSectionGroup = "appearance" | "background";
const BACKGROUND_SECTION_GROUPS = [
  "appearance",
  "background",
] as const satisfies readonly BackgroundSectionGroup[];
const BACKGROUND_TABS = [
  {
    value: "appearance",
    label: "Appearance",
    activeClassName: colourActiveSky,
  },
  {
    value: "background",
    label: "Background",
    activeClassName: colourActiveRose,
  },
] as const satisfies readonly SegmentedTabOption<BackgroundSectionGroup>[];
const BACKGROUND_TABS_ID = "background-section-groups";

export function BackgroundTab({
  header,
  talents,
  editable,
  playerName,
  onUpdateHeader,
  onUpdateTalents,
  cybernetics = [],
  onUpdateCybernetics,
  gear = [],
  onUpdateGear,
}: BackgroundTabProps) {
  const [showHomeworldPicker, setShowHomeworldPicker] = useState(false);
  const [showCareerPicker, setShowCareerPicker] = useState(false);
  const [showRankPicker, setShowRankPicker] = useState(false);
  const [showDivinationPicker, setShowDivinationPicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showSkinPicker, setShowSkinPicker] = useState(false);
  const [showHairPicker, setShowHairPicker] = useState(false);
  const [showEyesPicker, setShowEyesPicker] = useState(false);
  const [showQuirkPicker, setShowQuirkPicker] = useState(false);
  const [heightDraft, setHeightDraft] = useState(() =>
    header.height !== undefined ? String(header.height) : ""
  );
  const [pendingHomeworldId, setPendingHomeworldId] = useState<string | null>(null);
  const [pendingCareer, setPendingCareer] = useState<CareerData | null>(null);
  const [activeSectionGroup, setActiveSectionGroup] = useState<BackgroundSectionGroup>("appearance");

  const { containerRef, transitionClass, switchTo } = useSwipeableTabs(
    BACKGROUND_SECTION_GROUPS,
    activeSectionGroup,
    setActiveSectionGroup
  );

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

  const handleAge = useCallback(
    (raw: string) => {
      if (raw === "" || /^[1-9]\d*$/.test(raw)) {
        updateHeaderField("age", raw === "" ? undefined : Number(raw));
      }
    },
    [updateHeaderField]
  );

  const handleWeight = useCallback(
    (raw: string) => {
      if (raw === "" || /^[1-9]\d*$/.test(raw)) {
        updateHeaderField("weight", raw === "" ? undefined : Number(raw));
      }
    },
    [updateHeaderField]
  );

  const handleHeight = useCallback(
    (raw: string) => {
      if (raw !== "" && !/^\d*(?:\.\d{0,2})?$/.test(raw)) return;
      setHeightDraft(raw);
      const parsed = Number(raw);
      if (raw === "") {
        updateHeaderField("height", undefined);
      } else if (Number.isFinite(parsed) && parsed > 0) {
        updateHeaderField("height", parsed);
      }
    },
    [updateHeaderField]
  );

  const handleRemoveQuirk = useCallback(
    (index: number) => {
      updateHeaderField("quirks", (header.quirks ?? []).filter((_, i) => i !== index));
    },
    [header.quirks, updateHeaderField]
  );

  const appearanceSection = (
    <div>
      <SectionHeader className="mb-3">Appearance</SectionHeader>
      <section className={uiSection + " space-y-4"}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <label className={uiFormLabel}>Age</label>
            <input
              type="text"
              inputMode="numeric"
              disabled={!editable}
              aria-label="Age"
              value={header.age !== undefined ? String(header.age) : ""}
              onChange={(e) => handleAge(e.target.value)}
              placeholder="e.g. 25"
              className={editableInputClass(editable) + " font-code"}
            />
          </div>
          <div className="space-y-1">
            <label className={uiFormLabel}>Height</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="decimal"
                disabled={!editable}
                aria-label="Height"
                value={heightDraft}
                onChange={(e) => handleHeight(e.target.value)}
                placeholder="e.g. 1.90"
                className={editableInputClass(editable) + " font-code"}
              />
              <span className="text-xs lg:text-sm text-slate-400">m</span>
            </div>
          </div>
          <div className="space-y-1">
            <label className={uiFormLabel}>Weight</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                disabled={!editable}
                aria-label="Weight"
                value={header.weight !== undefined ? String(header.weight) : ""}
                onChange={(e) => handleWeight(e.target.value)}
                placeholder="e.g. 65"
                className={editableInputClass(editable) + " font-code"}
              />
              <span className="text-xs lg:text-sm text-slate-400">kg</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-700/70" />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <BackgroundPickerField
            label="Gender"
            selected={!!header.gender}
            value={header.gender}
            emptyText="— Select gender —"
            showAction={editable}
            disabled={!editable}
            onClick={() => setShowGenderPicker(true)}
            compact
          />
          <BackgroundPickerField
            label="Skin"
            selected={!!header.skin}
            value={header.skin}
            emptyText="— Select skin —"
            showAction={editable}
            disabled={!editable}
            onClick={() => setShowSkinPicker(true)}
            compact
          />
          <BackgroundPickerField
            label="Hair"
            selected={!!header.hair}
            value={header.hair}
            emptyText="— Select hair —"
            showAction={editable}
            disabled={!editable}
            onClick={() => setShowHairPicker(true)}
            compact
          />
          <BackgroundPickerField
            label="Eyes"
            selected={!!header.eyes}
            value={header.eyes}
            emptyText="— Select eyes —"
            showAction={editable}
            disabled={!editable}
            onClick={() => setShowEyesPicker(true)}
            compact
          />
        </div>

        <div className="border-t border-slate-700/70" />

        <div>
          <p className={`${uiFormLabel} mb-1.5`}>
            <span className="relative">
              Quirks
              {editable && (
                <AddButton
                  label="Add Quirk"
                  size="sm"
                  onClick={() => setShowQuirkPicker(true)}
                  className="absolute left-full ml-2 top-1/2 -translate-y-1/2 -mt-px"
                />
              )}
            </span>
          </p>
          {(header.quirks ?? []).length === 0 && !editable && (
            <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>None.</p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {(header.quirks ?? []).map((quirk, index) => (
              <span
                key={`${quirk}:${index}`}
                className={`inline-flex items-center gap-2.5 lg:gap-3 px-2.5 lg:px-3 py-1 lg:py-1.5 rounded border text-xs lg:text-sm ${colourMeta}`}
              >
                {quirk}
                {editable && (
                  <button
                    type="button"
                    onClick={() => handleRemoveQuirk(index)}
                    aria-label={`Remove ${quirk}`}
                    className={uiDismissButton}
                  >
                    <CloseIcon />
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-700/70" />

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
  );

  const backgroundSection = (
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

        {(() => {
          const sanctioning = talents.careerTraitAcquisition?.sanctioning;
          const sanctioningRef = sanctioning
            ? SANCTIONING_RESULTS.find((result) => result.id === sanctioning.resultId)
            : undefined;
          const rankField = (
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
          );
          return (
            <div className="space-y-4">
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

              {rankField}
            </div>
          );
        })()}

        <div className="border-t border-slate-700/70" />

        <BackgroundPickerField
          label="Divination"
          selected={!!header.divination}
          value={
            selectedDivination && (
              <div className="flex min-w-0 flex-col gap-1.5">
                <span className={uiItemName}>{selectedDivination.result}</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <RollChip>{selectedDivination.roll}</RollChip>
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
          />
        </section>
      </div>

      {/* Mobile — tab switcher between Appearance and Background */}
      <div ref={containerRef} className="lg:hidden space-y-4">
        <SegmentedTabs
          id={BACKGROUND_TABS_ID}
          ariaLabel="Background section groups"
          options={BACKGROUND_TABS}
          value={activeSectionGroup}
          onChange={switchTo}
        />

        <section
          key={activeSectionGroup}
          id={segmentedTabPanelId(BACKGROUND_TABS_ID, activeSectionGroup)}
          aria-labelledby={segmentedTabId(BACKGROUND_TABS_ID, activeSectionGroup)}
          className={["space-y-6", uiSwipeableTabPanel, transitionClass].join(" ")}
          role="tabpanel"
        >
          {activeSectionGroup === "appearance" ? appearanceSection : backgroundSection}
        </section>
      </div>

      {/* Desktop — side by side */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start">
        {appearanceSection}
        {backgroundSection}
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
            gear={gear}
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

      {showGenderPicker && (
        <GenderPicker
          selected={header.gender}
          onSelect={(value) => { updateHeaderField("gender", value); setShowGenderPicker(false); }}
          onClose={() => setShowGenderPicker(false)}
        />
      )}

      {showSkinPicker && (
        <AppearanceTraitPicker
          title="Skin"
          options={SKIN_OPTIONS}
          selected={header.skin}
          onSelect={(value) => { updateHeaderField("skin", value); setShowSkinPicker(false); }}
          onClose={() => setShowSkinPicker(false)}
        />
      )}

      {showHairPicker && (
        <AppearanceTraitPicker
          title="Hair"
          options={HAIR_OPTIONS}
          selected={header.hair}
          onSelect={(value) => { updateHeaderField("hair", value); setShowHairPicker(false); }}
          onClose={() => setShowHairPicker(false)}
        />
      )}

      {showEyesPicker && (
        <AppearanceTraitPicker
          title="Eyes"
          options={EYE_OPTIONS}
          selected={header.eyes}
          onSelect={(value) => { updateHeaderField("eyes", value); setShowEyesPicker(false); }}
          onClose={() => setShowEyesPicker(false)}
        />
      )}

      {showQuirkPicker && (
        <QuirkPicker
          existing={header.quirks ?? []}
          onSelect={(quirk) => {
            updateHeaderField("quirks", [...(header.quirks ?? []), quirk]);
            setShowQuirkPicker(false);
          }}
          onClose={() => setShowQuirkPicker(false)}
        />
      )}
    </div>
  );
}
