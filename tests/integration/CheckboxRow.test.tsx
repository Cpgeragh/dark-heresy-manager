import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { CheckboxRow } from "../../src/ui/forms/CheckboxRow";
import { colourInputAccent } from "../../src/ui/styles/colourTokens";
import { uiTextBody } from "../../src/ui/styles/editableStyles";

describe("CheckboxRow", () => {
  it("names the checkbox by its sentence and reports the new value when pressed", async () => {
    const onChange = vi.fn();
    render(
      <CheckboxRow checked={false} onChange={onChange}>
        Keep this
      </CheckboxRow>
    );

    await userEvent.click(screen.getByRole("checkbox", { name: "Keep this" }));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("shows the checked state it is given", () => {
    render(
      <CheckboxRow checked onChange={vi.fn()}>
        Keep this
      </CheckboxRow>
    );

    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("uses the shared box size, red tick, text size and pointer cursor", () => {
    render(
      <CheckboxRow checked={false} onChange={vi.fn()}>
        Keep this
      </CheckboxRow>
    );

    expect(screen.getByRole("checkbox")).toHaveClass("h-4", "w-4", "shrink-0", colourInputAccent);
    expect(screen.getByText("Keep this").closest("label")).toHaveClass(
      "text-sm",
      "lg:text-base",
      uiTextBody,
      "cursor-pointer"
    );
  });

  it("keeps extra classes alongside the shared look", () => {
    render(
      <CheckboxRow checked={false} onChange={vi.fn()} className="justify-center">
        Keep this
      </CheckboxRow>
    );

    expect(screen.getByText("Keep this").closest("label")).toHaveClass(
      "justify-center",
      "items-start"
    );
  });

  it("marks the box required and hides the star from the accessible name", () => {
    render(
      <CheckboxRow required checked={false} onChange={vi.fn()}>
        Keep this
      </CheckboxRow>
    );

    expect(screen.getByRole("checkbox", { name: "Keep this" })).toBeRequired();
    expect(screen.getByText("*")).toHaveAttribute("aria-hidden", "true");
  });

  it("ignores presses and drops the pointer cursor while disabled", async () => {
    const onChange = vi.fn();
    render(
      <CheckboxRow checked={false} onChange={onChange} disabled>
        Keep this
      </CheckboxRow>
    );

    await userEvent.click(screen.getByRole("checkbox"));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("checkbox")).toBeDisabled();
    expect(screen.getByText("Keep this").closest("label")).not.toHaveClass("cursor-pointer");
  });
});
