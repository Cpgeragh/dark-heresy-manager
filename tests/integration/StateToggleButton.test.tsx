import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { StateToggleButton } from "../../src/ui/buttons/StateToggleButton";

function renderToggle(overrides: Partial<Parameters<typeof StateToggleButton>[0]> = {}) {
  return render(
    <StateToggleButton
      active={false}
      activeLabel="Stow"
      inactiveLabel="Wear"
      activeBusyLabel="Stowing"
      inactiveBusyLabel="Wearing"
      statusLabel="Worn"
      disabled={false}
      editable
      onChange={vi.fn()}
      {...overrides}
    />
  );
}

describe("StateToggleButton", () => {
  it("shows the inactive label and a matching title when inactive", () => {
    renderToggle();

    expect(screen.getByRole("button", { name: "Wear" })).toHaveAttribute("title", "Click to wear");
  });

  it("shows the active label and a matching title when active", () => {
    renderToggle({ active: true });

    expect(screen.getByRole("button", { name: "Stow" })).toHaveAttribute("title", "Click to stow");
  });

  it("keeps the three responsive sizes of the Equip button", () => {
    renderToggle();

    expect(screen.getByRole("button", { name: "Wear" })).toHaveClass(
      "sm:h-7",
      "sm:px-2.5",
      "md:h-8",
      "md:px-3",
      "md:text-sm"
    );
  });

  it("shows the status chip and no button when active and not editable", () => {
    renderToggle({ active: true, editable: false });

    expect(screen.getByText("Worn")).toHaveClass("h-5", "text-[10px]");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows nothing when inactive and not editable", () => {
    renderToggle({ editable: false });

    expect(screen.queryByText("Worn")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("blocks switching on when disabled, and uses the disabled title", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderToggle({ disabled: true, disabledTitle: "Slots full", onChange });

    const button = screen.getByRole("button", { name: "Wear" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("title", "Slots full");
    await user.click(button);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("still allows switching off when disabled and active", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderToggle({ active: true, disabled: true, onChange });

    await user.click(screen.getByRole("button", { name: "Stow" }));
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
