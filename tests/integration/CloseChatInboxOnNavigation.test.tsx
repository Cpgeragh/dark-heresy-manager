// tests/integration/CloseChatInboxOnNavigation.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import { CloseChatInboxOnNavigation } from "../../src/components/chat/CloseChatInboxOnNavigation";
import { ChatInboxProvider } from "../../src/context/ChatInboxProvider";
import { useChatInbox } from "../../src/context/useChatInbox";

function Probe() {
  const { view, openInbox } = useChatInbox();
  return (
    <>
      <p>Inbox view: {view.kind}</p>
      <button onClick={openInbox}>open inbox</button>
      <Link to="/other">other page</Link>
      <Link to="/start?tab=stats">same page, new tab</Link>
    </>
  );
}

function renderApp() {
  return render(
    <MemoryRouter initialEntries={["/start"]}>
      <ChatInboxProvider>
        <CloseChatInboxOnNavigation />
        <Probe />
      </ChatInboxProvider>
    </MemoryRouter>
  );
}

describe("CloseChatInboxOnNavigation", () => {
  it("leaves the inbox alone on first render", () => {
    renderApp();

    expect(screen.getByText("Inbox view: closed")).toBeInTheDocument();
  });

  it("closes an open inbox when the page path changes", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("button", { name: "open inbox" }));
    expect(screen.getByText("Inbox view: list")).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "other page" }));

    expect(screen.getByText("Inbox view: closed")).toBeInTheDocument();
  });

  it("keeps an open inbox when only the query string changes", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("button", { name: "open inbox" }));

    await user.click(screen.getByRole("link", { name: "same page, new tab" }));

    expect(screen.getByText("Inbox view: list")).toBeInTheDocument();
  });

  it("keeps an open inbox while the same path is shown again", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("button", { name: "open inbox" }));
    await user.click(screen.getByRole("button", { name: "open inbox" }));

    expect(screen.getByText("Inbox view: list")).toBeInTheDocument();
  });
});
