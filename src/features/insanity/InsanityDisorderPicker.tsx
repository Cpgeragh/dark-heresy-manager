import { useRef, useState } from "react";
import type { InsanityDisorderEntry, InsanityDisorderSeverity } from "../../types/Character";
import type { CustomItemOrigin } from "../../constants/customItems";
import { InfoModal } from "../../components/InfoModal";
import { Button } from "../../ui/Button";
import { Chip } from "../../ui/Chip";
import { CustomFormSection } from "../../ui/CustomFormSection";
import { CustomFormShell } from "../../ui/CustomFormShell";
import { OriginSelector } from "../../ui/OriginSelector";
import { PickerBody, PickerCustomAction, PickerModal, PickerRow } from "../../ui/PickerModal";
import { OptionPickerScreen } from "../../ui/OptionPickerScreen";
import { ArrowRight, ArrowLeft } from "../../ui/PickerArrows";
import { RequiredFormLabel } from "../../ui/RequiredFormLabel";
import { uiPickerPressFeedback } from "../../ui/buttonStyles";
import {
  editableInputClass,
  editableTextareaClass,
  uiFormLabel,
  uiInfoModalWrapper,
  uiItemName,
  uiSectionShell,
  uiTextBody,
  uiTextLabel,
} from "../../ui/editableStyles";
import { DisorderInfoContent } from "./InsanityReferenceModals";
import {
  INSANITY_DISORDER_REFERENCE,
  INSANITY_SEVERITIES,
  type InsanityDisorderRef,
} from "./insanityReference";
import { disorderTypeChipClass, inactiveChipClass, severityChipClass } from "./insanityUi";
import { createLocalId } from "../../utils/createLocalId";

const customDisorderTypes = [
  ...Array.from(new Set(INSANITY_DISORDER_REFERENCE.map((ref) => ref.type))).sort(),
  "Other",
];

const allSeverityOptions: InsanityDisorderSeverity[] = ["Minor", "Severe", "Acute"];
const severeSeverityOptions: InsanityDisorderSeverity[] = ["Severe", "Acute"];

function customSeverityOptionsFor(type: string): InsanityDisorderSeverity[] {
  if (type === "The Flesh is Weak") return severeSeverityOptions;
  if (type === "Horrific Nightmares") return ["Minor", "Severe"];
  return allSeverityOptions;
}

