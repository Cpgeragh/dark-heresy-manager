// src/components/chat/HeaderMessagesButton.tsx

import { useChatInbox } from "../../context/useChatInbox";
import { useHeaderExtension } from "../../context/useHeaderExtension";
import { useChatsContext } from "../../context/useChatsContext";
import { IconButton } from "../../ui/buttons/IconButton";
import { InboxIcon } from "../../ui/icons/InboxIcon";
import { MessageIcon } from "../../ui/icons/MessageIcon";
import { uiIconButtonIconSize } from "../../ui/styles/buttonStyles";
import { UnreadBadge } from "./UnreadBadge";

export function HeaderMessagesButton() {
  const { openInbox, openChat } = useChatInbox();
  const { chatTarget } = useHeaderExtension();
  const { unreadTotal } = useChatsContext();

  // A character sheet publishes its chat target. With a player the button opens that chat.
  // With no player there is nobody to message, so it is hidden.
  if (chatTarget && !chatTarget.playerAccountId) return null;

  const opensChat = Boolean(chatTarget);
  const name = opensChat ? "Message" : "Inbox";

  const handleClick = () => {
    if (chatTarget) openChat(chatTarget);
    else openInbox();
  };

  return (
    <div className="relative flex">
      <IconButton
        label={unreadTotal > 0 ? `${name}, ${unreadTotal} unread` : name}
        onClick={handleClick}
        icon={
          opensChat ? (
            <MessageIcon className={uiIconButtonIconSize.md} />
          ) : (
            <InboxIcon className={uiIconButtonIconSize.md} />
          )
        }
      />
      {unreadTotal > 0 && (
        <span className="pointer-events-none absolute -right-1.5 -top-1.5">
          <UnreadBadge count={unreadTotal} />
        </span>
      )}
    </div>
  );
}
