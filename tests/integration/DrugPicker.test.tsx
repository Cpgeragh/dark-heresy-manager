// tests/integration/DrugPicker.test.tsx
import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { DrugPicker } from "../../src/pages/CharacterSheet/DrugsTab/DrugPicker";

const DRUG_NAME = "Frenzon";

function row(name: string): HTMLButtonElement {
  return (screen.queryByRole("button", { name: `Select ${name}` }) ??
    screen.getByRole("button", { name: `Expand ${name} details` })) as HTMLButtonElement;
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

  it("shows the information icon on a row and a Duration line", () => {
    renderPicker();
    expect(
      screen.getByRole("button", { name: `Show information about ${DRUG_NAME}` })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: `Expand ${DRUG_NAME} details` }));
    expect(screen.getAllByText("Duration").length).toBeGreaterThan(0);
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
