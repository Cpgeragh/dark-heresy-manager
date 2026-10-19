import { editableTextareaClass, uiFormLabel } from "../styles/editableStyles";

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
        <label htmlFor={`${idPrefix}-description`} className={uiFormLabel}>
          Description
        </label>
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
        <label htmlFor={`${idPrefix}-rules`} className={uiFormLabel}>
          Rules
        </label>
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
