// tests/integration/EquipToggle.test.tsx
import { describe, it, expect, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { EquipToggle } from "../../src/pages/CharacterSheet/weapons/weaponShared";

describe("EquipToggle", () => {
  it("shows Equip when not equipped and Unequip when equipped", () => {
    const { rerender } = render(
      <EquipToggle equipped={false} disabled={false} editable onChange={vi.fn()} />
    );
    expect(screen.getByRole("button", { name: "Equip" })).toBeInTheDocument();

    rerender(<EquipToggle equipped disabled={false} editable onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Unequip" })).toBeInTheDocument();
  });

  it("shows an Equipped chip with no button when not editable", () => {
    render(<EquipToggle equipped disabled={false} editable={false} onChange={vi.fn()} />);
    expect(screen.getByText("Equipped")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders nothing when not equipped and not editable", () => {
    render(<EquipToggle equipped={false} disabled={false} editable={false} onChange={vi.fn()} />);
    expect(screen.queryByText(/Equip/)).not.toBeInTheDocument();
  });

  it("shows a busy Equipping state while equipping is being saved, then settles", async () => {
    const user = userEvent.setup();
    let finish: () => void = () => undefined;
    const onChange = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    );
    render(<EquipToggle equipped={false} disabled={false} editable onChange={onChange} />);

    const button = screen.getByRole("button", { name: "Equip" });
    await user.click(button);

    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();

    await act(async () => finish());
    expect(button).not.toHaveAttribute("aria-busy");
  });

  it("shows a busy Unequipping state while unequipping is being saved, then settles", async () => {
    const user = userEvent.setup();
    let finish: () => void = () => undefined;
    const onChange = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    );
    render(<EquipToggle equipped disabled={false} editable onChange={onChange} />);

    const button = screen.getByRole("button", { name: "Unequip" });
    await user.click(button);

    expect(button).toHaveAttribute("aria-busy", "true");

    await act(async () => finish());
    expect(button).not.toHaveAttribute("aria-busy");
  });

  it("blocks equipping when disabled but still allows unequipping", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <EquipToggle equipped={false} disabled editable onChange={onChange} />
    );
    await user.click(screen.getByRole("button", { name: "Equip" }));
    expect(onChange).not.toHaveBeenCalled();

    rerender(<EquipToggle equipped disabled editable onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Unequip" }));
    expect(onChange).toHaveBeenCalled();
  });
});
