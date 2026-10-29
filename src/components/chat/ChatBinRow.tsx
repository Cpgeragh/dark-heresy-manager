// src/components/chat/ChatBinRow.tsx

import type { ChatSummaryWithId } from "../../types/Firestore";
import { Button } from "../../ui/buttons/Button";
import { uiItemName, uiSectionShell, uiSplitRow, uiTextMeta } from "../../ui/styles/editableStyles";
import { daysLeftInBin, isChatBinned } from "../../utils/chatBin";
import { ChatAvatar } from "./ChatAvatar";

interface ChatBinRowProps {
  chat: ChatSummaryWithId;
  onRestore: () => Promise<void> | void;
}

function describeDaysLeft(daysLeft: number): string {
  if (daysLeft <= 0) return "Removal due";
  return daysLeft === 1 ? "1 day left" : `${daysLeft} days left`;
}

export function ChatBinRow({ chat, onRestore }: ChatBinRowProps) {
  const avatarName = chat.role === "dm" ? chat.characterName : chat.otherName;
  const daysLeft = chat.clearedAt ? daysLeftInBin(chat.clearedAt) : 0;
  const status = isChatBinned(chat) ? "Deleted" : "Earlier messages deleted";

  return (
    <div className={`${uiSectionShell} ${uiSplitRow} px-3 lg:px-4 py-2 lg:py-2.5`}>
      <ChatAvatar name={avatarName} picture={{ status: "none" }} />
      <div className="min-w-0 flex-1">
        <span className={`${uiItemName} block truncate`}>{chat.characterName}</span>
        <p className={`${uiTextMeta} truncate`}>
          {chat.otherName} · {chat.campaignName}
        </p>
        <p className={uiTextMeta}>
          {status} · {describeDaysLeft(daysLeft)}
        </p>
      </div>
      <Button
        variant="secondary"
        size="sm"
        aria-label={`Restore ${chat.characterName}`}
        onClick={onRestore}
      >
        Restore
      </Button>
    </div>
  );
}
