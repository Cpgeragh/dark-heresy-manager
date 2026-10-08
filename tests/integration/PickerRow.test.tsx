import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PickerList, PickerRow } from "../../src/ui/pickers/PickerModal";
import { uiItemName, uiItemNameHover } from "../../src/ui/styles/editableStyles";

describe("uiItemNameHover", () => {
  it("is the item name style with the white hover", () => {
    expect(uiItemNameHover).toContain(uiItemName);
    expect(uiItemNameHover).toContain("group-hover:text-white");
  });

  it("lets the name react to its row only when the row can be pressed", () => {
    render(
      <>
        <PickerRow>
          <span className={uiItemNameHover}>Pressable</span>
        </PickerRow>
        <PickerRow interactive={false}>
          <span className={uiItemNameHover}>Read only</span>
        </PickerRow>
      </>
    );

    expect(screen.getByRole("button", { name: "Pressable" })).toHaveClass("group");
    expect(screen.getByRole("button", { name: "Read only" })).not.toHaveClass("group");
  });
});

describe("PickerRow", () => {
  it("renders the standard card look with card padding", () => {
    render(<PickerRow>Bolt pistol</PickerRow>);

    expect(screen.getByRole("button", { name: "Bolt pistol" })).toHaveClass(
      "rounded-lg",
      "border-slate-500",
      "bg-slate-900/60",
      "p-3"
    );
  });

  it("shows the trailing content after the main content", () => {
    render(<PickerRow trailing={<span data-testid="arrow" />}>Bolt pistol</PickerRow>);

    const row = screen.getByRole("button", { name: "Bolt pistol" });
    expect(row.querySelector("[data-testid='arrow']")).not.toBeNull();
    expect(row.firstElementChild).toHaveClass("flex", "items-center", "gap-3");
  });

  it("does not wrap its content when there is no trailing content", () => {
    render(<PickerRow>Bolt pistol</PickerRow>);

    expect(screen.getByRole("button", { name: "Bolt pistol" }).firstElementChild).toBeNull();
  });

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

describe("PickerList", () => {
  it("stacks its rows with spacing and padding and passes extra attributes through", () => {
    render(
      <PickerList data-testid="list" className="extra">
        <PickerRow>One</PickerRow>
        <PickerRow>Two</PickerRow>
      </PickerList>
    );

    expect(screen.getByTestId("list")).toHaveClass("space-y-3", "p-3", "lg:p-4", "extra");
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });
});
