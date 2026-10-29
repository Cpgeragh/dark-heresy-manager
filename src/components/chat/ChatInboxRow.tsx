// src/components/chat/ChatInboxRow.tsx

import type { ChatSummaryWithId } from "../../types/Firestore";
import { CardOverlayButton } from "../../ui/buttons/CardOverlayButton";
import { Chip } from "../../ui/chips/Chip";
import { uiCardTapHeader } from "../../ui/styles/buttonStyles";
import {
  uiInlineRow,
  uiOverlayItemNameHover,
  uiOverlayPeerHoverText,
  uiSectionShell,
  uiTextMeta,
  uiSplitRow,
} from "../../ui/styles/editableStyles";
import { formatChatListTime } from "../../utils/formatChatListTime";
import { ChatAvatar, type ChatAvatarPicture } from "./ChatAvatar";
import { uiLayerLocal } from "../../ui/styles/layerStyles";
import { UnreadBadge } from "./UnreadBadge";

interface ChatInboxRowProps {
  chat: ChatSummaryWithId;
  picture: ChatAvatarPicture;
  onOpen: () => void;
}

export function ChatInboxRow({ chat, picture, onOpen }: ChatInboxRowProps) {
  const avatarName = chat.role === "dm" ? chat.characterName : chat.otherName;
  const label = [
    `${chat.characterName}, ${chat.otherName}`,
    chat.unreadCount > 0 ? `${chat.unreadCount} unread` : null,
    chat.closed ? "closed" : null,
  ]
    .filter(Boolean)
    .join(", ");
  const time = chat.lastTimestamp ? formatChatListTime(chat.lastTimestamp.toDate()) : null;

  return (
    <div
      className={`${uiSectionShell} ${uiCardTapHeader} relative flex items-center gap-3 px-3 lg:px-4 py-2 lg:py-2.5 text-left`}
    >
      <CardOverlayButton label={label} onClick={onOpen} />
      <div
        className={`pointer-events-none relative ${uiLayerLocal} ${uiSplitRow} min-w-0 flex-1 ${uiOverlayPeerHoverText}`}
      >
        <ChatAvatar name={avatarName} picture={picture} />
        <div className="min-w-0 flex-1">
          <div className={uiInlineRow}>
            <span className={`${uiOverlayItemNameHover} truncate`}>{chat.characterName}</span>
            <UnreadBadge count={chat.unreadCount} />
            {chat.closed && <Chip colour="slate">Closed</Chip>}
          </div>
          <p className={`${uiTextMeta} truncate`}>
            {chat.otherName} · {chat.campaignName}
          </p>
          {chat.lastMessage && (
            <p className={`${uiTextMeta} truncate mt-0.5`}>{chat.lastMessage}</p>
          )}
        </div>
        {time && <span className={`${uiTextMeta} shrink-0 self-start`}>{time}</span>}
      </div>
    </div>
  );
}
