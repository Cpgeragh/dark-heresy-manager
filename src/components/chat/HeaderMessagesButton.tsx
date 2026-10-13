// src/components/chat/HeaderMessagesButton.tsx

import { useChatInbox } from "../../context/useChatInbox";
import { useChatsContext } from "../../context/useChatsContext";
import { IconButton } from "../../ui/buttons/IconButton";
import { MessageIcon } from "../../ui/icons/MessageIcon";
import { UnreadBadge } from "./UnreadBadge";

export function HeaderMessagesButton() {
  const { openInbox } = useChatInbox();
  const { unreadTotal } = useChatsContext();

  return (
    <div className="relative">
      <IconButton
        label={unreadTotal > 0 ? `Messages, ${unreadTotal} unread` : "Messages"}
        onClick={openInbox}
        icon={<MessageIcon />}
      />
      {unreadTotal > 0 && (
        <span className="pointer-events-none absolute -right-1.5 -top-1.5">
          <UnreadBadge count={unreadTotal} />
        </span>
      )}
    </div>
  );
}
