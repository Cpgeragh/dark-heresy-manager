import type { ReactNode } from "react";
import { sanitizeMoneyInput } from "../format/moneyFormat";
import { editableInputClass, uiTextBody, uiTextError } from "../styles/editableStyles";
import { RequiredFormLabel } from "../forms/RequiredFormLabel";
import { PickerField } from "./PickerField";

export interface AssignedItemMetaFieldsProps {
  itemName: string;
  explanation: ReactNode;
  gmCost: string;
  setGmCost: (value: string) => void;
  costValid: boolean;
  costPlaceholder: string;
  requiresCost?: boolean;
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

      {requiresCost && (
        <div className="space-y-1">
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
            <p className={`text-xs lg:text-sm ${uiTextError}`}>Must be a whole number of 0 or more.</p>
          )}
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
