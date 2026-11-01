import { useState } from "react";
import { CAREER_LIST, type CareerData, type CareerRankData } from "shared-rules";
import type { HomeworldData } from "../../data/reference/homeworldData";
import { Chip } from "../../ui/chips/Chip";
import { InfoSection, InfoTextSection } from "../../ui/InfoSection";
import {
  uiSectionShell,
  uiTextBody,
  uiTextDescription,
  uiStackBody,
  uiStackList,
} from "../../ui/styles/editableStyles";
import { PickerList, PickerModal, PickerRow } from "../../ui/pickers/PickerModal";
import { PickerRowChips, PickerRowName } from "../../ui/pickers/PickerRowParts";
import { sourceChipColour } from "../../ui/styles/sourceStyles";
import { colourMetadataLabelText, colourAccentBar } from "../../ui/styles/colourTokens";

export function CareerInfoContent({
  career,
  homeworld,
}: {
  career: CareerData;
  homeworld?: HomeworldData;
}) {
  const homeworldCareer = homeworld?.careers.find(
    (entry) => (entry.careerName ?? entry.name) === career.name
  );

  return (
    <div className={uiStackBody}>
      <blockquote className={`border-l-2 ${colourAccentBar} pl-3`}>
        <p className={`${uiTextBody} leading-relaxed`}>“{career.quote}”</p>
        <footer className={`mt-1 text-xs lg:text-sm ${uiTextBody}`}>— {career.attribution}</footer>
      </blockquote>

      <p className={uiTextDescription}>{career.description}</p>

      {career.requirements?.length && (
        <InfoTextSection heading="Requirements" text={career.requirements.join(" ")} />
      )}

      {homeworldCareer && (
        <InfoTextSection heading={homeworldCareer.name} text={homeworldCareer.description} />
      )}

      <InfoTextSection heading="Starting Skills" text={career.startingSkills} />
      <InfoTextSection heading="Starting Talents" text={career.startingTalents} />
      <InfoTextSection heading="Starting Gear" text={career.startingGear} />

      {career.startingPsychicPowers && (
        <InfoTextSection heading="Starting Psychic Powers" text={career.startingPsychicPowers} />
      )}

      {career.startingWealth && (
        <InfoTextSection heading="Starting Wealth" text={career.startingWealth} />
      )}

      {career.monthlyIncome && (
        <InfoTextSection heading="Monthly Income" text={career.monthlyIncome} />
      )}

      {career.traits?.map((trait) => (
        <section key={trait.name} className={uiStackBody}>
          <InfoTextSection heading={`Trait: ${trait.name}`} text={trait.description} />
          {trait.sections?.map((section) => (
            <InfoTextSection key={section.title} heading={section.title} text={section.content} />
          ))}
        </section>
      ))}

      {career.specialTable && (
        <InfoSection heading={career.specialTable.title}>
          <div className={uiStackList}>
            {career.specialTable.rows.map((row) => (
              <div key={row.result} className={`${uiSectionShell} px-3 py-2`}>
                <p className={`text-xs lg:text-sm font-code ${colourMetadataLabelText} mb-1`}>
                  {row.result}
                </p>
                <p className={uiTextDescription}>{row.effect}</p>
              </div>
            ))}
          </div>
        </InfoSection>
      )}
    </div>
  );
}

export function RankInfoContent({ career, rank }: { career: CareerData; rank: CareerRankData }) {
  return (
    <div className={uiStackBody}>
      <InfoTextSection heading="Career" text={career.name} />
      <InfoTextSection heading="Rank" text={`Rank ${rank.tier}`} />
      <InfoTextSection heading="XP Level" text={rank.xpLevel} />
      {rank.paths?.length && (
        <InfoTextSection
          heading={rank.paths.length > 1 ? "Career Paths" : "Career Path"}
          text={rank.paths.join(" or ")}
        />
      )}
    </div>
  );
}

export function CareerPicker({
  selected,
  homeworld,
  onSelect,
  onClose,
}: {
  selected?: string;
  homeworld: HomeworldData;
  onSelect: (career: CareerData) => void | Promise<boolean | void>;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const careers = CAREER_LIST.filter(
    (career) =>
      homeworld.careers.some(
        (homeworldCareer) => (homeworldCareer.careerName ?? homeworldCareer.name) === career.name
      ) && career.name.toLowerCase().includes(normalizedQuery)
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <PickerModal
      title="Career"
      placeholder="Search careers…"
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      isEmpty={careers.length === 0}
    >
      <PickerList>
        {careers.map((career) => (
          <PickerRow
            key={career.id}
            selected={career.name === selected}
            onClick={() => onSelect(career)}
          >
            <PickerRowName
              name={career.name}
              infoTitle={career.name}
              information={<CareerInfoContent career={career} homeworld={homeworld} />}
            />
            <PickerRowChips>
              <Chip colour={sourceChipColour(career.source)} className="font-code">
                {career.source}
              </Chip>
            </PickerRowChips>
          </PickerRow>
        ))}
      </PickerList>
    </PickerModal>
  );
}
