import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";
import { HomeworldTraitAcquisitionModal } from "../../src/pages/CharacterSheet/HomeworldTraitAcquisitionModal";

describe("HomeworldTraitAcquisitionModal", () => {
  it("records Noble Born's additional Peer group", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<HomeworldTraitAcquisitionModal homeworldId="noble-born" onComplete={onComplete} onClose={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /Additional Peer group/ }));
    await user.click(screen.getByText("Mercantile"));
    await user.click(screen.getByRole("button", { name: "Apply Homeworld" }));
    expect(onComplete).toHaveBeenCalledWith({ peerGroup: "Mercantile" });
  });

  it("records both Schola weapon-group choices", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<HomeworldTraitAcquisitionModal homeworldId="schola-progenium" onComplete={onComplete} onClose={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /Basic Weapon Training/ }));
    await user.click(screen.getByText("Las"));
    await user.click(screen.getByRole("button", { name: /Pistol Weapon Training/ }));
    await user.click(screen.getByText("SP"));
    await user.click(screen.getByRole("button", { name: "Apply Homeworld" }));
    expect(onComplete).toHaveBeenCalledWith({ basicWeaponGroup: "Las", pistolWeaponGroup: "SP" });
  });

  it("accepts only the 1d5+2 range for Mind Cleansed starting Insanity", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<HomeworldTraitAcquisitionModal homeworldId="mind-cleansed" onComplete={onComplete} onClose={vi.fn()} />);
    const input = screen.getByLabelText(/Starting Insanity Points/);
    const apply = screen.getByRole("button", { name: "Apply Homeworld" });
    await user.type(input, "2");
    expect(apply).toBeDisabled();
    await user.clear(input);
    await user.type(input, "7");
    await user.click(apply);
    expect(onComplete).toHaveBeenCalledWith({ startingInsanity: 7 });
  });
});
