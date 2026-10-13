// src/components/chat/ChatInboxItem.tsx

import { useChatPicture } from "../../hooks/useChatPicture";
import { useHasBeenVisible } from "../../hooks/useHasBeenVisible";
import type { ChatSummaryWithId } from "../../types/Firestore";
import { ChatInboxRow } from "./ChatInboxRow";

const LOOK_AHEAD_MARGIN = "0px 0px 150px 0px";

interface ChatInboxItemProps {
  chat: ChatSummaryWithId;
  scrollRoot?: Element | null;
  onOpen: () => void;
}

export function ChatInboxItem({ chat, scrollRoot, onOpen }: ChatInboxItemProps) {
  const { ref, visible } = useHasBeenVisible<HTMLDivElement>({
    root: scrollRoot,
    rootMargin: LOOK_AHEAD_MARGIN,
  });
  const picture = useChatPicture(chat, visible);

  return (
    <div ref={ref}>
      <ChatInboxRow chat={chat} picture={picture} onOpen={onOpen} />
    </div>
  );
}
