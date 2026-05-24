// tests/integration/CharacteristicField.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import CharacteristicField from "../../src/components/CharacteristicField";

describe("CharacteristicField", () => {
  it("renders with correct initial value", () => {
    const value = { base: 30, advances: 3 };

    render(
      <CharacteristicField
        label="Weapon Skill"
        value={value}
        editable={false}
        onChange={() => {}}
      />
    );

    expect(screen.getByText("Weapon Skill")).toBeInTheDocument();

    const baseInput = screen.getByRole("spinbutton");
    expect(baseInput).toHaveValue(30);

    const advanceButtons = screen.getAllByRole("button");
    const pressed = advanceButtons.filter(btn => btn.getAttribute("aria-pressed") === "true");
    expect(pressed).toHaveLength(3);

    // total = 30 + 3 * 5 = 45
    expect(screen.getByText("45")).toBeInTheDocument();
  });

  it("calls onChange when values change", () => {
    const value = { base: 30, advances: 5 };
    const onChange = vi.fn();

    render(
      <CharacteristicField
        label="WS"
        value={value}
        editable={true}
        onChange={onChange}
      />
    );

    const inputs = screen.getAllByRole("spinbutton");
    const baseInput = inputs[0];

    fireEvent.change(baseInput, { target: { value: "40" } });

    expect(onChange).toHaveBeenCalled();
  });
});