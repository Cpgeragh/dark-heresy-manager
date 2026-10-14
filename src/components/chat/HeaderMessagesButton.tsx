// src/components/chat/HeaderMessagesButton.tsx

import { useChatInbox } from "../../context/useChatInbox";
import { useHeaderExtension } from "../../context/useHeaderExtension";
import { useChatsContext } from "../../context/useChatsContext";
import { IconButton } from "../../ui/buttons/IconButton";
import { MessageIcon } from "../../ui/icons/MessageIcon";
import { UnreadBadge } from "./UnreadBadge";

export function HeaderMessagesButton() {
  const { openInbox, openChat } = useChatInbox();
  const { chatTarget } = useHeaderExtension();
  const { unreadTotal } = useChatsContext();

  // On a sheet whose character has a player, the button opens that chat directly.
  const handleClick = () => {
    if (chatTarget?.playerAccountId) openChat(chatTarget);
    else openInbox();
  };

  return (
    <div className="relative">
      <IconButton
        label={unreadTotal > 0 ? `Messages, ${unreadTotal} unread` : "Messages"}
        onClick={handleClick}
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
