// src/components/chat/ChatMessageButton.tsx

import type { MouseEvent } from "react";
import { useChatInbox } from "../../context/useChatInbox";
import { IconButton } from "../../ui/buttons/IconButton";
import { MessageIcon } from "../../ui/icons/MessageIcon";
import { uiIconButtonIconSize } from "../../ui/styles/buttonStyles";
import type { ChatTarget } from "./chatTarget";

export function ChatMessageButton({ target }: { target: ChatTarget }) {
  const { openChat } = useChatInbox();

  if (!target.playerAccountId) return null;

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    openChat(target);
  };

  return (
    <IconButton
      label="Message"
      onClick={handleClick}
      icon={<MessageIcon className={uiIconButtonIconSize.md} />}
    />
  );
}
