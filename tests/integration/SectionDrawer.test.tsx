import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SectionDrawer } from "../../src/components/SectionDrawer";
import { getSheetNavigation } from "../../src/pages/CharacterSheet/sectionNavigation";
import { colourShadowStrong } from "../../src/ui/styles/colourTokens";

describe("SectionDrawer", () => {
  it("carries the shared strong shadow", () => {
    render(
      <SectionDrawer
        navigation={getSheetNavigation(false)}
        activePage="stats"
        onPageChange={vi.fn()}
      />
    );

    expect(screen.getByLabelText("Section navigation")).toHaveClass(colourShadowStrong);
  });

  it("includes Elite Advances under Abilities", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(
      <SectionDrawer
        navigation={getSheetNavigation(false)}
        activePage="stats"
        onPageChange={onPageChange}
      />
    );

    await user.click(screen.getByRole("button", { name: "Open section navigation" }));
    await user.click(screen.getByRole("button", { name: "Abilities" }));

    const abilityLabels = [
      "Elite Advances",
      "Psychic",
      "Skills",
      "Talents",
      "Traits",
      "Weapon Training",
    ];
    expect(
      screen
        .getAllByRole("button")
        .map((button) => button.textContent)
        .filter((label): label is string => abilityLabels.includes(label ?? ""))
    ).toEqual(abilityLabels);

    await user.click(screen.getByRole("button", { name: "Elite Advances" }));

    expect(onPageChange).toHaveBeenCalledWith("elite-advances");
  });

  it("uses one row style for categories, back navigation and pages", async () => {
    const user = userEvent.setup();

    render(
      <SectionDrawer
        navigation={getSheetNavigation(false)}
        activePage="psychic"
        onPageChange={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "Open section navigation" }));
    const categoryRow = screen.getByRole("button", { name: "Abilities" });

    await user.click(categoryRow);

    const backRow = screen.getByRole("button", { name: "Back to categories from Abilities" });
    const activePageRow = screen.getByRole("button", { name: "Psychic" });
    const inactivePageRow = screen.getByRole("button", { name: "Skills" });
    const sharedClasses = [
      "flex",
      "items-center",
      "gap-2",
      "w-full",
      "px-4",
      "py-3",
      "text-left",
      "text-sm",
      "transition",
      "hover:bg-slate-800",
      "active:scale-[0.98]",
      "focus-visible:ring-2",
      "focus-visible:ring-red-500",
    ];

    for (const row of [categoryRow, backRow, activePageRow, inactivePageRow]) {
      expect(row).toHaveClass(...sharedClasses);
    }

    expect(categoryRow.lastElementChild).toHaveAttribute("data-picker-arrow", "right");
    expect(backRow.lastElementChild).toHaveAttribute("data-picker-arrow", "left");
    expect(activePageRow).toHaveAttribute("aria-current", "page");
    expect(activePageRow).toHaveClass("text-red-500");
    expect(activePageRow).not.toHaveClass("font-semibold", "border-l-2");
    expect(inactivePageRow).toHaveClass("text-slate-200");
    expect(inactivePageRow).not.toHaveAttribute("aria-current");
  });

  it("opens directly on an externally requested category and retains local navigation", async () => {
    const user = userEvent.setup();
    const onExternalClose = vi.fn();

    render(
      <SectionDrawer
        navigation={getSheetNavigation(false)}
        activePage="stats"
        onPageChange={vi.fn()}
        externalOpen
        externalCategoryLabel="Equipment"
        onExternalClose={onExternalClose}
      />
    );

    expect(screen.getByRole("dialog", { name: "Section navigation" })).toHaveAttribute(
      "aria-hidden",
      "false"
    );
    expect(screen.getByRole("button", { name: "Weapons" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back to categories from Equipment" }));
    expect(screen.getByRole("button", { name: "Abilities" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close navigation" }));
    expect(onExternalClose).toHaveBeenCalledOnce();
  });

  it("lists a plain set of pages with no category level and marks the active page", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(
      <SectionDrawer
        navigation={{
          pages: [
            { id: "party", label: "Party" },
            { id: "custom-items", label: "Custom Item Library" },
            { id: "sessions", label: "Session History" },
          ],
        }}
        activePage="party"
        onPageChange={onPageChange}
      />
    );

    await user.click(screen.getByRole("button", { name: "Open section navigation" }));

    expect(screen.queryByRole("button", { name: /Back to categories/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Party" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Session History" })).not.toHaveAttribute(
      "aria-current"
    );

    await user.click(screen.getByRole("button", { name: "Custom Item Library" }));

    expect(onPageChange).toHaveBeenCalledWith("custom-items");
    expect(document.querySelector('[aria-label="Section navigation"]')).toHaveAttribute(
      "aria-hidden",
      "true"
    );
  });

  it("shows the Admin category only to the DM", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <SectionDrawer
        navigation={getSheetNavigation(true)}
        activePage="stats"
        onPageChange={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "Open section navigation" }));
    expect(screen.getByRole("button", { name: "Admin" })).toBeInTheDocument();
    unmount();

    render(
      <SectionDrawer
        navigation={getSheetNavigation(false)}
        activePage="stats"
        onPageChange={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "Open section navigation" }));
    expect(screen.queryByRole("button", { name: "Admin" })).not.toBeInTheDocument();
  });
});
