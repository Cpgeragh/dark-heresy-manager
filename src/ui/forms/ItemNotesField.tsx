import { editableTextareaClass } from "../styles/editableStyles";
import { FormLabel } from "./FormLabel";

interface ItemNotesFieldProps {
  idPrefix: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/** The Notes text box every custom item form shares: why the item exists and any limits on its use. */
export function ItemNotesField({
  idPrefix,
  value,
  onChange,
  className = "col-span-2",
}: ItemNotesFieldProps) {
  return (
    <div className={className}>
      <FormLabel htmlFor={`${idPrefix}-notes`}>Notes</FormLabel>
      <textarea
        id={`${idPrefix}-notes`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Why it exists and any limits on its use..."
        rows={3}
        className={editableTextareaClass(true) + " mt-0.5"}
        autoComplete="off"
      />
    </div>
  );
}
