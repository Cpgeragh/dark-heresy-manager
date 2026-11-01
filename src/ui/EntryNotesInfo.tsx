import { useState } from "react";
import { InfoModal } from "../components/InfoModal";
import { usePersonalNotesSaver } from "../context/usePersonalNotesSaver";
import type { PersonalNotesTarget } from "./entryNotesLine";
import { EditButton } from "./buttons/EditButton";
import { PersonalNotesForm } from "./forms/PersonalNotesForm";
import { InfoParagraph, InfoSection } from "./InfoSection";
import { uiStackBody, uiTextPlaceholder } from "./styles/editableStyles";

interface EntryNotesInfoProps {
  name: string;
  itemNotes?: string;
  target: PersonalNotesTarget;
}

export function EntryNotesInfo({ name, itemNotes, target }: EntryNotesInfoProps) {
  const savePersonalNotes = usePersonalNotesSaver();
  const [editing, setEditing] = useState(false);
  const personalNotes = target.notes?.trim();

  return (
    <>
      <InfoModal
        title={`${name} Notes`}
        suspended={editing}
        content={
          <div className={uiStackBody}>
            {itemNotes && (
              <InfoSection heading="Item Note">
                <InfoParagraph>{itemNotes}</InfoParagraph>
              </InfoSection>
            )}
            <InfoSection
              heading="Personal Notes"
              action={
                target.editable && savePersonalNotes ? (
                  <EditButton
                    label={`Edit personal notes for ${name}`}
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      setEditing(true);
                    }}
                  />
                ) : undefined
              }
            >
              {personalNotes ? (
                <InfoParagraph>{personalNotes}</InfoParagraph>
              ) : (
                <p className={uiTextPlaceholder}>No personal notes recorded.</p>
              )}
            </InfoSection>
          </div>
        }
      />
      {editing && savePersonalNotes && (
        <PersonalNotesForm
          value={target.notes ?? ""}
          onSave={(text) => savePersonalNotes(target.collection, target.id, text)}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
}
