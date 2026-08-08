// tests/integration/DrugPicker.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { DrugPicker } from "../../src/pages/characterSheet/DrugsTab/DrugPicker";

const DRUG_NAME = "Frenzon";

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
  render(<DrugPicker editable={editable} onSelect={onSelect} onClose={onClose} />);
  return { onSelect, onClose };
}

describe("DrugPicker", () => {
  it("renders drugs from reference data", () => {
    renderPicker();
    expect(screen.getAllByText(DRUG_NAME).length).toBeGreaterThan(0);
  });

  it("renders IH drugs but excludes IH medical gear", () => {
    renderPicker();
    expect(screen.getByText("Dryas")).toBeInTheDocument();
    expect(screen.getByText("Night Dust")).toBeInTheDocument();
    expect(screen.queryByText("Cast Spray")).not.toBeInTheDocument();
  });

  it("filters the list by search query", async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.type(screen.getByPlaceholderText("Search drugs…"), "frenzon");
    expect(screen.getAllByText(DRUG_NAME).length).toBeGreaterThan(0);
    expect(screen.queryByText("Obscura")).not.toBeInTheDocument();
  });

  it("calls onSelect with the chosen ref when a drug is clicked", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPicker();
    await user.click(row(DRUG_NAME));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ name: DRUG_NAME }));
  });

  it("does not call onSelect when clicked in read-only mode", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPicker(false);
    await user.click(row(DRUG_NAME));
    expect(onSelect).not.toHaveBeenCalled();
  });
});
