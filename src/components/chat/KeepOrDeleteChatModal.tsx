// src/components/chat/KeepOrDeleteChatModal.tsx

import { CHAT_LIMITS } from "shared-rules";
import { Button } from "../../ui/buttons/Button";
import { CenteredTitleHeader } from "../../ui/CenteredTitleHeader";
import { ModalShell } from "../../ui/modals/ModalShell";
import { uiStackBody, uiTextBody } from "../../ui/styles/editableStyles";

interface KeepOrDeleteChatModalProps {
  busy: boolean;
  count?: number;
  about?: "character" | "campaign";
  onKeep: () => void;
  onDelete: () => void;
}

export function KeepOrDeleteChatModal({
  busy,
  count = 1,
  about = "character",
  onKeep,
  onDelete,
}: KeepOrDeleteChatModalProps) {
  const many = count > 1;
  const title = many ? "Keep your chats?" : "Keep your chat?";
  const days = CHAT_LIMITS.binRetentionDays;
  const message = many
    ? `You have ${count} chats about this ${about}. You can keep them, or move them to Recently deleted, where you can restore them for ${days} days.`
    : `You have a chat about this ${about}. You can keep it, or move it to Recently deleted, where you can restore it for ${days} days.`;

  return (
    <ModalShell
      ariaLabel={title}
      onClose={() => undefined}
      closeOnBackdrop={false}
      closeOnEscape={false}
      className="max-w-xs lg:max-w-sm"
    >
      <CenteredTitleHeader title={title} />
      <div className={`p-4 lg:p-5 ${uiStackBody}`}>
        <p className={`text-sm lg:text-base ${uiTextBody}`}>{message}</p>
        <div className="flex gap-2">
          <Button variant="neutral" className="flex-1" onClick={onKeep} disabled={busy}>
            {many ? "Keep my chats" : "Keep my chat"}
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={onDelete}
            loading={busy}
            loadingLabel="Deleting"
          >
            {many ? "Delete my chats" : "Delete my chat"}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
