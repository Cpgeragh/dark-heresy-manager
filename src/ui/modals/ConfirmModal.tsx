import { useState, type ReactNode } from "react";
import { Button, type ButtonVariant } from "../buttons/Button";
import { CenteredTitleHeader } from "../CenteredTitleHeader";
import { uiStackBody, uiTextBody } from "../styles/editableStyles";
import { ModalHeader } from "./ModalHeader";
import { ModalShell } from "./ModalShell";

interface ConfirmModalProps {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  onConfirm: () => unknown;
  onCancel: () => void;
  confirmVariant?: ButtonVariant;
  cancelLabel?: string;
  /** The caller's own waiting flag, for a save the caller tracks itself. */
  busy?: boolean;
  loadingLabel?: string;
  /** False leaves out the close button and ignores Escape and the backdrop. */
  dismissible?: boolean;
}

/** The one pop-up that asks a short question with a confirm button and Cancel. */
export function ConfirmModal({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  confirmVariant = "primary",
  cancelLabel = "Cancel",
  busy = false,
  loadingLabel,
  dismissible = true,
}: ConfirmModalProps) {
  const [pending, setPending] = useState(false);
  const waiting = busy || pending;
  const confirm = async () => {
    setPending(true);
    try {
      await onConfirm();
    } finally {
      setPending(false);
    }
  };
  const close = () => {
    if (!waiting) onCancel();
  };

  return (
    <ModalShell
      ariaLabel={title}
      onClose={close}
      closeOnBackdrop={dismissible && !waiting}
      closeOnEscape={dismissible && !waiting}
      className="max-w-sm"
    >
      {dismissible ? (
        <ModalHeader title={title} onClose={close} />
      ) : (
        <CenteredTitleHeader title={title} />
      )}
      <div className={`p-4 lg:p-5 ${uiStackBody}`}>
        <p className={`text-sm lg:text-base ${uiTextBody} text-center`}>{message}</p>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={confirmVariant}
            loading={waiting}
            loadingLabel={loadingLabel ?? confirmLabel}
            onClick={confirm}
          >
            {confirmLabel}
          </Button>
          <Button variant="neutral" disabled={waiting} onClick={onCancel}>
            {cancelLabel}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
