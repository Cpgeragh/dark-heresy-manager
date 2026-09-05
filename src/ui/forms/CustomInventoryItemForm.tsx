import { useRef, useState } from "react";
import type { CustomItemOrigin } from "../../constants/customItems";
import { STANDARD_AVAILABILITY_OPTIONS } from "../../constants/availability";
import { sanitizePositiveIntegerInput } from "../../utils/formInput";
import { formatMoneyInput, sanitizeMoneyInput } from "../format/moneyFormat";
import { formatWeightInput, sanitizeWeightInput } from "../format/weightFormat";
import { OptionPickerScreen } from "../pickers/OptionPickerScreen";
import { PickerField } from "../pickers/PickerField";
import { editableInputClass, editableTextareaClass, uiFormLabel } from "../styles/editableStyles";
import { CustomFormSection } from "./CustomFormSection";
import { CustomFormShell } from "./CustomFormShell";
import { OriginSelector } from "./OriginSelector";
import { RequiredFormLabel } from "./RequiredFormLabel";

interface InitialValue {
  name?: string;
  source?: string;
  availability?: string;
  weight?: string;
  value?: string;
  rules?: string;
}

interface QuantityConfig {
  initialValue?: number;
  visible: boolean;
}

export interface CustomInventoryItemDraft {
  name: string;
  quantity?: number;
  source: CustomItemOrigin;
  availability: string;
  weight: string;
  value: string;
  rules?: string;
}

interface Props {
  initialValue?: InitialValue;
  quantity?: QuantityConfig;
  title: string;
  submitLabel: string;
  fieldIdPrefix: string;
  namePlaceholder: string;
  rulesPlaceholder: string;
  onSubmit: (draft: CustomInventoryItemDraft) => void | Promise<void>;
  onCancel: () => void;
}

export function CustomInventoryItemForm({
  initialValue,
  quantity: quantityConfig,
  title,
  submitLabel,
  fieldIdPrefix,
  namePlaceholder,
  rulesPlaceholder,
  onSubmit,
  onCancel,
}: Props) {
  const formScrollPositionRef = useRef(0);
  const [name, setName] = useState(initialValue?.name ?? "");
  const [quantity, setQuantity] = useState(
    quantityConfig?.initialValue ? String(quantityConfig.initialValue) : ""
  );
  const [origin, setOrigin] = useState<"" | CustomItemOrigin>(
    initialValue?.source === "Custom" || initialValue?.source === "2nd Ed"
      ? initialValue.source
      : ""
  );
  const [availability, setAvailability] = useState(initialValue?.availability ?? "");
  const [weight, setWeight] = useState(initialValue?.weight ?? "");
  const [value, setValue] = useState(initialValue?.value ?? "");
  const [rules, setRules] = useState(initialValue?.rules ?? "");
  const [saving, setSaving] = useState(false);
  const [showAvailabilityPicker, setShowAvailabilityPicker] = useState(false);
  const quantityNumber = Number(quantity);
  const quantityValid =
    !quantityConfig?.visible || (Number.isInteger(quantityNumber) && quantityNumber >= 1);

  const canSubmit =
    Boolean(name.trim()) &&
    quantityValid &&
    Boolean(origin) &&
    Boolean(availability) &&
    Boolean(weight.trim()) &&
    Boolean(value);

  const submit = async () => {
    if (!canSubmit || !origin) return;
    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        ...(quantityConfig
          ? {
              quantity: quantityConfig.visible
                ? quantityNumber
                : (quantityConfig.initialValue ?? 1),
            }
          : {}),
        source: origin,
        availability,
        weight: formatWeightInput(weight),
        value: formatMoneyInput(value),
        rules: rules.trim() || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  if (showAvailabilityPicker) {
    return (
      <OptionPickerScreen
        title="Availability"
        options={STANDARD_AVAILABILITY_OPTIONS}
        selected={availability}
        onSelect={(nextAvailability) => {
          setAvailability(nextAvailability);
          setShowAvailabilityPicker(false);
        }}
        onClose={() => setShowAvailabilityPicker(false)}
      />
    );
  }

  return (
    <CustomFormShell
      title={title}
      scrollPositionRef={formScrollPositionRef}
      onClose={onCancel}
      canSubmit={canSubmit}
      submitLabel={submitLabel}
      onSubmit={submit}
      saving={saving}
    >
      <CustomFormSection title="Identity">
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <RequiredFormLabel htmlFor={`${fieldIdPrefix}-name`}>Name</RequiredFormLabel>
            <input
              id={`${fieldIdPrefix}-name`}
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={namePlaceholder}
              className={editableInputClass(true) + " mt-0.5"}
            />
          </div>
          {quantityConfig?.visible && (
            <div>
              <RequiredFormLabel htmlFor={`${fieldIdPrefix}-quantity`}>Quantity</RequiredFormLabel>
              <input
                id={`${fieldIdPrefix}-quantity`}
                required
                type="text"
                inputMode="numeric"
                value={quantity}
                onChange={(event) => setQuantity(sanitizePositiveIntegerInput(event.target.value))}
                placeholder="1+"
                className={editableInputClass(true) + " mt-0.5"}
              />
            </div>
          )}
        </div>
      </CustomFormSection>

      <CustomFormSection title="Origin">
        <OriginSelector
          name={`${fieldIdPrefix}-origin`}
          value={origin}
          onChange={setOrigin}
          hideLabel
        />
      </CustomFormSection>

      <CustomFormSection title="Details">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <RequiredFormLabel htmlFor={`${fieldIdPrefix}-weight`}>Weight</RequiredFormLabel>
            <input
              id={`${fieldIdPrefix}-weight`}
              required
              type="text"
              inputMode="decimal"
              value={weight}
              onChange={(event) => setWeight(sanitizeWeightInput(event.target.value))}
              className={editableInputClass(true) + " mt-0.5"}
            />
          </div>
          <div>
            <RequiredFormLabel htmlFor={`${fieldIdPrefix}-cost`}>Cost</RequiredFormLabel>
            <input
              id={`${fieldIdPrefix}-cost`}
              required
              type="text"
              inputMode="numeric"
              value={value}
              onChange={(event) => setValue(sanitizeMoneyInput(event.target.value))}
              className={editableInputClass(true) + " mt-0.5"}
            />
          </div>
          <PickerField
            id={`${fieldIdPrefix}-availability`}
            label="Availability"
            value={availability}
            placeholder="Choose availability"
            required
            onClick={() => setShowAvailabilityPicker(true)}
            className="col-span-2"
          />
        </div>
      </CustomFormSection>

      <CustomFormSection title="Rules">
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <label htmlFor={`${fieldIdPrefix}-rules`} className={uiFormLabel}>
              Rules
            </label>
            <textarea
              id={`${fieldIdPrefix}-rules`}
              value={rules}
              onChange={(event) => setRules(event.target.value)}
              placeholder={rulesPlaceholder}
              rows={3}
              className={editableTextareaClass(true) + " mt-0.5"}
            />
          </div>
        </div>
      </CustomFormSection>
    </CustomFormShell>
  );
}
