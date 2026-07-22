// tests/integration/ImplantPicker.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { ImplantPicker } from "../../src/pages/characterSheet/CyberneticsTab/ImplantPicker";

// "Auger Arrays" is a real reference entry with no requiresLocation and a
// fixed (non-variable) cost, so clicking it goes straight to the
// craftsmanship step with no location sub-step in between.
const IMPLANT_NAME = "Auger Arrays";

function row(name: string): HTMLButtonElement {
  const match = screen
    .getAllByText(name)
    .map((el) => el.closest("button"))
    .find((el): el is HTMLButtonElement => el !== null);
  if (!match) throw new Error(`No button row found for: ${name}`);
  return match;
}

function renderPicker(editable = true) {
  const onSelect = vi.fn();
  const onClose = vi.fn();
  render(<ImplantPicker editable={editable} onSelect={onSelect} onClose={onClose} />);
  return { onSelect, onClose };
}

describe("ImplantPicker", () => {
  it("renders implants from reference data", () => {
    renderPicker();
    expect(screen.getAllByText(IMPLANT_NAME).length).toBeGreaterThan(0);
  });

  it("opens the craftsmanship step and calls onSelect with the chosen grade", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPicker();
    await user.click(row(IMPLANT_NAME));
    expect(screen.getByText("Select craftsmanship quality:")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Good" }));
    await user.click(screen.getByRole("button", { name: "Install" }));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ name: IMPLANT_NAME }),
      "Good",
      undefined,
      undefined,
      undefined
    );
  });

  it("does not open the craftsmanship step in read-only mode", async () => {
    const user = userEvent.setup();
    renderPicker(false);
    await user.click(row(IMPLANT_NAME));
    expect(screen.queryByText("Select craftsmanship quality:")).not.toBeInTheDocument();
  });
});
