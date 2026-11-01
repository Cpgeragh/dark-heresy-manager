import type { ReactNode } from "react";
import { EntryDetailLine } from "./EntryDetailLine";

export interface EntryLine {
  value?: ReactNode;
  info?: ReactNode;
}

/** The labelled lines of an owned entry. A line the caller supplies shows a dash when it is empty. */
export interface OwnedEntryLines {
  craftsmanship?: EntryLine;
  duration?: EntryLine;
  qualities?: EntryLine;
  rules?: EntryLine;
  mishaps?: EntryLine;
  gainedFrom?: string;
  talentEffects?: string;
  notes?: EntryLine;
}

/** The labelled lines of an owned entry, always in the one fixed order. */
export function EntryLines({ lines }: { lines: OwnedEntryLines }) {
  return (
    <>
      {lines.craftsmanship && <EntryDetailLine label="Craftsmanship" {...lines.craftsmanship} />}
      {lines.duration && <EntryDetailLine label="Duration" {...lines.duration} />}
      {lines.qualities && <EntryDetailLine label="Qualities" {...lines.qualities} />}
      {lines.rules && <EntryDetailLine label="Rules" {...lines.rules} />}
      {lines.mishaps && <EntryDetailLine label="Mishaps" {...lines.mishaps} />}
      {lines.gainedFrom && <EntryDetailLine label="Gained from" value={lines.gainedFrom} />}
      {lines.talentEffects && (
        <EntryDetailLine label="Talent effects" value={lines.talentEffects} />
      )}
      {lines.notes && <EntryDetailLine label="Notes" {...lines.notes} />}
    </>
  );
}
