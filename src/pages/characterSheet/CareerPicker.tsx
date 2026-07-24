import { useState } from "react";
import { InfoModal } from "../../components/InfoModal";
import { CAREER_LIST, type CareerData, type CareerRankData } from "../../data/careerData";
import {
  uiInfoModalWrapper,
  uiItemName,
  uiTextBody,
  uiTextLabel,
  uiTextMuted,
} from "../../ui/editableStyles";
import { PickerModal, PickerRow } from "../../ui/PickerModal";

function InfoSection({ title, content }: { title: string; content: string }) {
  return (
    <section>
      <p className={`${uiTextLabel} font-semibold mb-1`}>{title}</p>
      <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{content}</p>
    </section>
  );
}

export function CareerInfoContent({ career }: { career: CareerData }) {
  return (
    <div className="space-y-4">
      <blockquote className="border-l-2 border-red-700 pl-3 italic">
        <p className={`${uiTextBody} leading-relaxed`}>“{career.quote}”</p>
        <footer className={`mt-1 text-xs lg:text-sm ${uiTextMuted}`}>— {career.attribution}</footer>
      </blockquote>

      <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{career.description}</p>

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
  onSelect,
  onClose,
}: {
  selected?: string;
  onSelect: (career: CareerData) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const careers = CAREER_LIST.filter((career) =>
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
                content={<CareerInfoContent career={career} />}
                as="span"
              />
            </span>
          </div>
          <p className={`mt-1 text-xs lg:text-sm ${uiTextMuted}`}>
            Starting Rank: {career.startingRank} · {career.source}
          </p>
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
          <p className={`mt-1 text-xs lg:text-sm ${uiTextMuted}`}>
            Rank {rank.tier} · {rank.xpLevel} XP
            {rank.paths?.length ? ` · ${rank.paths.join(" / ")} path` : ""}
          </p>
        </PickerRow>
      ))}
    </PickerModal>
  );
}
