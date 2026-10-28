// src/components/chat/ReleaseConfirmModal.tsx

import { ConfirmModal } from "../../ui/modals/ConfirmModal";

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
    <ConfirmModal
      title={title}
      message={message}
      confirmLabel={confirmLabel}
      confirmVariant="danger"
      busy={busy}
      loadingLabel="Releasing"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
