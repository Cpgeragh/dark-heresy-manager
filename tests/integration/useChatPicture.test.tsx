// tests/integration/useChatPicture.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { ChatSummaryWithId } from "../../src/types/Firestore";

const loadChatPortraitMock = vi.fn();
const getCachedChatPortraitMock = vi.fn();
vi.mock("../../src/services/chatPortraitService", () => ({
  loadChatPortrait: (...args: unknown[]) => loadChatPortraitMock(...args),
  getCachedChatPortrait: (...args: unknown[]) => getCachedChatPortraitMock(...args),
}));

import { useChatPicture } from "../../src/hooks/useChatPicture";

const cache = new Map<string, string | null>();

beforeEach(() => {
  vi.clearAllMocks();
  cache.clear();
  getCachedChatPortraitMock.mockImplementation((campaignId: string, characterId: string) =>
    cache.get(`${campaignId}/${characterId}`)
  );
  loadChatPortraitMock.mockImplementation(async (campaignId: string, characterId: string) => {
    cache.set(`${campaignId}/${characterId}`, "data:image/png;base64,AA");
    return "data:image/png;base64,AA";
  });
});

function chat(over: Partial<ChatSummaryWithId> = {}): ChatSummaryWithId {
  return {
    id: "c1__char-1__player-1",
    campaignId: "c1",
    characterId: "char-1",
    playerAccountId: "player-1",
    role: "dm",
    otherAccountId: "player-1",
    otherName: "Anna",
    campaignName: "Calixis",
    characterName: "Brother Kael",
    lastMessage: "Hello",
    lastTimestamp: null,
    unreadCount: 0,
    closed: false,
    ...over,
  };
}

describe("useChatPicture", () => {
  it("never reads a picture in the player's inbox", () => {
    const { result } = renderHook(() => useChatPicture(chat({ role: "player" }), true));

    expect(result.current).toEqual({ status: "none" });
    expect(loadChatPortraitMock).not.toHaveBeenCalled();
  });

  it("stays loading and reads nothing until the row has been seen", () => {
    const { result } = renderHook(() => useChatPicture(chat(), false));

    expect(result.current).toEqual({ status: "loading" });
    expect(loadChatPortraitMock).not.toHaveBeenCalled();
  });

  it("reads the character's portrait once the row is visible", async () => {
    const { result } = renderHook(() => useChatPicture(chat(), true));

    expect(result.current).toEqual({ status: "loading" });
    await waitFor(() =>
      expect(result.current).toEqual({ status: "ready", url: "data:image/png;base64,AA" })
    );
    expect(loadChatPortraitMock).toHaveBeenCalledWith("c1", "char-1");
  });

  it("falls back to no picture when the character has none", async () => {
    loadChatPortraitMock.mockImplementation(async (campaignId: string, characterId: string) => {
      cache.set(`${campaignId}/${characterId}`, null);
      return null;
    });
    const { result } = renderHook(() => useChatPicture(chat(), true));

    await waitFor(() => expect(result.current).toEqual({ status: "none" }));
  });

  it("shows an already remembered portrait on the first render", () => {
    cache.set("c1/char-1", "data:image/png;base64,BB");
    const { result } = renderHook(() => useChatPicture(chat(), false));

    expect(result.current).toEqual({ status: "ready", url: "data:image/png;base64,BB" });
  });
});
