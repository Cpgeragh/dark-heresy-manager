// src/services/chatPortraitService.ts

import { getDoc } from "firebase/firestore";
import { characterSummaryDocRef } from "../firebase/converters";

const pending = new Map<string, Promise<string | null>>();
const resolved = new Map<string, string | null>();

function keyOf(campaignId: string, characterId: string): string {
  return `${campaignId}/${characterId}`;
}

export function getCachedChatPortrait(
  campaignId: string,
  characterId: string
): string | null | undefined {
  return resolved.get(keyOf(campaignId, characterId));
}

export function loadChatPortrait(campaignId: string, characterId: string): Promise<string | null> {
  const key = keyOf(campaignId, characterId);
  if (resolved.has(key)) return Promise.resolve(resolved.get(key) ?? null);

  let request = pending.get(key);
  if (!request) {
    request = getDoc(characterSummaryDocRef(campaignId, characterId))
      .then((snapshot) => snapshot.data()?.portraitUrl ?? null)
      .catch((error) => {
        console.error("Failed to load chat portrait:", error);
        return null;
      })
      .then((url) => {
        resolved.set(key, url);
        pending.delete(key);
        return url;
      });
    pending.set(key, request);
  }
  return request;
}
