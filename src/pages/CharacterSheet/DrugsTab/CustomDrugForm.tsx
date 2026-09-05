import type { DrugItem } from "../../../types/Character";
import { CustomInventoryItemForm } from "../../../ui/forms/CustomInventoryItemForm";

interface Props {
  initialItem?: Partial<DrugItem>;
  title?: string;
  submitLabel?: string;
  includeQuantity?: boolean;
  onAdd: (item: DrugItem) => void | Promise<void>;
  onCancel: () => void;
}

export function CustomDrugForm({
  initialItem,
  title = "Custom Drug",
  submitLabel = "Add",
  includeQuantity = true,
  onAdd,
  onCancel,
}: Props) {
  return (
    <CustomInventoryItemForm
      initialValue={{
        name: initialItem?.name,
        source: initialItem?.source,
        availability: initialItem?.availability,
        weight: initialItem?.weight,
        value: initialItem?.value,
        rules: initialItem?.notes,
      }}
      quantity={{ initialValue: initialItem?.quantity, visible: includeQuantity }}
      title={title}
      submitLabel={submitLabel}
      fieldIdPrefix="custom-drug"
      namePlaceholder="Drug name..."
      rulesPlaceholder="Notes, dose, effects..."
      onSubmit={(draft) =>
        onAdd({
          id: initialItem?.id ?? crypto.randomUUID(),
          name: draft.name,
          quantity: draft.quantity ?? 1,
          weight: draft.weight,
          value: draft.value,
          availability: draft.availability,
          source: draft.source,
          notes: draft.rules,
          customLibraryId: initialItem?.customLibraryId,
          customLibraryVersionId: initialItem?.customLibraryVersionId,
        })
      }
      onCancel={onCancel}
    />
  );
}
