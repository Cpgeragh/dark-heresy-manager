import { useState } from "react";
import { InfoModal } from "../../components/InfoModal";
import { SKILL_DESCRIPTIONS } from "../../data/reference/skillDescriptions";
import { TRAIT_LIST } from "../../data/reference/traitData";
import { TRAIT_DESCRIPTIONS } from "../../data/reference/traitDescriptions";
import { type HomeworldData, HOMEWORLD_LIST } from "../../data/reference/homeworldData";
import { Chip } from "../../ui/chips/Chip";
import { InfoSection, InfoTextSection } from "../../ui/InfoSection";
import {
  uiInfoModalWrapper,
  uiTextBody,
  uiTextDescription,
  uiStackBody,
  uiStackList,
  uiSplitRow,
} from "../../ui/styles/editableStyles";
import { PickerList, PickerModal, PickerRow } from "../../ui/pickers/PickerModal";
import { PickerRowChips, PickerRowName } from "../../ui/pickers/PickerRowParts";
import { RollChip } from "../../ui/chips/RollChip";
import { sourceChipColour } from "../../ui/styles/sourceStyles";

export function HomeworldInfoContent({ homeworld }: { homeworld: HomeworldData }) {
  return (
    <div className={uiStackBody}>
      <p className={uiTextDescription}>{homeworld.description}</p>

      {homeworld.skills && (
        <InfoSection heading="Skills">
          <div className={uiStackList}>
            {homeworld.skills.map((skill) => (
              <div key={skill.name} className={uiSplitRow}>
                <div className="flex min-w-0 items-center gap-1.5">
                  <span className={`text-sm lg:text-base ${uiTextBody}`}>{skill.name}</span>
                  {SKILL_DESCRIPTIONS[skill.name] && (
                    <span className={uiInfoModalWrapper}>
                      <InfoModal
                        title={skill.name}
                        content={SKILL_DESCRIPTIONS[skill.name]}
                        as="span"
                      />
                    </span>
                  )}
                </div>
                <span className={`shrink-0 text-xs lg:text-sm ${uiTextBody}`}>{skill.rule}</span>
              </div>
            ))}
          </div>
        </InfoSection>
      )}

      <InfoSection heading="Traits">
        <div className={uiStackList}>
          {homeworld.traits.map((trait) => {
            const traitData = TRAIT_LIST.find(
              (entry) => entry.name === trait.name && entry.source === homeworld.source
            );
            const description = traitData && TRAIT_DESCRIPTIONS[traitData.id];

            return (
              <div key={trait.name} className="flex min-w-0 items-center gap-1.5">
                <span className={`text-sm lg:text-base ${uiTextBody}`}>{trait.name}</span>
                {description && (
                  <span className={uiInfoModalWrapper}>
                    <InfoModal title={trait.name} content={description} as="span" />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </InfoSection>

      {homeworld.sections?.map((section) => (
        <InfoTextSection key={section.title} heading={section.title} text={section.content} />
      ))}
    </div>
  );
}

export function HomeworldPicker({
  selected,
  onSelect,
  onClose,
}: {
  selected?: string;
  onSelect: (homeworld: HomeworldData) => void | Promise<boolean | void>;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const homeworlds = HOMEWORLD_LIST.filter(
    (homeworld) =>
      homeworld.name.toLowerCase().includes(normalizedQuery) ||
      homeworld.description.toLowerCase().includes(normalizedQuery)
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <PickerModal
      title="Homeworld"
      placeholder="Search homeworlds…"
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      isEmpty={homeworlds.length === 0}
    >
      <PickerList>
        {homeworlds.map((homeworld) => (
          <PickerRow
            key={homeworld.id}
            selected={homeworld.id === selected}
            onClick={() => onSelect(homeworld)}
          >
            <PickerRowName
              name={homeworld.name}
              infoTitle={homeworld.name}
              information={<HomeworldInfoContent homeworld={homeworld} />}
            />
            <PickerRowChips>
              <RollChip>{homeworld.roll}</RollChip>
              <Chip colour={sourceChipColour(homeworld.source)} className="font-code">
                {homeworld.source}
              </Chip>
            </PickerRowChips>
          </PickerRow>
        ))}
      </PickerList>
    </PickerModal>
  );
}
