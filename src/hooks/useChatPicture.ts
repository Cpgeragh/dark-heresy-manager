// src/hooks/useChatPicture.ts

import { useEffect, useReducer } from "react";
import type { ChatAvatarPicture } from "../components/chat/ChatAvatar";
import { getCachedChatPortrait, loadChatPortrait } from "../services/chatPortraitService";
import type { ChatSummaryWithId } from "../types/Firestore";

export function useChatPicture(chat: ChatSummaryWithId, enabled: boolean): ChatAvatarPicture {
  const { role, campaignId, characterId } = chat;
  const [, refresh] = useReducer((count: number) => count + 1, 0);

  useEffect(() => {
    if (role !== "dm" || !enabled) return;
    let active = true;
    void loadChatPortrait(campaignId, characterId).then(() => {
      if (active) refresh();
    });
    return () => {
      active = false;
    };
  }, [role, enabled, campaignId, characterId]);

  if (role !== "dm") return { status: "none" };

  const cached = getCachedChatPortrait(campaignId, characterId);
  if (cached === undefined) return { status: "loading" };
  return cached ? { status: "ready", url: cached } : { status: "none" };
}
