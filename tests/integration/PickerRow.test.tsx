import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PickerRow } from "../../src/ui/pickers/PickerModal";

describe("PickerRow", () => {
  it("shows a spinner and ignores clicks while a promise-returning click is pending", async () => {
    const user = userEvent.setup();
    let finish: () => void = () => undefined;
    const onClick = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    );
    render(<PickerRow onClick={onClick}>Bolt pistol</PickerRow>);

    await user.click(screen.getByRole("button", { name: "Bolt pistol" }));
    const row = screen.getByRole("button", { name: "Bolt pistol" });
    expect(row).toHaveAttribute("aria-busy", "true");
    expect(row).toBeDisabled();
    expect(row.querySelector("span[aria-hidden='true']")).not.toBeNull();
    await user.click(row);
    expect(onClick).toHaveBeenCalledTimes(1);

    await act(async () => finish());
    const recovered = screen.getByRole("button", { name: "Bolt pistol" });
    expect(recovered).not.toHaveAttribute("aria-busy");
    expect(recovered.querySelector("span[aria-hidden='true']")).toBeNull();
  });

  it("does not go busy when the click handler returns nothing", async () => {
    const user = userEvent.setup();
    render(<PickerRow onClick={() => undefined}>Bolt pistol</PickerRow>);

    await user.click(screen.getByRole("button", { name: "Bolt pistol" }));

    expect(screen.getByRole("button", { name: "Bolt pistol" })).not.toHaveAttribute("aria-busy");
  });
});
