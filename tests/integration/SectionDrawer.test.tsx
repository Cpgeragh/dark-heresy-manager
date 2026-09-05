import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SectionDrawer } from "../../src/components/SectionDrawer";

describe("SectionDrawer", () => {
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
