// src/components/chat/ChatMessageButton.tsx

import type { MouseEvent } from "react";
import { useChatInbox } from "../../context/useChatInbox";
import { Button } from "../../ui/buttons/Button";
import type { ChatTarget } from "./chatTarget";

export function ChatMessageButton({ target }: { target: ChatTarget }) {
  const { openChat } = useChatInbox();

  if (!target.playerAccountId) return null;

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    openChat(target);
  };

  return (
    <Button variant="secondary" size="sm" onClick={handleClick}>
      Message
    </Button>
  );
}
