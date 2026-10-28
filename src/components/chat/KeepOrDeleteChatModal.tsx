// src/components/chat/KeepOrDeleteChatModal.tsx

import { CHAT_LIMITS } from "shared-rules";
import { Button } from "../../ui/buttons/Button";
import { ConfirmModal } from "../../ui/modals/ConfirmModal";

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
  const title = many ? "Keep Your Chats?" : "Keep Your Chat?";
  const days = CHAT_LIMITS.binRetentionDays;
  const message = many
    ? `You have ${count} chats about this ${about}. You can keep them, or move them to Recently deleted, where you can restore them for ${days} days.`
    : `You have a chat about this ${about}. You can keep it, or move it to Recently deleted, where you can restore it for ${days} days.`;

  return (
    <ConfirmModal
      title={title}
      message={message}
      dismissible={false}
      onCancel={() => undefined}
      actions={
        <div className="grid grid-cols-2 gap-2">
          <Button variant="neutral" onClick={onKeep} disabled={busy}>
            {many ? "Keep My Chats" : "Keep My Chat"}
          </Button>
          <Button variant="danger" onClick={onDelete} loading={busy} loadingLabel="Moving">
            {many ? "Move My Chats to Recently Deleted" : "Move My Chat to Recently Deleted"}
          </Button>
        </div>
      }
    />
  );
}
