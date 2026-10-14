// src/components/chat/ReleaseConfirmModal.tsx

import { Button } from "../../ui/buttons/Button";
import { CenteredTitleHeader } from "../../ui/CenteredTitleHeader";
import { ModalShell } from "../../ui/modals/ModalShell";
import { uiStackBody, uiTextBody } from "../../ui/styles/editableStyles";

interface ReleaseConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ReleaseConfirmModal({
  title,
  message,
  confirmLabel,
  busy,
  onConfirm,
  onCancel,
}: ReleaseConfirmModalProps) {
  return (
    <ModalShell
      ariaLabel={title}
      onClose={onCancel}
      closeOnBackdrop={!busy}
      closeOnEscape={!busy}
      className="max-w-xs lg:max-w-sm"
    >
      <CenteredTitleHeader title={title} />
      <div className={`p-4 lg:p-5 ${uiStackBody}`}>
        <p className={`text-sm lg:text-base ${uiTextBody}`}>{message}</p>
        <div className="flex gap-2">
          <Button
            variant="danger"
            className="flex-1"
            onClick={onConfirm}
            loading={busy}
            loadingLabel="Releasing"
          >
            {confirmLabel}
          </Button>
          <Button variant="neutral" className="flex-1" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
