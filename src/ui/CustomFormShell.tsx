import type { ReactNode } from "react";
import { CustomFormFooter } from "./CustomFormFooter";
import { PickerBody, PickerModal } from "./PickerModal";

interface CustomFormShellProps {
  title: string;
  children: ReactNode;
  canSubmit: boolean;
  submitLabel: string;
  onSubmit: () => void | Promise<void>;
  onClose: () => void;
  onCancel?: () => void;
  saving?: boolean;
  savingLabel?: string;
  scrollPositionRef: { current: number };
  titleClassName?: string;
  closeLabel?: ReactNode;
  closeAriaLabel?: string;
  maxHeight?: string;
  maxWidth?: string;
  bodyClassName?: string;
}

/** Shared modal and scrollable body for custom-item detail forms. */
export function CustomFormShell({
  title,
  children,
  canSubmit,
  submitLabel,
  onSubmit,
  onClose,
  onCancel = onClose,
  saving = false,
  savingLabel,
  scrollPositionRef,
  titleClassName,
  closeLabel,
  closeAriaLabel,
  maxHeight = "max-h-[92vh]",
  maxWidth,
  bodyClassName = "",
}: CustomFormShellProps) {
  return (
    <PickerModal
      title={title}
      titleClassName={titleClassName}
      closeLabel={closeLabel}
      closeAriaLabel={closeAriaLabel}
      scrollPositionRef={scrollPositionRef}
      query=""
      onQueryChange={() => {}}
      onClose={onClose}
      isEmpty={false}
      hideSearch
      maxHeight={maxHeight}
      maxWidth={maxWidth}
      footer={
        <CustomFormFooter
          canSubmit={canSubmit}
          submitLabel={submitLabel}
          onSubmit={onSubmit}
          onCancel={onCancel}
          saving={saving}
          savingLabel={savingLabel}
        />
      }
    >
      <PickerBody className={bodyClassName}>{children}</PickerBody>
    </PickerModal>
  );
}
