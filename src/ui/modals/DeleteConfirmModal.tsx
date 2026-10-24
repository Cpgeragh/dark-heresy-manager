// src/ui/modals/DeleteConfirmModal.tsx
// The permanent delete confirmation: says what will be deleted and asks for DELETE to be typed.

import { useId, useState, type ReactNode } from "react";
import { Button } from "../buttons/Button";
import { PickerBody, PickerModal } from "../pickers/PickerModal";
import { colourAmberPlain } from "../styles/colourTokens";
import { editableInputClass, uiStackList, uiTextBody, uiTextError } from "../styles/editableStyles";

interface DeleteConfirmModalProps {
  title: string;
  message: string;
  /** The line above the box, such as "Type DELETE to permanently delete this campaign". */
  typedLabel: string;
  /** An error from counting what the deletion affects. */
  error?: string;
  details?: ReactNode;
  /** True once the count has loaded, so the deletion can start. */
  ready: boolean;
  deleting: boolean;
  onConfirm: () => unknown;
  onCancel: () => void;
}

export function DeleteConfirmModal({
  title,
  message,
  typedLabel,
  error,
  details,
  ready,
  deleting,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  const [typed, setTyped] = useState("");
  const inputId = useId();

  return (
    <PickerModal
      title={title}
      query=""
      onQueryChange={() => undefined}
      onClose={() => {
        if (!deleting) onCancel();
      }}
      isEmpty={false}
      hideSearch
      maxWidth="max-w-sm"
      footer={
        <div className={uiStackList}>
          <label
            htmlFor={inputId}
            className={`block text-center text-xs lg:text-sm ${colourAmberPlain}`}
          >
            {typedLabel}
          </label>
          <input
            id={inputId}
            type="text"
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            disabled={deleting}
            placeholder="DELETE"
            className={editableInputClass(true)}
            autoComplete="off"
          />
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="primary"
              disabled={typed !== "DELETE" || !ready}
              loading={deleting}
              loadingLabel="Deleting"
              onClick={onConfirm}
            >
              Delete Permanently
            </Button>
            <Button variant="neutral" disabled={deleting} onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      }
    >
      <PickerBody>
        <p className={`text-sm lg:text-base ${uiTextBody}`}>{message}</p>
        {details}
        {error && <span className={`text-xs ${uiTextError}`}>{error}</span>}
      </PickerBody>
    </PickerModal>
  );
}
