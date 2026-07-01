import { useState } from "react";
import type { InsanityDisorderEntry, InsanityDisorderSeverity } from "../../types/Character";
import { FormField } from "../../components/FormField";
import { InfoModal } from "../../components/InfoModal";
import { Button } from "../../ui/Button";
import { Chip } from "../../ui/Chip";
import { PickerModal } from "../../ui/PickerModal";
import { uiActionButton, uiPickerBackButton } from "../../ui/buttonStyles";
import { editableInputClass, uiFormLabel, uiInfoModalWrapper, uiItemName, uiTextBody, uiTextMuted } from "../../ui/editableStyles";
import { DisorderInfoContent } from "./InsanityReferenceModals";
import { INSANITY_DISORDER_REFERENCE, INSANITY_SEVERITIES, type InsanityDisorderRef } from "./insanityReference";
import { inactiveChipClass, severityChipClass } from "./insanityUi";

function createDisorderId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `disorder-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const customDisorderTypes = [
  ...Array.from(new Set(INSANITY_DISORDER_REFERENCE.map((ref) => ref.type))),
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
  onAdd,
  onClose,
}: {
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

  const typeOptions = [
    "All",
    ...Array.from(new Set(INSANITY_DISORDER_REFERENCE.map((ref) => ref.type))),
  ];
  const filtered = INSANITY_DISORDER_REFERENCE.filter((ref) => {
    const searchable = `${ref.type} ${ref.name}`.toLowerCase();
    return (
      !ref.custom &&
      (typeFilter === "All" || ref.type === typeFilter) &&
      searchable.includes(query.trim().toLowerCase())
    );
  });

  const activeSeverity = selected?.severityOptions.includes(severity)
    ? severity
    : selected?.severityOptions[0] ?? "Minor";
  const customSeverityOptions = customSeverityOptionsFor(customType);
  const activeCustomSeverity = customSeverityOptions.includes(severity)
    ? severity
    : customSeverityOptions[0];
  const activeSeverityDescription =
    INSANITY_SEVERITIES.find((entry) => entry.severity === activeSeverity)?.description ?? "";
  const canAddCustom = Boolean(customName.trim());

  if (customMode) {
    return (
      <PickerModal
        title="Custom Disorder"
        query=""
        onQueryChange={() => undefined}
        onClose={() => setCustomMode(false)}
        closeLabel="←"
        hideSearch
        isEmpty={false}
        footer={
          <div className="space-y-2">
            {!canAddCustom && (
              <p className="text-xs lg:text-sm text-slate-300"><span className="text-red-500">*</span> Required</p>
            )}
            <div className="flex gap-2">
              <button type="button" onClick={() => setCustomMode(false)} className={uiPickerBackButton}>
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!canAddCustom) return;
                  onAdd({
                    id: createDisorderId(),
                    type: customType,
                    name: customName.trim(),
                    severity: activeCustomSeverity,
                    notes: notes.trim() || undefined,
                    custom: true,
                  });
                  onClose();
                }}
                disabled={!canAddCustom}
                className={`${uiActionButton} flex-1 disabled:cursor-not-allowed disabled:opacity-50`}
              >
                Add Disorder
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-4 p-4 lg:p-5">
          <div>
            <p className={uiFormLabel}>Type <span className="text-red-500">*</span></p>
            <select
              value={customType}
              onChange={(event) => setCustomType(event.target.value)}
              className="mt-1 w-full rounded border border-slate-500 bg-slate-900 px-2 py-1.5 text-sm lg:text-base text-slate-200 focus:outline-none focus:border-red-500"
            >
              {customDisorderTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={uiFormLabel}>
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={customName}
              onChange={(event) => setCustomName(event.target.value)}
              placeholder="Name the disorder…"
              className={editableInputClass(true) + " mt-0.5"}
            />
          </div>

          <div>
            <p className={uiFormLabel}>Severity <span className="text-red-500">*</span></p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {customSeverityOptions.map((option) => (
                <Chip
                  key={option}
                  as="button"
                  type="button"
                  onClick={() => setSeverity(option)}
                  className={activeCustomSeverity === option ? severityChipClass[option] : inactiveChipClass}
                >
                  {option}
                </Chip>
              ))}
            </div>
          </div>

          <FormField
            label="Notes"
            value={notes}
            onChange={setNotes}
            editable
            type="textarea"
            rows={3}
            placeholder="Optional details…"
          />
        </div>
      </PickerModal>
    );
  }

  if (selected) {
    return (
      <PickerModal
        title={selected.name}
        query=""
        onQueryChange={() => undefined}
        onClose={() => setSelected(null)}
        closeLabel="←"
        hideSearch
        isEmpty={false}
        footer={
          <Button
            className="w-full"
            onClick={() => {
              onAdd({
                id: createDisorderId(),
                referenceId: selected.id,
                type: selected.type,
                name: selected.name,
                severity: activeSeverity,
              });
              onClose();
            }}
          >
            Add Disorder
          </Button>
        }
      >
        <div className="px-4 lg:px-5 py-4 lg:py-5 space-y-4">
          <div>
            <p className={`${uiFormLabel} mb-2 text-center normal-case !text-[15px] lg:!text-base`}>Choose Severity</p>
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
            <div className={`text-center text-xs lg:text-sm ${uiTextBody} bg-slate-800/60 rounded p-3 lg:p-4 leading-relaxed`}>
              {activeSeverityDescription}
            </div>
          )}
        </div>
      </PickerModal>
    );
  }

  return (
    <PickerModal
      title="Add Disorder"
      placeholder="Search disorders..."
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      isEmpty={filtered.length === 0}
      filterRow={
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          className="w-full rounded border border-slate-500 bg-slate-900 px-2 py-1 text-xs lg:text-sm text-slate-200 focus:outline-none focus:border-red-500"
        >
          {typeOptions.map((type) => (
            <option key={type} value={type}>
              {type === "All" ? "All Disorder Types" : type}
            </option>
          ))}
        </select>
      }
      footer={
        <button
          type="button"
          onClick={() => {
            setCustomMode(true);
            setSelected(null);
            setCustomType(customDisorderTypes[0]);
            setSeverity("Minor");
            setCustomName("");
            setNotes("");
          }}
          className="w-full text-sm lg:text-base text-red-500 hover:text-red-400 text-center py-1 lg:py-1.5"
        >
          + Add custom disorder
        </button>
      }
    >
      {filtered.map((ref) => (
        <button
          key={ref.id}
          type="button"
          onClick={() => {
            setSelected(ref);
            setSeverity(ref.severityOptions[0]);
            setCustomName("");
            setNotes("");
          }}
          className="group w-full px-4 py-3 text-left transition hover:bg-slate-800 lg:px-5 lg:py-4"
        >
          <div className="flex items-center gap-1.5">
            <span className={`${uiItemName} group-hover:text-white`}>{ref.name}</span>
            <span onClick={(event) => event.stopPropagation()} className={uiInfoModalWrapper}>
              <InfoModal
                title={ref.name}
                hideTitle
                content={
                  <DisorderInfoContent
                    type={ref.type}
                    name={ref.name}
                    description={ref.description}
                    typeDescription={ref.typeDescription}
                  />
                }
              />
            </span>
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Chip size="sm" className={inactiveChipClass}>{ref.type}</Chip>
            {ref.severityOptions.map((option) => (
              <Chip key={option} size="sm" className={severityChipClass[option]}>{option}</Chip>
            ))}
          </div>
          <p className={`mt-1 line-clamp-2 text-xs lg:text-sm ${uiTextMuted}`}>{ref.description}</p>
        </button>
      ))}
    </PickerModal>
  );
}
