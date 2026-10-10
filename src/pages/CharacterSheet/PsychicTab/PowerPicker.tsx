import { useRef, useState } from "react";
import type { PsychicPower } from "../../../types/Character";
import {
  PSYCHIC_DISCIPLINES,
  PSYCHIC_POWER_REFERENCE,
  getPsychicPowerDescription,
  type PsychicPowerRef,
} from "../../../data/reference/psychicReference";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { Chip } from "../../../ui/chips/Chip";
import { ArrowLeft } from "../../../ui/icons/PickerArrows";
import { FilterButton } from "../../../ui/pickers/FilterButton";
import { OptionPickerScreen } from "../../../ui/pickers/OptionPickerScreen";
import { PickerCustomAction, PickerList, PickerModal } from "../../../ui/pickers/PickerModal";
import { PowerCard } from "./PowerCard";
import { normalisePowerName } from "./psychicPowerHelpers";
import { recordComponentRender } from "../../../performance/performanceMetrics";

function referencePowerPreview(ref: PsychicPowerRef): PsychicPower {
  return {
    id: ref.id,
    name: ref.name,
    discipline: ref.discipline,
    threshold: String(ref.threshold),
    focusTime: ref.focusTime,
    sustained: ref.sustained ? "Yes" : "No",
    range: ref.range,
    description: getPsychicPowerDescription(ref),
    source: ref.source,
    isMinor: ref.discipline === "Minor",
    known: true,
  };
}

function customPowerPreview(item: CampaignCustomItem<"power">): PsychicPower {
  return {
    ...item.data,
    id: item.id,
    name: item.name,
    known: true,
  };
}

