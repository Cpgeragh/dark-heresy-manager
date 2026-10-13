// tests/integration/ChatInboxProvider.test.tsx
import { describe, it, expect } from "vitest";
import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { ChatInboxProvider } from "../../src/context/ChatInboxProvider";
import { useChatInbox } from "../../src/context/useChatInbox";

const target = { campaignId: "c1", characterId: "char-1", playerAccountId: "player-1" };

function wrapper({ children }: { children: ReactNode }) {
  return <ChatInboxProvider>{children}</ChatInboxProvider>;
}

describe("ChatInboxProvider", () => {
  it("starts closed", () => {
    const { result } = renderHook(() => useChatInbox(), { wrapper });

    expect(result.current.view).toEqual({ kind: "closed" });
  });

  it("opens the chat list", () => {
    const { result } = renderHook(() => useChatInbox(), { wrapper });

    act(() => result.current.openInbox());

    expect(result.current.view).toEqual({ kind: "list" });
  });

  it("opens one conversation", () => {
    const { result } = renderHook(() => useChatInbox(), { wrapper });

    act(() => result.current.openChat(target));

    expect(result.current.view).toEqual({ kind: "chat", target });
  });

  it("goes back from a conversation to the list", () => {
    const { result } = renderHook(() => useChatInbox(), { wrapper });

    act(() => result.current.openChat(target));
    act(() => result.current.openInbox());

    expect(result.current.view).toEqual({ kind: "list" });
  });

  it("closes", () => {
    const { result } = renderHook(() => useChatInbox(), { wrapper });

    act(() => result.current.openInbox());
    act(() => result.current.close());

    expect(result.current.view).toEqual({ kind: "closed" });
  });

  it("keeps the same actions between renders", () => {
    const { result } = renderHook(() => useChatInbox(), { wrapper });
    const { openInbox, openChat, close } = result.current;

    act(() => result.current.openInbox());

    expect(result.current.openInbox).toBe(openInbox);
    expect(result.current.openChat).toBe(openChat);
    expect(result.current.close).toBe(close);
  });

  it("does nothing, and does not throw, outside a provider", () => {
    const { result } = renderHook(() => useChatInbox());

    expect(() => result.current.openInbox()).not.toThrow();
    expect(result.current.view).toEqual({ kind: "closed" });
  });
});
