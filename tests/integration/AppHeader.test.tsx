// tests/integration/AppHeader.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";

const useHeaderExtensionMock = vi.fn();
vi.mock("../../src/context/useHeaderExtension", () => ({
  useHeaderExtension: () => useHeaderExtensionMock(),
}));

import { AppHeader } from "../../src/components/AppHeader";
import { ChatInboxProvider } from "../../src/context/ChatInboxProvider";
import { useChatInbox } from "../../src/context/useChatInbox";

function InboxViewProbe() {
  const { view } = useChatInbox();
  return <p>Inbox view: {view.kind}</p>;
}

beforeEach(() => {
  vi.clearAllMocks();
  useHeaderExtensionMock.mockReturnValue({ backHref: null, kebabContent: null });
});

function renderHeader(currentPath: string, initialEntry = currentPath, onOpenSettings = vi.fn()) {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AppHeader currentPath={currentPath} onOpenSettings={onOpenSettings} />
    </MemoryRouter>
  );
  return { onOpenSettings };
}

describe("AppHeader", () => {
  it("hides the left icon on the dashboard with no backHref set", () => {
    renderHeader("/");
    expect(screen.queryByRole("link", { name: "Dashboard" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Back" })).not.toBeInTheDocument();
  });

  it("opens Share App from the left side of the dashboard header", async () => {
    const user = userEvent.setup();
    renderHeader("/");

    await user.click(screen.getByRole("button", { name: "Share App" }));

    expect(screen.getByRole("dialog", { name: "Share App" })).toBeInTheDocument();
  });

  it("shows a Dashboard link when off the dashboard with no backHref", () => {
    renderHeader("/settings");
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/");
  });

  it("shows a Back link to the explicit backHref when one is set, even on the dashboard", () => {
    useHeaderExtensionMock.mockReturnValue({ backHref: "/campaign/c1", kebabContent: null });
    renderHeader("/");
    expect(screen.getByRole("link", { name: "Back" })).toHaveAttribute("href", "/campaign/c1");
  });

  it("opens Settings from the dashboard gear button", async () => {
    const user = userEvent.setup();
    const { onOpenSettings } = renderHeader("/", "/");

    await user.click(screen.getByRole("button", { name: "Settings" }));

    expect(onOpenSettings).toHaveBeenCalledOnce();
  });

  it("follows the page on screen and not the address while the next page loads", () => {
    renderHeader("/", "/campaign/c1");
    expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share App" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Dashboard" })).not.toBeInTheDocument();
  });

  it("hides the Settings button off the dashboard route", () => {
    renderHeader("/settings", "/settings");
    expect(screen.queryByRole("button", { name: "Settings" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Share App" })).not.toBeInTheDocument();
  });

  it("hides the kebab button entirely when there is no kebab content", () => {
    renderHeader("/");
    expect(screen.queryByRole("button", { name: "Options" })).not.toBeInTheDocument();
  });

  it("opens the kebab menu and closes when the user clicks outside it", async () => {
    const user = userEvent.setup();
    useHeaderExtensionMock.mockReturnValue({
      backHref: null,
      kebabContent: <div>Kebab options here</div>,
    });
    renderHeader("/");

    await user.click(screen.getByRole("button", { name: "Options" }));
    expect(screen.getByText("Kebab options here")).toBeInTheDocument();

    await user.click(document.body);

    expect(screen.queryByText("Kebab options here")).not.toBeInTheDocument();
  });

  it("closes the open kebab menu with Escape", async () => {
    const user = userEvent.setup();
    useHeaderExtensionMock.mockReturnValue({
      backHref: null,
      kebabContent: <div>Kebab options here</div>,
    });
    renderHeader("/");

    await user.click(screen.getByRole("button", { name: "Options" }));
    expect(screen.getByText("Kebab options here")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByText("Kebab options here")).not.toBeInTheDocument();
  });

  it("shows the Inbox button on the dashboard and off it", () => {
    renderHeader("/");
    expect(screen.getByRole("button", { name: "Inbox" })).toBeInTheDocument();
  });

  it("shows the Inbox button on a page that has no settings button", () => {
    renderHeader("/settings", "/settings");
    expect(screen.getByRole("button", { name: "Inbox" })).toBeInTheDocument();
  });

  it("places the Inbox button before the Settings button", () => {
    renderHeader("/");
    const inbox = screen.getByRole("button", { name: "Inbox" });
    const settings = screen.getByRole("button", { name: "Settings" });

    expect(inbox.compareDocumentPosition(settings) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("opens the inbox list when the Inbox button is pressed", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/"]}>
        <ChatInboxProvider>
          <AppHeader currentPath="/" onOpenSettings={vi.fn()} />
          <InboxViewProbe />
        </ChatInboxProvider>
      </MemoryRouter>
    );
    expect(screen.getByText("Inbox view: closed")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Inbox" }));

    expect(screen.getByText("Inbox view: list")).toBeInTheDocument();
  });
});
