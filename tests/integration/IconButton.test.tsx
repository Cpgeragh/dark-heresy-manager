import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EditButton } from "../../src/ui/buttons/EditButton";
import { ViewButton } from "../../src/ui/buttons/ViewButton";

describe("icon buttons", () => {
  it("shows the icon and runs onClick when idle", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<EditButton label="Edit name" onClick={onClick} />);

    const button = screen.getByRole("button", { name: "Edit name" });
    expect(button.querySelector("svg")).not.toBeNull();
    await user.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("swaps the icon for a spinner, marks itself busy and ignores clicks while loading", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<ViewButton label="Reveal code" loading onClick={onClick} />);

    const button = screen.getByRole("button", { name: "Reveal code" });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();
    expect(button.querySelector("svg")).toBeNull();
    await user.click(button);

    expect(onClick).not.toHaveBeenCalled();
  });
});