export function InsanityDisorderPicker({
  existingReferenceIds,
  editable,
  onAdd,
  onClose,
}: {
  existingReferenceIds: Set<string>;
  editable: boolean;
  onAdd: (entry: InsanityDisorderEntry) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [selected, setSelected] = useState<InsanityDisorderRef | null>(null);
  const [customMode, setCustomMode] = useState(false);
  const [customType, setCustomType] = useState(customDisorderTypes[0]);
  const [severity, setSeverity] = useState<InsanityDisorderSeverity>("Minor");
  const [customName, setCustomName] = useState("");
  const [notes, setNotes] = useState("");
  const [customOrigin, setCustomOrigin] = useState<"" | CustomItemOrigin>("");
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showTypeFilterPicker, setShowTypeFilterPicker] = useState(false);
  const listScrollPositionRef = useRef(0);
  const customScrollPositionRef = useRef(0);

  const typeOptions = [
    "All",
    ...Array.from(new Set(INSANITY_DISORDER_REFERENCE.map((ref) => ref.type))).sort(),
  ];
  const filtered = INSANITY_DISORDER_REFERENCE.filter((ref) => {
    const searchable = `${ref.type} ${ref.name}`.toLowerCase();
    return (
      !ref.custom &&
      !existingReferenceIds.has(ref.id) &&
      (typeFilter === "All" || ref.type === typeFilter) &&
      searchable.includes(query.trim().toLowerCase())
    );
  }).sort((a, b) => a.name.localeCompare(b.name));

  const activeSeverity = selected?.severityOptions.includes(severity)
    ? severity
    : (selected?.severityOptions[0] ?? "Minor");
  const customSeverityOptions = customSeverityOptionsFor(customType);
  const activeCustomSeverity = customSeverityOptions.includes(severity)
    ? severity
    : customSeverityOptions[0];
  const activeSeverityDescription =
    INSANITY_SEVERITIES.find((entry) => entry.severity === activeSeverity)?.description ?? "";
  const canAddCustom = Boolean(customName.trim()) && Boolean(customOrigin) && Boolean(notes.trim());

  if (showTypePicker) {
    return (
      <OptionPickerScreen
        title="Type"
        options={customDisorderTypes}
        selected={customType}
        onSelect={(value) => {
          setCustomType(value);
          setShowTypePicker(false);
        }}
        onClose={() => setShowTypePicker(false)}
      />
    );
  }
  if (showTypeFilterPicker) {
    return (
      <OptionPickerScreen
        title="Disorder Type"
        options={typeOptions.map((type) => (type === "All" ? "All Disorder Types" : type))}
        selected={typeFilter === "All" ? "All Disorder Types" : typeFilter}
        onSelect={(value) => {
          setTypeFilter(value === "All Disorder Types" ? "All" : value);
          setShowTypeFilterPicker(false);
        }}
        onClose={() => setShowTypeFilterPicker(false)}
      />
    );
  }

  if (customMode) {
    return (
      <CustomFormShell
        title="Custom Disorder"
        scrollPositionRef={customScrollPositionRef}
        closeLabel={<ArrowLeft />}
        closeAriaLabel="Back"
        onClose={() => setCustomMode(false)}
        canSubmit={canAddCustom}
        submitLabel="Add Disorder"
        onSubmit={() => {
          if (!canAddCustom || !customOrigin) return;
          onAdd({
            id: createLocalId("disorder"),
            type: customType,
            name: customName.trim(),
            severity: activeCustomSeverity,
            notes: notes.trim(),
            source: customOrigin,
            custom: true,
          });
          setCustomMode(false);
          setCustomType(customDisorderTypes[0]);
          setSeverity("Minor");
          setCustomName("");
          setNotes("");
          setCustomOrigin("");
        }}
      >
        <CustomFormSection title="Identity">
          <div>
            <RequiredFormLabel htmlFor="custom-disorder-type">Type</RequiredFormLabel>
            <button
              id="custom-disorder-type"
              type="button"
              onClick={() => setShowTypePicker(true)}
              className={`mt-1 w-full rounded border border-slate-500 bg-slate-900 px-2 py-1.5 text-sm lg:text-base text-slate-200 text-left flex items-center justify-between ${uiPickerPressFeedback()}`}
            >
              <span>{customType}</span>
              <ArrowRight />
            </button>
          </div>
          <div>
            <RequiredFormLabel htmlFor="custom-disorder-name">Name</RequiredFormLabel>
            <input
              id="custom-disorder-name"
              type="text"
              required
              value={customName}
              onChange={(event) => setCustomName(event.target.value)}
              placeholder="Name the disorder…"
              className={editableInputClass(true) + " mt-0.5"}
            />
          </div>
        </CustomFormSection>

        <CustomFormSection title="Origin">
          <OriginSelector name="custom-disorder-origin" value={customOrigin} onChange={setCustomOrigin} />
        </CustomFormSection>

        <CustomFormSection title="Rules">
          <div>
            <p className={uiFormLabel}>
              Severity <span className="text-red-500">*</span>
            </p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {customSeverityOptions.map((option) => (
                <Chip
                  key={option}
                  as="button"
                  type="button"
                  onClick={() => setSeverity(option)}
                  className={
                    activeCustomSeverity === option ? severityChipClass[option] : inactiveChipClass
                  }
                >
                  {option}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <RequiredFormLabel htmlFor="custom-disorder-rules">Rules Text</RequiredFormLabel>
            <textarea
              id="custom-disorder-rules"
              required
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="What this disorder does…"
              rows={4}
              className={editableTextareaClass(true) + " mt-0.5"}
            />
          </div>
        </CustomFormSection>
      </CustomFormShell>
    );
  }

  if (selected) {
    return (
      <PickerModal
        title={selected.name}
        query=""
        onQueryChange={() => undefined}
        onClose={() => setSelected(null)}
        closeLabel={<ArrowLeft />}
        closeAriaLabel="Back"
        hideSearch
        isEmpty={false}
        footer={
          <Button
            className="w-full"
            onClick={() => {
              onAdd({
                id: createLocalId("disorder"),
                referenceId: selected.id,
                type: selected.type,
                name: selected.name,
                severity: activeSeverity,
              });
              setSelected(null);
            }}
          >
            Add Disorder
          </Button>
        }
      >
        <PickerBody>
          <div>
            <p className={`${uiFormLabel} mb-2 text-center normal-case !text-[15px] lg:!text-base`}>
              Choose Severity
            </p>
            <div className="flex gap-2">
              {selected.severityOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSeverity(option)}
                  className={[
                    "flex-1 py-1.5 lg:py-2 rounded border text-sm lg:text-base font-medium transition",
                    activeSeverity === option
                      ? severityChipClass[option]
                      : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500",
                  ].join(" ")}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          {activeSeverityDescription && (
            <div
              className={`text-center text-xs lg:text-sm ${uiTextBody} bg-slate-800/60 rounded p-3 lg:p-4 leading-relaxed`}
            >
              {activeSeverityDescription}
            </div>
          )}
        </PickerBody>
      </PickerModal>
    );
  }

  return (
    <PickerModal
      title={editable ? "Add Disorder" : "View Disorders"}
      placeholder="Search disorders..."
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      scrollPositionRef={listScrollPositionRef}
      isEmpty={filtered.length === 0}
      filterRow={
        <button
          type="button"
          onClick={() => setShowTypeFilterPicker(true)}
          className={`w-full rounded border border-slate-500 bg-slate-900 px-2 py-1 text-xs lg:text-sm text-slate-200 text-left flex items-center justify-between ${uiPickerPressFeedback()}`}
        >
          <span>{typeFilter === "All" ? "All Disorder Types" : typeFilter}</span>
          <ArrowRight />
        </button>
      }
      footer={
        editable && (
          <PickerCustomAction
            onClick={() => {
              setCustomMode(true);
              setSelected(null);
              setCustomType(customDisorderTypes[0]);
              setSeverity("Minor");
              setCustomName("");
              setNotes("");
              setCustomOrigin("");
            }}
          >
            + Add custom disorder
          </PickerCustomAction>
        )
      }
    >
      <div className="space-y-3 p-3 lg:p-4">
      {filtered.map((ref) => (
        <PickerRow
          key={ref.id}
          card
          className={uiSectionShell}
          interactive={editable}
          onClick={() => {
            setSelected(ref);
            setSeverity(ref.severityOptions[0]);
            setCustomName("");
            setNotes("");
          }}
        >
          <span className={`${uiItemName} group-hover:text-white`}>{ref.name}</span>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Chip size="sm" className={disorderTypeChipClass(ref.type)}>
              {ref.type}
            </Chip>
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className={uiTextLabel}>Rules</span>
            <span onClick={(event) => event.stopPropagation()} className={uiInfoModalWrapper}>
              <InfoModal
                title={ref.name}
                content={
                  <DisorderInfoContent
                    type={ref.type}
                    name={ref.name}
                    description={ref.description}
                    typeDescription={ref.typeDescription}
                  />
                }
                as="span"
              />
            </span>
          </div>
        </PickerRow>
      ))}
      </div>
    </PickerModal>
  );
}
