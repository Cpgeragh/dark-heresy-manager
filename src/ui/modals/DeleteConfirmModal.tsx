// src/ui/modals/DeleteConfirmModal.tsx
// The permanent delete confirmation: says what will be deleted and asks for DELETE to be typed.

import { useId, useState, type ReactNode } from "react";
import { colourAmberPlain } from "../styles/colourTokens";
import { editableInputClass, uiStackList, uiTextError } from "../styles/editableStyles";
import { ConfirmModal } from "./ConfirmModal";

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
    <ConfirmModal
      title={title}
      message={message}
      confirmLabel="Delete Permanently"
      confirmVariant="danger"
      confirmDisabled={typed !== "DELETE" || !ready}
      busy={deleting}
      loadingLabel="Deleting"
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      {details}
      {error && <span className={`text-xs ${uiTextError}`}>{error}</span>}
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
      </div>
    </ConfirmModal>
  );
}
