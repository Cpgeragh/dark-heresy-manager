import { useState } from "react";
import { InfoModal } from "../../components/InfoModal";
import {
  DIVINATION_LIST,
  findDivinationByResult,
  type DivinationData,
} from "../../data/divinationData";
import { Chip } from "../../ui/Chip";
import { uiInfoModalWrapper, uiItemName, uiTextBody } from "../../ui/editableStyles";
import { PickerModal, PickerRow } from "../../ui/PickerModal";
import { RollChip } from "../../ui/RollChip";
import { sourceColour } from "../../ui/sourceStyles";

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
      {divinations.map((divination) => (
        <PickerRow
          key={divination.id}
          selected={divination.id === selectedId}
          onClick={() => onSelect(divination)}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`${uiItemName} group-hover:text-white`}>“{divination.result}”</span>
            <span className={uiInfoModalWrapper} onClick={(event) => event.stopPropagation()}>
              <InfoModal
                title={divination.result}
                content={<DivinationInfoContent divination={divination} />}
                as="span"
              />
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <RollChip>{divination.roll}</RollChip>
            <Chip className={`bg-slate-800/40 font-code ${sourceColour(divination.source)}`}>
              {divination.source}
            </Chip>
          </div>
        </PickerRow>
      ))}
    </PickerModal>
  );
}
