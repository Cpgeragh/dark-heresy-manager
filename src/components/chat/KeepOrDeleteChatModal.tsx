// src/components/chat/KeepOrDeleteChatModal.tsx

import { CHAT_LIMITS } from "shared-rules";
import { Button } from "../../ui/buttons/Button";
import { CenteredTitleHeader } from "../../ui/CenteredTitleHeader";
import { ModalShell } from "../../ui/modals/ModalShell";
import { uiStackBody, uiTextBody } from "../../ui/styles/editableStyles";

interface KeepOrDeleteChatModalProps {
  busy: boolean;
  onKeep: () => void;
  onDelete: () => void;
}

export function KeepOrDeleteChatModal({ busy, onKeep, onDelete }: KeepOrDeleteChatModalProps) {
  return (
    <ModalShell
      ariaLabel="Keep your chat?"
      onClose={() => undefined}
      closeOnBackdrop={false}
      closeOnEscape={false}
      className="max-w-xs lg:max-w-sm"
    >
      <CenteredTitleHeader title="Keep your chat?" />
      <div className={`p-4 lg:p-5 ${uiStackBody}`}>
        <p className={`text-sm lg:text-base ${uiTextBody}`}>
          You have a chat about this character. You can keep it, or move it to Recently deleted,
          where you can restore it for {CHAT_LIMITS.binRetentionDays} days.
        </p>
        <div className="flex gap-2">
          <Button variant="neutral" className="flex-1" onClick={onKeep} disabled={busy}>
            Keep my chat
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={onDelete}
            loading={busy}
            loadingLabel="Deleting"
          >
            Delete my chat
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
