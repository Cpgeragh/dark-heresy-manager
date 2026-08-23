// src/pages/characterSheet/BackgroundTab.tsx

import { useCallback, useState } from "react";
import type { CharacterHeader, CyberneticItem, GearItem, TalentsAndTraitsBlock } from "../../types/Character";
import { FormField } from "../../components/FormField";
import { InfoModal } from "../../components/InfoModal";
import {
  editableInputClass,
  uiFormLabel,
  uiInfoModalWrapper,
  uiItemName,
  uiSection,
  uiTextPlaceholder,
} from "../../ui/editableStyles";
import { SectionHeader } from "../../ui/SectionHeader";
import { findDivinationByResult, type DivinationData } from "../../data/divinationData";
import { EYE_OPTIONS, HAIR_OPTIONS, SKIN_OPTIONS } from "../../data/appearanceData";
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
import { DivinationInfoContent, DivinationPicker } from "./DivinationPicker";
import { AppearanceTraitPicker } from "./AppearanceTraitPicker";
import { GenderPicker } from "./GenderPicker";
import { QuirkPicker } from "./QuirkPicker";
import { AddButton } from "../../ui/AddButton";
import { CloseIcon } from "../../ui/CloseButton";
import { uiDismissButton } from "../../ui/buttonStyles";
import { BackgroundPickerField } from "./BackgroundPickerField";
import { BackgroundSetupFields } from "./BackgroundSetupFields";

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
  const [showDivinationPicker, setShowDivinationPicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showSkinPicker, setShowSkinPicker] = useState(false);
  const [showHairPicker, setShowHairPicker] = useState(false);
  const [showEyesPicker, setShowEyesPicker] = useState(false);
  const [showQuirkPicker, setShowQuirkPicker] = useState(false);
  const [heightDraft, setHeightDraft] = useState(() =>
    header.height !== undefined ? String(header.height) : ""
  );
  const [activeSectionGroup, setActiveSectionGroup] = useState<BackgroundSectionGroup>("appearance");

  const { containerRef, transitionClass, switchTo } = useSwipeableTabs(
    BACKGROUND_SECTION_GROUPS,
    activeSectionGroup,
    setActiveSectionGroup
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

  const [editingAge, setEditingAge] = useState(false);
  const [ageDraft, setAgeDraft] = useState("");

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
    (quirk: string) => {
      updateHeaderField("quirks", (header.quirks ?? []).filter((q) => q !== quirk));
    },
    [header.quirks, updateHeaderField]
  );

  const sanctioningAgeIncrease = talents.careerTraitAcquisition?.sanctioning?.ageIncrease;
  const displayedAge = header.age !== undefined ? header.age + (sanctioningAgeIncrease ?? 0) : undefined;

  const appearanceSection = (
    <div>
      <SectionHeader className="mb-3">Appearance</SectionHeader>
      <section className={uiSection + " space-y-4"}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <label className={uiFormLabel}>
              <span className="flex items-center gap-1.5">
                Age
                {sanctioningAgeIncrease && (
                  <span className={uiInfoModalWrapper}>
                    <InfoModal
                      title="Age"
                      content={
                        <div>
                          <div className="font-semibold text-slate-100">Modifiers</div>
                          <ul className="mt-1 space-y-1">
                            <li>Sanctioned Psyker: +{sanctioningAgeIncrease}</li>
                          </ul>
                        </div>
                      }
                    />
                  </span>
                )}
              </span>
            </label>
            {editingAge ? (
              <input
                type="text"
                inputMode="numeric"
                aria-label="Age"
                value={ageDraft}
                onChange={(e) => {
                  if (e.target.value === "" || /^[1-9]\d*$/.test(e.target.value)) setAgeDraft(e.target.value);
                }}
                onBlur={() => {
                  if (ageDraft === "" || /^[1-9]\d*$/.test(ageDraft)) {
                    updateHeaderField("age", ageDraft === "" ? undefined : Number(ageDraft));
                  }
                  setEditingAge(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                  if (e.key === "Escape") setEditingAge(false);
                }}
                placeholder="e.g. 25"
                className={editableInputClass(editable) + " font-code"}
              />
            ) : (
              <button
                type="button"
                disabled={!editable}
                aria-label="Age"
                onClick={() => {
                  setAgeDraft(header.age !== undefined ? String(header.age) : "");
                  setEditingAge(true);
                }}
                className={editableInputClass(editable) + " font-code text-left"}
              >
                {displayedAge !== undefined ? displayedAge : <span className={uiTextPlaceholder}>e.g. 25</span>}
              </button>
            )}
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
            {[...(header.quirks ?? [])].sort((a, b) => a.localeCompare(b)).map((quirk) => (
              <span
                key={quirk}
                className={`inline-flex items-center gap-2.5 lg:gap-3 px-2.5 lg:px-3 py-1 lg:py-1.5 rounded border text-xs lg:text-sm ${colourMeta}`}
              >
                {quirk}
                {editable && (
                  <button
                    type="button"
                    onClick={() => handleRemoveQuirk(quirk)}
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
        <BackgroundSetupFields
          header={header}
          talents={talents}
          editable={editable}
          onUpdateHeader={onUpdateHeader}
          onUpdateTalents={onUpdateTalents}
          cybernetics={cybernetics}
          onUpdateCybernetics={onUpdateCybernetics}
          gear={gear}
          onUpdateGear={onUpdateGear}
        />

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
          }}
          onClose={() => setShowQuirkPicker(false)}
        />
      )}
    </div>
  );
}
