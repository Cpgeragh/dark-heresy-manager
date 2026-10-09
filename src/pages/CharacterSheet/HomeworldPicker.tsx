import { useState } from "react";
import { InfoModal } from "../../components/InfoModal";
import { SKILL_DESCRIPTIONS } from "../../data/reference/skillDescriptions";
import { TRAIT_LIST } from "../../data/reference/traitData";
import { TRAIT_DESCRIPTIONS } from "../../data/reference/traitDescriptions";
import { type HomeworldData, HOMEWORLD_LIST } from "../../data/reference/homeworldData";
import { Chip } from "../../ui/chips/Chip";
import {
  uiInfoModalWrapper,
  uiTextBody,
  uiTextLabel,
  uiTextMuted,
} from "../../ui/styles/editableStyles";
import { PickerList, PickerModal, PickerRow } from "../../ui/pickers/PickerModal";
import { PickerRowChips, PickerRowName } from "../../ui/pickers/PickerRowParts";
import { RollChip } from "../../ui/chips/RollChip";
import { sourceColour } from "../../ui/styles/sourceStyles";

function InfoSection({ title, content }: { title: string; content: string }) {
  return (
    <section>
      <p className={`${uiTextLabel} font-semibold mb-1`}>{title}</p>
      <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{content}</p>
    </section>
  );
}

export function HomeworldInfoContent({ homeworld }: { homeworld: HomeworldData }) {
  return (
    <div className="space-y-4">
      <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>
        {homeworld.description}
      </p>

      {homeworld.skills && (
        <section className="space-y-2">
          <p className={`${uiTextLabel} font-semibold`}>Skills</p>
          {homeworld.skills.map((skill) => (
            <div key={skill.name} className="flex items-center justify-between gap-3">
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
              <span className={`shrink-0 text-xs lg:text-sm ${uiTextMuted}`}>{skill.rule}</span>
            </div>
          ))}
        </section>
      )}

      <section className="space-y-2">
        <p className={`${uiTextLabel} font-semibold`}>Traits</p>
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
      </section>

      {homeworld.sections?.map((section) => (
        <InfoSection key={section.title} title={section.title} content={section.content} />
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
  onSelect: (homeworld: HomeworldData) => void;
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
              info={
                <InfoModal
                  title={homeworld.name}
                  content={<HomeworldInfoContent homeworld={homeworld} />}
                  as="span"
                />
              }
            />
            <PickerRowChips>
              <RollChip>{homeworld.roll}</RollChip>
              <Chip className={`bg-slate-800/40 font-code ${sourceColour(homeworld.source)}`}>
                {homeworld.source}
              </Chip>
            </PickerRowChips>
          </PickerRow>
        ))}
      </PickerList>
    </PickerModal>
  );
}
