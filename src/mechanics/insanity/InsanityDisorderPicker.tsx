import { useRef, useState } from "react";
import type { InsanityDisorderEntry, InsanityDisorderSeverity } from "../../types/Character";
import type { CustomItemOrigin } from "../../constants/customItems";
import { InfoModal } from "../../components/InfoModal";
import { Button } from "../../ui/buttons/Button";
import { ToggleButton } from "../../ui/buttons/ToggleButton";
import { Chip } from "../../ui/chips/Chip";
import { CustomFormSection } from "../../ui/forms/CustomFormSection";
import { CustomFormShell } from "../../ui/forms/CustomFormShell";
import { OriginSelector } from "../../ui/forms/OriginSelector";
import {
  PickerBody,
  PickerCustomAction,
  PickerList,
  PickerModal,
  PickerRow,
} from "../../ui/pickers/PickerModal";
import { PickerRowChips, PickerRowInfoLine, PickerRowName } from "../../ui/pickers/PickerRowParts";
import { OptionPickerScreen } from "../../ui/pickers/OptionPickerScreen";
import { ArrowLeft } from "../../ui/icons/PickerArrows";
import { FilterButton } from "../../ui/pickers/FilterButton";
import { PickerField } from "../../ui/pickers/PickerField";
import { RequiredFormLabel } from "../../ui/forms/RequiredFormLabel";
import { RequiredMark } from "../../ui/forms/RequiredMark";
import {
  editableInputClass,
  editableTextareaClass,
  uiFormLabel,
  uiDescriptionBox,
} from "../../ui/styles/editableStyles";
import { DisorderInfoContent } from "./InsanityReferenceModals";
import {
  customSeverityOptionsFor,
  INSANITY_DISORDER_REFERENCE,
  INSANITY_SEVERITIES,
  type InsanityDisorderRef,
} from "./insanityReference";
import { chipColours } from "../../ui/styles/colourTokens";
import { disorderTypeChipColour, severityChipColour } from "./insanityUi";
import { createLocalId } from "../../utils/createLocalId";

const customDisorderTypes = [
  ...Array.from(new Set(INSANITY_DISORDER_REFERENCE.map((ref) => ref.type))).sort(),
  "Other",
];

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
          <PickerField
            id="custom-disorder-type"
            label="Type"
            required
            value={customType}
            placeholder="Choose type"
            onClick={() => setShowTypePicker(true)}
          />
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
              autoComplete="off"
            />
          </div>
        </CustomFormSection>

        <CustomFormSection title="Origin">
          <OriginSelector
            name="custom-disorder-origin"
            value={customOrigin}
            onChange={setCustomOrigin}
          />
        </CustomFormSection>

        <CustomFormSection title="Rules">
          <div>
            <p className={uiFormLabel}>
              Severity <RequiredMark />
            </p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {customSeverityOptions.map((option) => (
                <Chip
                  key={option}
                  as="button"
                  type="button"
                  onClick={() => setSeverity(option)}
                  colour={activeCustomSeverity === option ? severityChipColour[option] : "slate"}
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
              autoComplete="off"
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
                <ToggleButton
                  key={option}
                  selected={activeSeverity === option}
                  selectedClassName={chipColours[severityChipColour[option]]}
                  className="flex-1 py-1.5 lg:py-2 text-sm lg:text-base font-medium"
                  onClick={() => setSeverity(option)}
                >
                  {option}
                </ToggleButton>
              ))}
            </div>
          </div>
          {activeSeverityDescription && (
            <div className={`text-center ${uiDescriptionBox}`}>{activeSeverityDescription}</div>
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
        <FilterButton className="w-full" onClick={() => setShowTypeFilterPicker(true)}>
          {typeFilter === "All" ? "All Disorder Types" : typeFilter}
        </FilterButton>
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
      <PickerList>
        {filtered.map((ref) => (
          <PickerRow
            key={ref.id}
            interactive={editable}
            onClick={() => {
              setSelected(ref);
              setSeverity(ref.severityOptions[0]);
              setCustomName("");
              setNotes("");
            }}
          >
            <PickerRowName name={ref.name} />
            <PickerRowChips>
              <Chip size="sm" colour={disorderTypeChipColour(ref.type)}>
                {ref.type}
              </Chip>
            </PickerRowChips>
            <PickerRowInfoLine
              label="Rules"
              info={
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
              }
            />
          </PickerRow>
        ))}
      </PickerList>
    </PickerModal>
  );
}
