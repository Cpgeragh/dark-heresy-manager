// tests/integration/ArcheotechWeaponCard.test.tsx
import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { ArcheotechWeaponCard } from "../../src/pages/CharacterSheet/weapons/ArcheotechWeaponCard";
import type { ArcheotechItem } from "../../src/types/Character";

function renderCard(item: ArcheotechItem) {
  const onRemove = vi.fn();
  render(<ArcheotechWeaponCard item={item} editable onRemove={onRemove} isEquipped />);
  fireEvent.click(screen.getByRole("button", { name: /^Expand .* details$/ }));
  return { onRemove };
}

describe("ArcheotechWeaponCard shared header and Rules line", () => {
  it("shows the Remove button in the closed header", () => {
    render(
      <ArcheotechWeaponCard
        item={{ id: "a4", name: "Custom Trinket" }}
        editable
        onRemove={vi.fn()}
        isEquipped={false}
      />
    );
    expect(screen.queryByText("Qualities")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Custom Trinket" })).toBeInTheDocument();
  });

  it("shows an information button beside the name and a hyphen on the Rules line", () => {
    renderCard({ id: "a5", name: "Custom Trinket" });
    expect(
      screen.getByRole("button", { name: "Show information about Custom Trinket" })
    ).toBeInTheDocument();
    expect(screen.getByText("Rules").parentElement).toHaveTextContent("Rules-");
  });
});

describe("ArcheotechWeaponCard expansion", () => {
  it("starts collapsed even when equipped", () => {
    render(
      <ArcheotechWeaponCard
        item={{ id: "a6", name: "Custom Trinket" }}
        editable
        onRemove={vi.fn()}
        isEquipped
      />
    );
    expect(
      screen.getByRole("button", { name: "Expand Custom Trinket details" })
    ).toBeInTheDocument();
    expect(screen.queryByText("Qualities")).not.toBeInTheDocument();
  });
});

describe("ArcheotechWeaponCard weapon-class chip", () => {
  it("shows an orange Melee chip for a melee weapon", () => {
    // Real reference entry: Midath-Pattern Power Glove, weaponClass "Melee".
    renderCard({
      id: "a1",
      name: "Midath-Pattern Power Glove",
      referenceId: "lw-midath-power-glove",
    });
    expect(screen.getByText("Melee")).toBeInTheDocument();
  });

  it("shows the real Ranged sub-class chip when the reference has one (e.g. Basic)", () => {
    // Real reference entry: Reclamator Rifle, weaponClass "Basic", a specific
    // Ranged sub-class, not just the broad "Ranged" category.
    renderCard({ id: "a2", name: "Reclamator Rifle", referenceId: "lw-reclamator-rifle" });
    expect(screen.getByText("Basic")).toBeInTheDocument();
  });

  it("shows no weapon-class chip when the item has no weaponClass and no matching reference", () => {
    renderCard({ id: "a3", name: "Custom Trinket" });
    expect(screen.queryByText("Melee")).not.toBeInTheDocument();
    expect(screen.queryByText("Basic")).not.toBeInTheDocument();
  });
});

describe("ArcheotechWeaponCard remove", () => {
  it("calls onRemove only after removal is confirmed", async () => {
    const user = userEvent.setup();
    const { onRemove } = renderCard({
      id: "a2",
      name: "Reclamator Rifle",
      referenceId: "lw-reclamator-rifle",
    });

    await user.click(screen.getByRole("button", { name: "Remove Reclamator Rifle" }));
    expect(onRemove).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(onRemove).toHaveBeenCalledOnce();
  });
});
