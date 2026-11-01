import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { AmmoEntryRow } from "../../src/pages/CharacterSheet/weapons/AmmoEntryRow";
import type { WeaponAmmoEntry } from "../../src/types/Character";

const entry: WeaponAmmoEntry = {
  id: "a1",
  name: "Charge Pack (Las)",
  clips: 2,
  rounds: 5,
  loaded: false,
};

function renderRow(ammoTracking: "loose" | "clip") {
  const handlers = {
    onSetLoaded: vi.fn(),
    onRemove: vi.fn(),
    onUpdateClips: vi.fn(),
    onUpdateRounds: vi.fn(),
    onSetLooseRounds: vi.fn(),
  };
  render(
    <AmmoEntryRow
      entry={entry}
      isLoaded={false}
      editable
      clipSize="30"
      ammoTracking={ammoTracking}
      {...handlers}
    />
  );
  return handlers;
}

describe("AmmoEntryRow labelled lines", () => {
  it("shows one Rounds line when ammunition is tracked loose", () => {
    renderRow("loose");

    expect(screen.getByText("Rounds")).toBeInTheDocument();
    expect(screen.queryByText("Clips")).not.toBeInTheDocument();
  });

  it("shows Clips and then Rounds when ammunition is tracked in clips", () => {
    renderRow("clip");

    const labels = screen.getAllByText(/^(Clips|Rounds)$/).map((label) => label.textContent);
    expect(labels).toEqual(["Clips", "Rounds"]);
  });

  it("saves a changed clip count from the Clips line", async () => {
    const user = userEvent.setup();
    const { onUpdateClips } = renderRow("clip");

    await user.click(screen.getAllByRole("button", { name: "Increase quantity" })[0]);

    expect(onUpdateClips).toHaveBeenCalledWith(3);
  });

  it("opens the ammunition rules from the Rules line", async () => {
    const user = userEvent.setup();
    renderRow("clip");

    expect(screen.getByText("Rules")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Show information about Charge Pack (Las)" })
    );

    expect(screen.getByRole("dialog", { name: "Charge Pack (Las)" })).toHaveTextContent(
      "Recharging Power Packs"
    );
  });
});
