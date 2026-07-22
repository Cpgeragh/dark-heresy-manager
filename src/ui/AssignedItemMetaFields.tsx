import type { ReactNode } from "react";
import { sanitizeMoneyInput } from "./moneyFormat";
import { ArrowRight } from "./PickerArrows";
import { editableInputClass, uiFormLabel, uiTextBody } from "./editableStyles";

export interface AssignedItemMetaFieldsProps {
  itemName: string;
  explanation: ReactNode;
  gmCost: string;
  setGmCost: (value: string) => void;
  costValid: boolean;
  costPlaceholder: string;
  requiresRarity: boolean;
  gmRarity: string;
  onOpenRarityPicker: () => void;
  idPrefix?: string;
}

export function AssignedItemMetaFields({
  itemName,
  explanation,
  gmCost,
  setGmCost,
  costValid,
  costPlaceholder,
  requiresRarity,
  gmRarity,
  onOpenRarityPicker,
  idPrefix = "assigned-item-meta",
}: AssignedItemMetaFieldsProps) {
  const costId = `${idPrefix}-cost`;
  const rarityId = `${idPrefix}-rarity`;

  return (
    <>
      <p className={`text-sm lg:text-base ${uiTextBody}`}>
        <span className="font-medium text-slate-200">{itemName}</span> {explanation}
      </p>

      <div className="space-y-1">
        <label htmlFor={costId} className={uiFormLabel}>
          Cost (Thrones) <span className="text-red-400">*</span>
        </label>
        <input
          id={costId}
          type="text"
          inputMode="numeric"
          value={gmCost}
          onChange={(event) => setGmCost(sanitizeMoneyInput(event.target.value))}
          placeholder={costPlaceholder}
          className={editableInputClass(true)}
        />
        {gmCost.trim() !== "" && !costValid && (
          <p className="text-xs lg:text-sm text-red-400">Must be a whole number of 0 or more.</p>
        )}
      </div>

      {requiresRarity && (
        <div className="space-y-1">
          <label htmlFor={rarityId} className={uiFormLabel}>
            Rarity <span className="text-red-400">*</span>
          </label>
          <button
            id={rarityId}
            type="button"
            aria-haspopup="dialog"
            onClick={onOpenRarityPicker}
            className={
              editableInputClass(true) +
              " appearance-none text-left flex items-center justify-between"
            }
          >
            <span className={gmRarity ? "" : "text-slate-500"}>
              {gmRarity || "— Select availability —"}
            </span>
            <ArrowRight />
          </button>
        </div>
      )}
    </>
  );
}
