import type { GearItem } from "../../../types/Character";
import { CustomInventoryItemForm } from "../../../ui/forms/CustomInventoryItemForm";

interface Props {
  initialItem?: Partial<GearItem>;
  title?: string;
  submitLabel?: string;
  onAdd: (item: GearItem) => void | Promise<void>;
  onCancel: () => void;
}

export function CustomGearForm({
  initialItem,
  title = "Custom Item",
  submitLabel = "Add",
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
        description: initialItem?.description,
        rules: initialItem?.rules,
      }}
      title={title}
      submitLabel={submitLabel}
      fieldIdPrefix="custom-gear"
      namePlaceholder="Item name..."
      descriptionPlaceholder="What it is, how it looks, where it came from..."
      onSubmit={(draft) =>
        onAdd({
          id: initialItem?.id ?? crypto.randomUUID(),
          name: draft.name,
          weight: draft.weight,
          value: draft.value,
          availability: draft.availability,
          source: draft.source,
          description: draft.description,
          rules: draft.rules,
          customLibraryId: initialItem?.customLibraryId,
          customLibraryVersionId: initialItem?.customLibraryVersionId,
        })
      }
      onCancel={onCancel}
    />
  );
}
