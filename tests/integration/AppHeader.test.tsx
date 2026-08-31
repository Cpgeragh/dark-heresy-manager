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

beforeEach(() => {
  vi.clearAllMocks();
  useHeaderExtensionMock.mockReturnValue({ backHref: null, kebabContent: null });
});

function renderHeader(currentPath: string, initialEntry = currentPath) {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AppHeader currentPath={currentPath} />
    </MemoryRouter>
  );
}

describe("AppHeader", () => {
  it("hides the left icon on the dashboard with no backHref set", () => {
    renderHeader("/");
    expect(screen.queryByRole("link", { name: "Dashboard" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Back" })).not.toBeInTheDocument();
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

  it("shows the Settings link only on the dashboard route", () => {
    renderHeader("/", "/");
    expect(screen.getByRole("link", { name: "Settings" })).toBeInTheDocument();
  });

  it("hides the Settings link off the dashboard route", () => {
    renderHeader("/settings", "/settings");
    expect(screen.queryByRole("link", { name: "Settings" })).not.toBeInTheDocument();
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
});
