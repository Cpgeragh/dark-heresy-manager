import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SectionDrawer } from "../../src/components/SectionDrawer";

describe("SectionDrawer", () => {
  it("includes Elite Advances under Abilities", async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();

    render(<SectionDrawer activeTab="stats" onTabChange={onTabChange} isDM={false} />);

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

    expect(onTabChange).toHaveBeenCalledWith("elite-advances");
  });

  it("uses one row style for categories, back navigation and pages", async () => {
    const user = userEvent.setup();

    render(<SectionDrawer activeTab="psychic" onTabChange={vi.fn()} isDM={false} />);

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
        activeTab="stats"
        onTabChange={vi.fn()}
        isDM={false}
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
});
