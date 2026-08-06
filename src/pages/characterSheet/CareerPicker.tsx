import { useState } from "react";
import { InfoModal } from "../../components/InfoModal";
import { CAREER_LIST, type CareerData, type CareerRankData } from "../../data/careerData";
import type { HomeworldData } from "../../data/homeworldData";
import { Chip } from "../../ui/Chip";
import { colourMeta } from "../../ui/colourTokens";
import {
  uiInfoModalWrapper,
  uiItemName,
  uiTextBody,
  uiTextLabel,
  uiTextMuted,
} from "../../ui/editableStyles";
import { PickerModal, PickerRow } from "../../ui/PickerModal";
import { sourceColour } from "../../ui/sourceStyles";

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
      <blockquote className="border-l-2 border-red-700 pl-3 italic">
        <p className={`${uiTextBody} leading-relaxed`}>“{career.quote}”</p>
        <footer className={`mt-1 text-xs lg:text-sm ${uiTextMuted}`}>— {career.attribution}</footer>
      </blockquote>

      <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{career.description}</p>

      {homeworldCareer && (
        <InfoSection title={homeworldCareer.name} content={homeworldCareer.description} />
      )}

      {career.startingPsychicPowers && (
        <InfoSection title="Starting Psychic Powers" content={career.startingPsychicPowers} />
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
              <div
                key={row.result}
                className="rounded border border-slate-700 bg-slate-950/50 px-3 py-2"
              >
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
      ) &&
      career.name.toLowerCase().includes(normalizedQuery)
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
      {careers.map((career) => (
        <PickerRow
          key={career.id}
          selected={career.name === selected}
          onClick={() => onSelect(career)}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`${uiItemName} group-hover:text-white`}>{career.name}</span>
            <span className={uiInfoModalWrapper} onClick={(event) => event.stopPropagation()}>
              <InfoModal
                title={career.name}
                content={<CareerInfoContent career={career} homeworld={homeworld} />}
                as="span"
              />
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Chip className={`bg-slate-800/40 font-code ${sourceColour(career.source)}`}>
              {career.source}
            </Chip>
          </div>
        </PickerRow>
      ))}
    </PickerModal>
  );
}

export function RankPicker({
  career,
  selected,
  onSelect,
  onClose,
}: {
  career: CareerData;
  selected?: string;
  onSelect: (rank: CareerRankData) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const ranks = career.ranks
    .filter(
      (rank) =>
        rank.name.toLowerCase().includes(normalizedQuery) ||
        rank.xpLevel.toLowerCase().includes(normalizedQuery) ||
        rank.paths?.some((path) => path.toLowerCase().includes(normalizedQuery))
    )
    .sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name));

  return (
    <PickerModal
      title={`${career.name} Rank`}
      placeholder="Search ranks…"
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      isEmpty={ranks.length === 0}
    >
      {ranks.map((rank) => (
        <PickerRow key={rank.id} selected={rank.name === selected} onClick={() => onSelect(rank)}>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`${uiItemName} group-hover:text-white`}>{rank.name}</span>
            <span className={uiInfoModalWrapper} onClick={(event) => event.stopPropagation()}>
              <InfoModal
                title={rank.name}
                content={<RankInfoContent career={career} rank={rank} />}
                as="span"
              />
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Chip className={colourMeta}>Rank {rank.tier}</Chip>
            <Chip className={colourMeta}>{rank.xpLevel} XP</Chip>
            {rank.paths?.length && (
              <Chip className={colourMeta}>
                {rank.paths.length > 1 ? "Paths" : "Path"}: {rank.paths.join(" / ")}
              </Chip>
            )}
            <Chip className={`bg-slate-800/40 font-code ${sourceColour(career.source)}`}>
              {career.source}
            </Chip>
          </div>
        </PickerRow>
      ))}
    </PickerModal>
  );
}
