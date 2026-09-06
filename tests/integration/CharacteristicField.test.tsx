// tests/integration/CharacteristicField.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import { CharacteristicField } from "../../src/components/CharacteristicField";

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

    // Component uses type="text" + inputMode="numeric" — role is textbox, not spinbutton
    const baseInput = screen.getByRole("textbox", { name: /weapon skill base value/i });
    expect(baseInput).toHaveValue("30");

    const pressed = screen
      .getAllByRole("button")
      .filter((btn) => btn.getAttribute("aria-pressed") === "true");
    expect(pressed).toHaveLength(3);

    // total = 30 + 3 * 5 = 45
    expect(screen.getByText("45")).toBeInTheDocument();
  });

  it("keeps advance colours at full opacity in read-only mode", () => {
    render(
      <CharacteristicField
        label="Weapon Skill"
        value={{ base: 30, advances: 2 }}
        editable={false}
        onChange={() => {}}
        tierCosts={[100, 250, 500, 750]}
      />
    );

    for (const advance of screen.getAllByRole("button")) {
      expect(advance).toBeDisabled();
      expect(advance).not.toHaveClass("opacity-50");
    }
  });

  it("calls onChange when values change", () => {
    const value = { base: 30, advances: 3 };
    const onChange = vi.fn();

    render(<CharacteristicField label="WS" value={value} editable={true} onChange={onChange} />);

    const baseInput = screen.getByRole("textbox", { name: /ws base value/i });

    // Component commits on blur, not on every keystroke
    fireEvent.change(baseInput, { target: { value: "40" } });
    fireEvent.blur(baseInput);

    expect(onChange).toHaveBeenCalled();
  });

  it("shows a cost label under each advance square when tierCosts are given", () => {
    render(
      <CharacteristicField
        label="Weapon Skill"
        value={{ base: 30, advances: 0 }}
        editable
        onChange={() => {}}
        tierCosts={[100, 250, 500, 750]}
      />
    );

    for (const cost of ["100", "250", "500", "750"]) {
      expect(screen.getByText(cost)).toBeInTheDocument();
    }
  });

  it("requires confirmation before purchasing a Characteristic advance", () => {
    const onChange = vi.fn();
    render(
      <CharacteristicField
        label="Weapon Skill"
        value={{ base: 30, advances: 0 }}
        editable
        onChange={onChange}
        tierCosts={[100, 250, 500, 750]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /weapon skill advance 1 of 4/i }));
    expect(onChange).not.toHaveBeenCalled();
    const dialog = screen.getByRole("dialog", { name: "Upgrade Characteristic" });
    expect(dialog).toHaveTextContent("Upgrade Weapon Skill from 0 to 1 advance for 100 XP?");

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onChange).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("dialog", { name: "Upgrade Characteristic" })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /weapon skill advance 1 of 4/i }));
    fireEvent.click(screen.getByRole("button", { name: "Upgrade" }));
    expect(onChange).toHaveBeenCalledWith({ base: 30, advances: 1 });
  });

  it("confirms the combined cost when purchasing several tiers at once", () => {
    const onChange = vi.fn();
    render(
      <CharacteristicField
        label="Ballistic Skill"
        value={{ base: 30, advances: 0 }}
        editable
        onChange={onChange}
        tierCosts={[250, 500, 750, 1000]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /ballistic skill advance 4 of 4/i }));
    const dialog = screen.getByRole("dialog", { name: "Upgrade Characteristic" });
    expect(dialog).toHaveTextContent("Upgrade Ballistic Skill from 0 to 4 advances for 2500 XP?");
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Upgrade" }));
    expect(onChange).toHaveBeenCalledWith({ base: 30, advances: 4 });
  });

  it("requires confirmation and shows the refund before reducing advances", () => {
    const onChange = vi.fn();
    render(
      <CharacteristicField
        label="Ballistic Skill"
        value={{ base: 30, advances: 4 }}
        editable
        onChange={onChange}
        tierCosts={[250, 500, 750, 1000]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /ballistic skill advance 1 of 4/i }));
    expect(onChange).not.toHaveBeenCalled();
    const dialog = screen.getByRole("dialog", { name: "Downgrade Characteristic" });
    expect(dialog).toHaveTextContent(
      "Downgrade Ballistic Skill from 4 to 0 advances and refund 2500 XP?"
    );

    fireEvent.click(screen.getByRole("button", { name: "Downgrade" }));
    expect(onChange).toHaveBeenCalledWith({ base: 30, advances: 0 });
  });

  it("shows no cost labels when tierCosts is omitted", () => {
    render(
      <CharacteristicField
        label="Weapon Skill"
        value={{ base: 30, advances: 0 }}
        editable
        onChange={() => {}}
      />
    );

    expect(screen.queryByText("100")).not.toBeInTheDocument();
  });

  it("disables a null-cost tier even when editable, and blocks the click", () => {
    const onChange = vi.fn();
    render(
      <CharacteristicField
        label="Fellowship"
        value={{ base: 30, advances: 0 }}
        editable
        onChange={onChange}
        tierCosts={[null, null, null, null]}
      />
    );

    const firstAdvance = screen.getByRole("button", { name: /fellowship advance 1 of 4/i });
    expect(firstAdvance).toBeDisabled();
    expect(firstAdvance).toHaveAccessibleName(/not available for this career/i);

    fireEvent.click(firstAdvance);
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByText("100")).not.toBeInTheDocument();
  });

  it("distinguishes a locked (null) tier from an uncosted (undefined) tier in the accessible name", () => {
    render(
      <CharacteristicField
        label="Weapon Skill"
        value={{ base: 30, advances: 0 }}
        editable
        onChange={() => {}}
        tierCosts={[100, null, undefined, undefined]}
      />
    );

    expect(
      screen.getByRole("button", { name: /weapon skill advance 1 of 4, 100 xp/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /weapon skill advance 2 of 4, not available for this career/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^weapon skill advance 3 of 4$/i })
    ).toBeInTheDocument();
  });
});
