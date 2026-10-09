import { useState } from "react";
import { InfoModal } from "../../components/InfoModal";
import { CAREER_LIST, type CareerData, type CareerRankData } from "shared-rules";
import type { HomeworldData } from "../../data/reference/homeworldData";
import { Chip } from "../../ui/chips/Chip";
import {
  uiSectionShell,
  uiTextBody,
  uiTextLabel,
  uiTextMuted,
} from "../../ui/styles/editableStyles";
import { PickerList, PickerModal, PickerRow } from "../../ui/pickers/PickerModal";
import { PickerRowChips, PickerRowName } from "../../ui/pickers/PickerRowParts";
import { sourceColour } from "../../ui/styles/sourceStyles";

function InfoSection({ title, content }: { title: string; content: string }) {
  return (
    <section>
      <p className={`${uiTextLabel} font-semibold mb-1`}>{title}</p>
      <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{content}</p>
    </section>
  );
}

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
    <div className="space-y-4">
      <blockquote className="border-l-2 border-red-700 pl-3">
        <p className={`${uiTextBody} leading-relaxed`}>“{career.quote}”</p>
        <footer className={`mt-1 text-xs lg:text-sm ${uiTextMuted}`}>— {career.attribution}</footer>
      </blockquote>

      <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{career.description}</p>

      {career.requirements?.length && (
        <InfoSection title="Requirements" content={career.requirements.join(" ")} />
      )}

      {homeworldCareer && (
        <InfoSection title={homeworldCareer.name} content={homeworldCareer.description} />
      )}

      <InfoSection title="Starting Skills" content={career.startingSkills} />
      <InfoSection title="Starting Talents" content={career.startingTalents} />
      <InfoSection title="Starting Gear" content={career.startingGear} />

      {career.startingPsychicPowers && (
        <InfoSection title="Starting Psychic Powers" content={career.startingPsychicPowers} />
      )}

      {career.startingWealth && (
        <InfoSection title="Starting Wealth" content={career.startingWealth} />
      )}

      {career.monthlyIncome && (
        <InfoSection title="Monthly Income" content={career.monthlyIncome} />
      )}

      {career.traits?.map((trait) => (
        <section key={trait.name} className="space-y-3">
          <InfoSection title={`Trait: ${trait.name}`} content={trait.description} />
          {trait.sections?.map((section) => (
            <InfoSection key={section.title} title={section.title} content={section.content} />
          ))}
        </section>
      ))}

      {career.specialTable && (
        <section>
          <p className={`${uiTextLabel} font-semibold mb-2`}>{career.specialTable.title}</p>
          <div className="space-y-2">
            {career.specialTable.rows.map((row) => (
              <div key={row.result} className={`${uiSectionShell} px-3 py-2`}>
                <p className="text-xs lg:text-sm font-code text-sky-300 mb-1">{row.result}</p>
                <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{row.effect}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export function RankInfoContent({ career, rank }: { career: CareerData; rank: CareerRankData }) {
  return (
    <div className="space-y-3">
      <InfoSection title="Career" content={career.name} />
      <InfoSection title="Rank" content={`Rank ${rank.tier}`} />
      <InfoSection title="XP Level" content={rank.xpLevel} />
      {rank.paths?.length && (
        <InfoSection
          title={rank.paths.length > 1 ? "Career Paths" : "Career Path"}
          content={rank.paths.join(" or ")}
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
  onSelect: (career: CareerData) => void;
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
              info={
                <InfoModal
                  title={career.name}
                  content={<CareerInfoContent career={career} homeworld={homeworld} />}
                  as="span"
                />
              }
            />
            <PickerRowChips>
              <Chip className={`bg-slate-800/40 font-code ${sourceColour(career.source)}`}>
                {career.source}
              </Chip>
            </PickerRowChips>
          </PickerRow>
        ))}
      </PickerList>
    </PickerModal>
  );
}
