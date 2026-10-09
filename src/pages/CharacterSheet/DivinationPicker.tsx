import { useState } from "react";
import { InfoModal } from "../../components/InfoModal";
import {
  DIVINATION_LIST,
  findDivinationByResult,
  type DivinationData,
} from "../../data/reference/divinationData";
import { Chip } from "../../ui/chips/Chip";
import { uiTextBody } from "../../ui/styles/editableStyles";
import { PickerList, PickerModal, PickerRow } from "../../ui/pickers/PickerModal";
import { PickerRowChips, PickerRowName } from "../../ui/pickers/PickerRowParts";
import { RollChip } from "../../ui/chips/RollChip";
import { sourceColour } from "../../ui/styles/sourceStyles";

export function DivinationInfoContent({ divination }: { divination: DivinationData }) {
  return (
    <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{divination.effect}</p>
  );
}

export function DivinationPicker({
  selected,
  onSelect,
  onClose,
}: {
  selected?: string;
  onSelect: (divination: DivinationData) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const selectedId = findDivinationByResult(selected)?.id;
  const divinations = DIVINATION_LIST.filter(
    (divination) =>
      divination.result.toLowerCase().includes(normalizedQuery) ||
      divination.effect.toLowerCase().includes(normalizedQuery) ||
      divination.roll.includes(normalizedQuery)
  );

  return (
    <PickerModal
      title="Divination"
      placeholder="Search divinations…"
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      isEmpty={divinations.length === 0}
    >
      <PickerList>
        {divinations.map((divination) => (
          <PickerRow
            key={divination.id}
            selected={divination.id === selectedId}
            onClick={() => onSelect(divination)}
          >
            <PickerRowName
              name={`“${divination.result}”`}
              info={
                <InfoModal
                  title={divination.result}
                  content={<DivinationInfoContent divination={divination} />}
                  as="span"
                />
              }
            />
            <PickerRowChips>
              <RollChip>{divination.roll}</RollChip>
              <Chip className={`bg-slate-800/40 font-code ${sourceColour(divination.source)}`}>
                {divination.source}
              </Chip>
            </PickerRowChips>
          </PickerRow>
        ))}
      </PickerList>
    </PickerModal>
  );
}
