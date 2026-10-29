import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { PickerField } from "../../src/ui/pickers/PickerField";

describe("PickerField", () => {
  it("fills on hover and shrinks on press while it can be used", async () => {
    const onClick = vi.fn();
    render(
      <PickerField id="rarity" label="Rarity" value="Rare" placeholder="Choose" onClick={onClick} />
    );

    const field = screen.getByRole("button", { name: /Rarity/ });
    expect(field).toHaveClass("enabled:hover:bg-slate-800", "active:scale-press", "transition");

    await userEvent.click(field);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("gets neither hover nor press while disabled", () => {
    render(
      <PickerField
        id="rarity"
        label="Rarity"
        value="Rare"
        placeholder="Choose"
        onClick={vi.fn()}
        disabled
      />
    );

    const field = screen.getByRole("button", { name: /Rarity/ });
    expect(field).toBeDisabled();
    expect(field).not.toHaveClass("enabled:hover:bg-slate-800");
    expect(field).not.toHaveClass("active:scale-press");
  });
});
