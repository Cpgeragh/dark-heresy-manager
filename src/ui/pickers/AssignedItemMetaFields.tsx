import type { ReactNode } from "react";
import { sanitizeMoneyInput } from "../format/moneyFormat";
import { sanitizeWeightInput } from "../format/weightFormat";
import {
  editableInputClass,
  uiTextBody,
  uiTextError,
  uiStackField,
} from "../styles/editableStyles";
import { RequiredFormLabel } from "../forms/RequiredFormLabel";
import { PickerField } from "./PickerField";
import { colourTextPrimary } from "../styles/colourTokens";

export interface AssignedItemMetaFieldsProps {
  itemName: string;
  explanation: ReactNode;
  gmCost: string;
  setGmCost: (value: string) => void;
  costValid: boolean;
  costPlaceholder: string;
  requiresCost?: boolean;
  requiresWeight?: boolean;
  gmWeight?: string;
  setGmWeight?: (value: string) => void;
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
  requiresCost = true,
  requiresWeight = false,
  gmWeight = "",
  setGmWeight,
  requiresRarity,
  gmRarity,
  onOpenRarityPicker,
  idPrefix = "assigned-item-meta",
}: AssignedItemMetaFieldsProps) {
  const costId = `${idPrefix}-cost`;
  const weightId = `${idPrefix}-weight`;
  const rarityId = `${idPrefix}-rarity`;

  return (
    <>
      <p className={`text-sm lg:text-base ${uiTextBody}`}>
        <span className={`font-medium ${colourTextPrimary}`}>{itemName}</span> {explanation}
      </p>

      {requiresCost && (
        <div className={uiStackField}>
          <RequiredFormLabel htmlFor={costId}>Cost (Thrones)</RequiredFormLabel>
          <input
            id={costId}
            type="text"
            required
            aria-invalid={gmCost.trim() !== "" && !costValid}
            inputMode="numeric"
            value={gmCost}
            onChange={(event) => setGmCost(sanitizeMoneyInput(event.target.value))}
            placeholder={costPlaceholder}
            className={editableInputClass(true)}
            autoComplete="off"
          />
          {gmCost.trim() !== "" && !costValid && (
            <p className={`text-xs lg:text-sm ${uiTextError}`}>
              Must be a whole number of 0 or more.
            </p>
          )}
        </div>
      )}

      {requiresWeight && (
        <div className={uiStackField}>
          <RequiredFormLabel htmlFor={weightId}>Weight (kg)</RequiredFormLabel>
          <input
            id={weightId}
            type="text"
            required
            inputMode="decimal"
            value={gmWeight}
            onChange={(event) => setGmWeight?.(sanitizeWeightInput(event.target.value))}
            placeholder="e.g. 2"
            className={editableInputClass(true)}
            autoComplete="off"
          />
        </div>
      )}

      {requiresRarity && (
        <PickerField
          id={rarityId}
          label="Rarity"
          value={gmRarity}
          placeholder="— Select availability —"
          onClick={onOpenRarityPicker}
          required
        />
      )}
    </>
  );
}
