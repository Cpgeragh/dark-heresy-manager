import { RequiredFormLabel } from "./RequiredFormLabel";
import { sourceColour } from "../styles/sourceStyles";
import { toggleButtonClass } from "../buttons/ToggleButton";
import { CUSTOM_ITEM_ORIGIN_OPTIONS, type CustomItemOrigin } from "../../constants/customItems";
import { colourFillSelected } from "../styles/colourTokens";

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
    <fieldset className={`${hideLabel ? "" : "space-y-1"} ${className}`.trim()} disabled={disabled}>
      <RequiredFormLabel as="legend" className={hideLabel ? "sr-only" : ""}>
        Origin
      </RequiredFormLabel>
      <div className="grid grid-cols-2 gap-1.5">
        {CUSTOM_ITEM_ORIGIN_OPTIONS.map((option) => {
          const selected = value === option;

          return (
            <label
              key={option}
              className={toggleButtonClass(
                selected,
                `${sourceColour(option)} ${colourFillSelected} font-semibold`,
                [
                  "relative cursor-pointer text-center text-xs lg:text-sm px-2 lg:px-3 py-1 lg:py-1.5",
                  "focus-within:outline-none focus-within:ring-2 focus-within:ring-red-500",
                  disabled ? "cursor-not-allowed opacity-50" : "",
                ].join(" ")
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
