import { useState, type ReactNode } from "react";
import { Button, type ButtonVariant } from "../buttons/Button";
import { CenteredTitleHeader } from "../CenteredTitleHeader";
import { uiTwoColumnGrid, uiStackBody, uiTextBody } from "../styles/editableStyles";
import { ModalHeader } from "./ModalHeader";
import { ModalShell } from "./ModalShell";

interface ConfirmModalProps {
  title: string;
  message?: ReactNode;
  /** Content between the sentence and the buttons, such as a typed box or a details list. */
  children?: ReactNode;
  confirmLabel?: string;
  /** Leave out for a pop-up that only shows a message and a single Close button. */
  onConfirm?: () => unknown;
  confirmDisabled?: boolean;
  confirmVariant?: ButtonVariant;
  /** A full-width extra action above the two buttons. */
  extraAction?: { label: string; onClick: () => unknown };
  /** Replaces the confirm and cancel buttons, for two answers that fill the same two columns. */
  actions?: ReactNode;
  onCancel: () => void;
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
  children,
  confirmLabel,
  onConfirm,
  confirmDisabled = false,
  confirmVariant = "primary",
  extraAction,
  actions,
  onCancel,
  cancelLabel,
  busy = false,
  loadingLabel,
  dismissible = true,
}: ConfirmModalProps) {
  const [pending, setPending] = useState(false);
  const waiting = busy || pending;
  const run = (action: () => unknown) => async () => {
    setPending(true);
    try {
      await action();
    } finally {
      setPending(false);
    }
  };
  const close = () => {
    if (!waiting) onCancel();
  };
  const dismissLabel = cancelLabel ?? (onConfirm ? "Cancel" : "Close");

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
        {message && <p className={`text-sm lg:text-base ${uiTextBody} text-center`}>{message}</p>}
        {children}
        {extraAction && (
          <Button
            fullWidth
            variant="warningOutline"
            disabled={waiting}
            onClick={run(extraAction.onClick)}
          >
            {extraAction.label}
          </Button>
        )}
        {actions ??
          (onConfirm ? (
            <div className={uiTwoColumnGrid}>
              <Button
                variant={confirmVariant}
                loading={waiting}
                loadingLabel={loadingLabel ?? confirmLabel}
                disabled={confirmDisabled}
                onClick={run(onConfirm)}
              >
                {confirmLabel}
              </Button>
              <Button variant="neutral" disabled={waiting} onClick={onCancel}>
                {dismissLabel}
              </Button>
            </div>
          ) : (
            <Button fullWidth variant="neutral" onClick={onCancel}>
              {dismissLabel}
            </Button>
          ))}
      </div>
    </ModalShell>
  );
}
