import { useRef } from "react";
import { Button } from "../buttons/Button";
import { uiPickerBackButton } from "../styles/buttonStyles";
import { AssignedItemMetaFields, type AssignedItemMetaFieldsProps } from "./AssignedItemMetaFields";
import { PickerBody, PickerModal } from "./PickerModal";
import { OptionPickerScreen } from "./OptionPickerScreen";
import { EXTENDED_AVAILABILITY_OPTIONS } from "../../constants/availability";
import { RequiredFieldsNote } from "../forms/CustomFormFooter";

interface AssignedItemMetaScreenProps extends Omit<
  AssignedItemMetaFieldsProps,
  "onOpenRarityPicker"
> {
  title: string;
  confirmLabel: string;
  canConfirm: boolean;
  onBack: () => void;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  showRarityPicker: boolean;
  setGmRarity: (value: string) => void;
  setShowRarityPicker: (show: boolean) => void;
  maxWidth?: string;
}

const ignoreQueryChange = () => undefined;

export function AssignedItemMetaScreen({
  title,
  confirmLabel,
  canConfirm,
  onBack,
  onClose,
  onConfirm,
  showRarityPicker,
  setGmRarity,
  setShowRarityPicker,
  maxWidth,
  ...fieldProps
}: AssignedItemMetaScreenProps) {
  const formScrollPositionRef = useRef(0);

  if (showRarityPicker) {
    return (
      <OptionPickerScreen
        title="Rarity"
        options={EXTENDED_AVAILABILITY_OPTIONS}
        selected={fieldProps.gmRarity}
        onSelect={(value) => {
          setGmRarity(value);
          setShowRarityPicker(false);
        }}
        onClose={() => setShowRarityPicker(false)}
      />
    );
  }

  return (
    <PickerModal
      title={title}
      query=""
      onQueryChange={ignoreQueryChange}
      onClose={onClose}
      isEmpty={false}
      hideSearch
      maxWidth={maxWidth}
      scrollPositionRef={formScrollPositionRef}
    >
      <PickerBody>
        <AssignedItemMetaFields
          {...fieldProps}
          onOpenRarityPicker={() => setShowRarityPicker(true)}
        />

        <RequiredFieldsNote />

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onBack} className={uiPickerBackButton}>
            Back
          </button>
          <Button className="flex-1" onClick={onConfirm} disabled={!canConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </PickerBody>
    </PickerModal>
  );
}
