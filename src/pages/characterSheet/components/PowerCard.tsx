// src/pages/characterSheet/components/PowerCard.tsx

import { FormField } from "../../../components/FormField";
import { sectionContainerClass } from "../../../ui/editableStyles";
import type { PsychicPower } from "../../../types/Character";

interface PowerCardProps {
  power: PsychicPower;
  index: number;
  editable: boolean;
  onUpdate: (index: number, key: keyof PsychicPower, value: any) => void;
  onRemove: (index: number) => void;
}

/**
 * Reusable card component for displaying/editing a single psychic power.
 * Used for both minor and major powers.
 */
export function PowerCard({
  power,
  index,
  editable,
  onUpdate,
  onRemove,
}: PowerCardProps) {
  return (
    <div className={sectionContainerClass(editable) + " space-y-2"}>
      <div className="flex items-start justify-between gap-2">
        <FormField
          label="Power Name"
          value={power.name ?? ""}
          onChange={(v) => onUpdate(index, "name", v)}
          editable={editable}
          className="flex-1"
        />

        {editable && (
          <button
            onClick={() => onRemove(index)}
            className="text-xs text-red-400 hover:text-red-300 mt-5"
            aria-label={`Remove ${power.name || "power"}`}
          >
            Remove
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <FormField
          label="Threshold"
          value={power.threshold ?? ""}
          onChange={(v) => onUpdate(index, "threshold", v)}
          editable={editable}
          placeholder="e.g., 7"
        />

        <FormField
          label="Focus Time"
          value={power.focusTime ?? ""}
          onChange={(v) => onUpdate(index, "focusTime", v)}
          editable={editable}
          placeholder="e.g., Half Action"
        />

        <FormField
          label="Range"
          value={power.range ?? ""}
          onChange={(v) => onUpdate(index, "range", v)}
          editable={editable}
          placeholder="e.g., 20m"
        />

        <FormField
          label="Sustained"
          value={power.sustained ?? ""}
          onChange={(v) => onUpdate(index, "sustained", v)}
          editable={editable}
          placeholder="e.g., Free Action"
        />
      </div>

      <FormField
        label="Effect"
        value={power.description ?? ""}
        onChange={(v) => onUpdate(index, "description", v)}
        editable={editable}
        type="textarea"
        rows={3}
      />
    </div>
  );
}