import { editableTextareaClass } from "../styles/editableStyles";
import { FormLabel } from "./FormLabel";

interface DescriptionAndRulesFieldsProps {
  idPrefix: string;
  description: string;
  onDescriptionChange: (value: string) => void;
  rules: string;
  onRulesChange: (value: string) => void;
  descriptionPlaceholder?: string;
  rulesPlaceholder?: string;
}

/** The Description and Rules text boxes every custom item form shares, for use inside a two column grid. */
export function DescriptionAndRulesFields({
  idPrefix,
  description,
  onDescriptionChange,
  rules,
  onRulesChange,
  descriptionPlaceholder,
  rulesPlaceholder = "What it does in play, such as modifiers or special effects...",
}: DescriptionAndRulesFieldsProps) {
  return (
    <>
      <div className="col-span-2">
        <FormLabel htmlFor={`${idPrefix}-description`}>Description</FormLabel>
        <textarea
          id={`${idPrefix}-description`}
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          placeholder={descriptionPlaceholder}
          rows={3}
          className={editableTextareaClass(true) + " mt-0.5"}
          autoComplete="off"
        />
      </div>
      <div className="col-span-2">
        <FormLabel htmlFor={`${idPrefix}-rules`}>Rules</FormLabel>
        <textarea
          id={`${idPrefix}-rules`}
          value={rules}
          onChange={(event) => onRulesChange(event.target.value)}
          placeholder={rulesPlaceholder}
          rows={3}
          className={editableTextareaClass(true) + " mt-0.5"}
          autoComplete="off"
        />
      </div>
    </>
  );
}