export function PowerPicker({
  excludeMinor = false,
  minorOnly = false,
  editable = true,
  existingNames,
  customItems,
  onSelect,
  onSelectCustomItem,
  onCustom,
  onClose,
  backToRoutes = false,
  suspended = false,
  requiredDiscipline,
  selectionLocked = false,
}: {
  excludeMinor?: boolean;
  minorOnly?: boolean;
  editable?: boolean;
  existingNames: Set<string>;
  customItems: CampaignCustomItem<"power">[];
  onSelect: (ref: PsychicPowerRef) => void;
  onSelectCustomItem: (item: CampaignCustomItem<"power">) => void;
  onCustom: () => void;
  onClose: () => void;
  backToRoutes?: boolean;
  suspended?: boolean;
  requiredDiscipline?: string;
  selectionLocked?: boolean;
}) {
  recordComponentRender("PowerPicker");
  const [query, setQuery] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [showDisciplineFilterPicker, setShowDisciplineFilterPicker] = useState(false);
  const [showSourceFilterPicker, setShowSourceFilterPicker] = useState(false);
  const listScrollPositionRef = useRef(0);

  const scopedReference = PSYCHIC_POWER_REFERENCE.filter((r) => {
    const notMinor = !excludeMinor || r.discipline !== "Minor";
    const onlyMinor = !minorOnly || r.discipline === "Minor";
    const correctDiscipline = !requiredDiscipline || r.discipline === requiredDiscipline;
    return notMinor && onlyMinor && correctDiscipline;
  });

  const majorDisciplineOptions = PSYCHIC_DISCIPLINES.filter((d) => d !== "Minor");
  const sourceOptions = Array.from(new Set(scopedReference.map((r) => r.source))).sort();

  const filtered = scopedReference
    .filter((r) => r.name.toLowerCase().includes(query.toLowerCase()))
    .filter((r) => !disciplineFilter || r.discipline === disciplineFilter)
    .filter((r) => !sourceFilter || r.source === sourceFilter)
    .filter((r) => !existingNames.has(normalisePowerName(r.name)))
    .sort((a, b) => a.name.localeCompare(b.name));

  const filteredCustom = customItems
    .filter((item) => item.status !== "archived")
    .filter((item) => (excludeMinor ? !item.data.isMinor : minorOnly ? item.data.isMinor : true))
    .filter((item) => !requiredDiscipline || item.data.discipline === requiredDiscipline)
    .filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))
    .filter((item) => !disciplineFilter || item.data.discipline === disciplineFilter)
    .filter((item) => !sourceFilter || (item.data.source ?? item.data.origin) === sourceFilter)
    .filter((item) => !existingNames.has(normalisePowerName(item.name)))
    .sort((a, b) => a.name.localeCompare(b.name));

  const pickerItems = [
    ...filteredCustom.map((item) => ({ kind: "custom" as const, name: item.name, item })),
    ...filtered.map((ref) => ({ kind: "reference" as const, name: ref.name, ref })),
  ].sort((a, b) => a.name.localeCompare(b.name));

  if (showDisciplineFilterPicker) {
    return (
      <OptionPickerScreen
        title="Discipline"
        options={["All Disciplines", ...majorDisciplineOptions]}
        selected={disciplineFilter ?? "All Disciplines"}
        onSelect={(value) => {
          setDisciplineFilter(value === "All Disciplines" ? null : value);
          setShowDisciplineFilterPicker(false);
        }}
        onClose={() => setShowDisciplineFilterPicker(false)}
      />
    );
  }
  if (showSourceFilterPicker) {
    return (
      <OptionPickerScreen
        title="Source"
        options={["All Sources", ...sourceOptions, "Custom", "2nd Ed"]}
        selected={sourceFilter ?? "All Sources"}
        onSelect={(value) => {
          setSourceFilter(value === "All Sources" ? null : value);
          setShowSourceFilterPicker(false);
        }}
        onClose={() => setShowSourceFilterPicker(false)}
      />
    );
  }

  return (
    <PickerModal
      title={editable ? "Add Psychic Power" : "View Psychic Powers"}
      placeholder="Search powers…"
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      closeLabel={backToRoutes ? <ArrowLeft /> : undefined}
      closeAriaLabel={backToRoutes ? "Back" : "Close"}
      suspended={suspended}
      scrollPositionRef={listScrollPositionRef}
      isEmpty={filtered.length === 0 && filteredCustom.length === 0}
      filterRow={
        <div className="flex flex-wrap gap-2 w-full">
          {!minorOnly && !requiredDiscipline && (
            <FilterButton className="flex-1" onClick={() => setShowDisciplineFilterPicker(true)}>
              {disciplineFilter ?? "All Disciplines"}
            </FilterButton>
          )}
          <FilterButton className="flex-1" onClick={() => setShowSourceFilterPicker(true)}>
            {sourceFilter ?? "All Sources"}
          </FilterButton>
          {selectionLocked && (
            <Chip colour="amber">
              All selections used
            </Chip>
          )}
        </div>
      }
      footer={
        editable && !selectionLocked ? (
          <PickerCustomAction onClick={onCustom}>
            {minorOnly ? "Custom Minor Power" : "Custom Major Power"}
          </PickerCustomAction>
        ) : undefined
      }
    >
      <PickerList>
        {pickerItems.map((entry) =>
          entry.kind === "custom" ? (
            <PowerCard
              key={`custom-${entry.item.id}`}
              power={customPowerPreview(entry.item)}
              editable={false}
              onRemove={() => undefined}
              onSelect={
                editable && !selectionLocked ? () => onSelectCustomItem(entry.item) : undefined
              }
              selectLabel={`Select ${entry.item.name}`}
            />
          ) : (
            <PowerCard
              key={`reference-${entry.ref.id}`}
              power={referencePowerPreview(entry.ref)}
              editable={false}
              onRemove={() => undefined}
              onSelect={editable && !selectionLocked ? () => onSelect(entry.ref) : undefined}
              selectLabel={`Select ${entry.ref.name}`}
            />
          )
        )}
      </PickerList>
    </PickerModal>
  );
}
