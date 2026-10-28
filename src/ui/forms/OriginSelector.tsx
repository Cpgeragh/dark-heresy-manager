import { FormLabel } from "./FormLabel";
import { sourceChipColour } from "../styles/sourceStyles";
import { toggleButtonClass } from "../buttons/ToggleButton";
import { CUSTOM_ITEM_ORIGIN_OPTIONS, type CustomItemOrigin } from "../../constants/customItems";
import { colourToggleSelected } from "../styles/colourTokens";
import { uiDisabledLook, uiFocusWithinRing } from "../styles/buttonStyles";
import { uiOptionGrid, uiStackField } from "../styles/editableStyles";

interface OriginSelectorProps {
  name: string;
  value: CustomItemOrigin | "";
  onChange: (value: CustomItemOrigin) => void;
  disabled?: boolean;
  hideLabel?: boolean;
  className?: string;
}

/** Shared required origin choice for custom-item forms. */
export function OriginSelector({
  name,
  value,
  onChange,
  disabled = false,
  hideLabel = false,
  className = "",
}: OriginSelectorProps) {
  return (
    <fieldset
      className={`${hideLabel ? "" : uiStackField} ${className}`.trim()}
      disabled={disabled}
    >
      <FormLabel as="legend" required className={hideLabel ? "sr-only" : ""}>
        Origin
      </FormLabel>
      <div className={`${uiOptionGrid} grid-cols-2`}>
        {CUSTOM_ITEM_ORIGIN_OPTIONS.map((option) => {
          const selected = value === option;

          return (
            <label
              key={option}
              className={toggleButtonClass(
                selected,
                colourToggleSelected[sourceChipColour(option)],
                [
                  "relative cursor-pointer text-center text-xs lg:text-sm px-2 lg:px-3 py-1 lg:py-1.5",
                  uiFocusWithinRing,
                  disabled ? uiDisabledLook : "",
                ].join(" "),
                !disabled
              )}
            >
              <input
                type="radio"
                name={name}
                value={option}
                checked={selected}
                required
                disabled={disabled}
                onChange={() => onChange(option)}
                className="sr-only"
              />
              {option}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
