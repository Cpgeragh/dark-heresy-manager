// src/pages/characterSheet/BackgroundTab.tsx

import { useCallback } from "react";
import type { CharacterHeader, TalentsAndTraitsBlock } from "../../types/Character";
import { FormField } from "../../components/FormField";
import { editableInputClass, uiSection } from "../../ui/editableStyles";
import { SectionHeader } from "../../ui/SectionHeader";
import { HOMEWORLD_LIST } from "../../data/homeworldData";

interface BackgroundTabProps {
  header: CharacterHeader;
  talents: TalentsAndTraitsBlock;
  editable: boolean;
  /** Owner's first name, derived from their account profile. Read-only. */
  playerName: string | null;
  onUpdateHeader: (next: CharacterHeader) => void;
  onUpdateTalents: (next: TalentsAndTraitsBlock) => void;
}

export function BackgroundTab({
  header,
  talents,
  editable,
  playerName,
  onUpdateHeader,
  onUpdateTalents,
}: BackgroundTabProps) {
  const selectedHomeworld = HOMEWORLD_LIST.find((hw) => hw.id === talents.homeworld);

  // ── Header field helpers ───────────────────────────────────────────────────
  const updateHeaderField = useCallback(
    <K extends keyof CharacterHeader>(key: K, value: CharacterHeader[K]) => {
      onUpdateHeader({ ...header, [key]: value });
    },
    [header, onUpdateHeader]
  );

  const handleCharacterName = useCallback(
    (v: string) => updateHeaderField("characterName", v),
    [updateHeaderField]
  );
  const handleCareer = useCallback(
    (v: string) => updateHeaderField("career", v),
    [updateHeaderField]
  );
  const handleRank = useCallback((v: string) => updateHeaderField("rank", v), [updateHeaderField]);
  const handleDivination = useCallback(
    (v: string) => updateHeaderField("divination", v),
    [updateHeaderField]
  );
  const handleDescription = useCallback(
    (v: string) => updateHeaderField("description", v),
    [updateHeaderField]
  );

  // ── Talent / homeworld helpers ─────────────────────────────────────────────
  const handleHomeworldChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (!editable) return;
      onUpdateTalents({ ...talents, homeworld: e.target.value });
    },
    [editable, talents, onUpdateTalents]
  );

  const handleBackgroundNotes = useCallback(
    (v: string) => {
      if (!editable) return;
      onUpdateTalents({ ...talents, homeworldNotes: v });
    },
    [editable, talents, onUpdateTalents]
  );

  return (
    <div className="space-y-6 text-slate-100">
      {/* IDENTITY */}
      <div>
        <SectionHeader className="mb-3">Identity</SectionHeader>
        <section className={uiSection + " space-y-3"}>
          <FormField
            label="Character Name"
            value={header.characterName ?? ""}
            onChange={handleCharacterName}
            editable={editable}
            placeholder="e.g. Brother Corvus"
          />
          <FormField
            label="Player Name"
            value={playerName ?? ""}
            onChange={() => {}}
            editable={false}
            placeholder="Set from the player's account"
            description="Taken from the player's account name."
          />
        </section>
      </div>

      {/* CAREER */}
      <div>
        <SectionHeader className="mb-3">Career</SectionHeader>
        <section className={uiSection}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              label="Career"
              value={header.career ?? ""}
              onChange={handleCareer}
              editable={editable}
              placeholder="e.g. Guardsman"
            />
            <FormField
              label="Rank"
              value={header.rank ?? ""}
              onChange={handleRank}
              editable={editable}
              placeholder="e.g. Trooper"
            />
          </div>
        </section>
      </div>

      {/* DIVINATION */}
      <div>
        <SectionHeader className="mb-3">Divination</SectionHeader>
        <section className={uiSection}>
          <FormField
            label="Divination"
            value={header.divination ?? ""}
            onChange={handleDivination}
            editable={editable}
            placeholder="e.g. Trust in your fear."
          />
        </section>
      </div>

      {/* APPEARANCE */}
      <div>
        <SectionHeader className="mb-3">Appearance</SectionHeader>
        <section className={uiSection}>
          <FormField
            label="Description"
            value={header.description ?? ""}
            onChange={handleDescription}
            editable={editable}
            type="textarea"
            rows={4}
            placeholder="Physical appearance, mannerisms, distinguishing features…"
          />
        </section>
      </div>

      {/* HOMEWORLD */}
      <div>
        <SectionHeader className="mb-3">Homeworld</SectionHeader>
        <section className={uiSection + " space-y-3"}>
          <div className="flex flex-col gap-1">
            <select
              disabled={!editable}
              value={talents.homeworld}
              onChange={handleHomeworldChange}
              className={editableInputClass(editable) + " appearance-none"}
            >
              <option value="">— Select homeworld —</option>
              {[...HOMEWORLD_LIST]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((hw) => (
                  <option key={hw.id} value={hw.id}>
                    {hw.name} ({hw.source})
                  </option>
                ))}
            </select>
            {selectedHomeworld && (
              <p className="text-xs lg:text-sm text-slate-100 italic px-1 mt-1">
                {selectedHomeworld.description}
              </p>
            )}
          </div>

          <FormField
            label="Background Notes"
            value={talents.homeworldNotes ?? ""}
            onChange={handleBackgroundNotes}
            editable={editable}
            type="textarea"
            rows={4}
            placeholder="Origin story, connections, history…"
          />
        </section>
      </div>
    </div>
  );
}
