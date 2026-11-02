import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import "@testing-library/jest-dom";
import { DeferredChatInbox } from "../../src/components/chat/DeferredChatInbox";

const { load, inbox } = vi.hoisted(() => ({
  load: vi.fn(),
  inbox: { view: { kind: "closed" } },
}));
vi.mock("../../src/loading/appModules", () => ({ loadChatInbox: load }));
vi.mock("../../src/context/useChatInbox", () => ({ useChatInbox: () => inbox }));

function Inbox() {
  const [tab, setTab] = useState("Chats");
  return inbox.view.kind === "closed" ? null : <button onClick={() => setTab("Bin")}>{tab}</button>;
}

describe("deferred chat interface", () => {
  it("does not download when closed, allows closing during download, and retains list state after reopening", async () => {
    let finish!: (module: { default: typeof Inbox }) => void;
    load.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      })
    );
    const { rerender } = render(<DeferredChatInbox accountId="account" />);
    expect(load).not.toHaveBeenCalled();
    inbox.view = { kind: "list" };
    rerender(<DeferredChatInbox accountId="account" />);
    expect(load).toHaveBeenCalledOnce();
    inbox.view = { kind: "closed" };
    rerender(<DeferredChatInbox accountId="account" />);
    await act(async () => {
      finish({ default: Inbox });
    });
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    inbox.view = { kind: "list" };
    rerender(<DeferredChatInbox accountId="account" />);
    fireEvent.click(screen.getByRole("button", { name: "Chats" }));
    inbox.view = { kind: "closed" };
    rerender(<DeferredChatInbox accountId="account" />);
    inbox.view = { kind: "list" };
    rerender(<DeferredChatInbox accountId="account" />);
    expect(screen.getByRole("button", { name: "Bin" })).toBeInTheDocument();
    expect(load).toHaveBeenCalledOnce();
  });
});
