// src/pages/CampaignOverview/BeginSessionForm.tsx

import { useState, useCallback, useRef } from "react";
import { useToast } from "../../components/Toast";
import { CustomFormSection } from "../../ui/forms/CustomFormSection";
import { CustomFormShell } from "../../ui/forms/CustomFormShell";
import { FormLabel } from "../../ui/forms/FormLabel";
import { RequiredMark } from "../../ui/forms/RequiredMark";
import { AttendeePicker } from "./AttendeePicker";
import { editableInputClass } from "../../ui/styles/editableStyles";

interface Character {
  id: string;
  characterName: string;
}

interface Props {
  characters: Character[];
  onBegin: (date: string, attendees: string[]) => Promise<void>;
  onClose: () => void;
}

export function BeginSessionForm({ characters, onBegin, onClose }: Props) {
  const toast = useToast();
  const scrollPositionRef = useRef(0);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendees, setAttendees] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const handleBegin = useCallback(async () => {
    if (savingRef.current || !date) return;
    savingRef.current = true;
    setSaving(true);
    try {
      await onBegin(date, attendees);
      toast.success("Session begun");
      onClose();
    } catch (err) {
      console.error("Session begin error:", err);
      toast.error(err instanceof Error && err.message ? err.message : "Failed to begin session");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [date, attendees, onBegin, toast, onClose]);

  return (
    <CustomFormShell
      title="Begin Session"
      scrollPositionRef={scrollPositionRef}
      onClose={onClose}
      canSubmit={Boolean(date) && attendees.length > 0}
      submitLabel="Begin Session"
      onSubmit={handleBegin}
      saving={saving}
    >
      <CustomFormSection title="Session">
        <div>
          <FormLabel htmlFor="begin-session-date" required>
            Date
          </FormLabel>
          <input
            id="begin-session-date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`${editableInputClass(true)} mt-0.5`}
            autoComplete="off"
          />
        </div>
      </CustomFormSection>
      <CustomFormSection
        title={
          <>
            Attendees <RequiredMark />
          </>
        }
      >
        <AttendeePicker characters={characters} selected={attendees} onChange={setAttendees} />
      </CustomFormSection>
    </CustomFormShell>
  );
}
