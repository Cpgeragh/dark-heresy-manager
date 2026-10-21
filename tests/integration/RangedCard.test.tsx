// tests/integration/RangedCard.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { RangedCard } from "../../src/pages/CharacterSheet/weapons/RangedCard";
import type { RangedWeapon, GrenadeItem } from "../../src/types/Character";

const baseWeapon: RangedWeapon = {
  id: "w1",
  name: "Custom Lasgun",
  class: "Basic",
  damage: "1d10+3 E",
  range: "100m",
  clip: "60",
  pen: "0",
  rld: "Full",
  weight: "4 kg",
  value: "50 Thrones",
  availability: "Common",
  ammoType: "Las",
  custom: true,
};

function renderCard(props: Partial<React.ComponentProps<typeof RangedCard>> = {}) {
  const onRemove = vi.fn();
  const onAddUpgrade = vi.fn();
  const onRemoveUpgrade = vi.fn();
  const onUpdateAmmoEntries = vi.fn();
  const onUpdateQuantity = vi.fn();
  render(
    <RangedCard
      weapon={baseWeapon}
      editable={true}
      forceExpanded
      onRemove={onRemove}
      onAddUpgrade={onAddUpgrade}
      onRemoveUpgrade={onRemoveUpgrade}
      onUpdateAmmoEntries={onUpdateAmmoEntries}
      onUpdateQuantity={onUpdateQuantity}
      {...props}
    />
  );
  return { onRemove, onAddUpgrade, onRemoveUpgrade, onUpdateAmmoEntries, onUpdateQuantity };
}

// "Ammo" and "Upgrades" sections each render their own "+ Add" button as siblings
// of the section label, so disambiguate by walking up from the label text.
function addButtonNear(labelText: string): HTMLElement {
  const label = screen.getByText(labelText);
  const button = label.parentElement!.querySelector("button");
  if (!button) throw new Error(`No button found near label: ${labelText}`);
  return button;
}

describe("RangedCard shared header", () => {
  it("shows the Remove button in the closed header", () => {
    renderCard({ forceExpanded: false, isEquipped: false });
    expect(screen.queryByText("Qualities")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Custom Lasgun" })).toBeInTheDocument();
  });

  it("shows an information button beside the name even without a description", () => {
    renderCard();
    expect(
      screen.getByRole("button", { name: "Show information about Custom Lasgun" })
    ).toBeInTheDocument();
  });
});

describe("RangedCard rules", () => {
  it("shows a Rules information button when the weapon has rules", () => {
    renderCard({ weapon: { ...baseWeapon, rules: "Jams on a roll of 96." } });
    expect(
      screen.getByRole("button", { name: "Show information about Custom Lasgun Rules" })
    ).toBeInTheDocument();
  });

  it("shows a hyphen on the Rules line when the weapon has no rules", () => {
    renderCard();
    expect(screen.getByText("Rules").parentElement).toHaveTextContent("Rules-");
  });
});

describe("RangedCard upgrades", () => {
  it("opens the upgrade picker and adds a compatible upgrade", async () => {
    const user = userEvent.setup();
    const { onAddUpgrade } = renderCard();
    await user.click(addButtonNear("Upgrades"));
    expect(screen.getByText("Add Upgrade")).toBeInTheDocument();
    await user.click(screen.getByText("Compact"));
    expect(onAddUpgrade).toHaveBeenCalledWith("cr-compact");
  });

  it("removes a fitted upgrade", async () => {
    const user = userEvent.setup();
    const { onRemoveUpgrade } = renderCard({ weapon: { ...baseWeapon, upgrades: ["cr-compact"] } });
    // "Compact" also appears (hidden) in the not-yet-open InfoModal portal, so take the first match.
    const compactLabel = screen.getAllByText("Compact")[0];
    const removeBtn = compactLabel.parentElement!.querySelector("button")!;
    await user.click(removeBtn);
    expect(onRemoveUpgrade).not.toHaveBeenCalled();
    expect(screen.getByText("Remove Compact from this weapon?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(onRemoveUpgrade).toHaveBeenCalledWith("cr-compact");
  });
});

describe("RangedCard remove", () => {
  it("calls onRemove only after removal is confirmed", async () => {
    const user = userEvent.setup();
    const { onRemove } = renderCard();

    await user.click(screen.getByRole("button", { name: "Remove Custom Lasgun" }));
    expect(onRemove).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it("shows no Remove button when the caller gives no removal", () => {
    renderCard({ integrated: true, onRemove: undefined });

    expect(screen.queryByRole("button", { name: "Remove Custom Lasgun" })).not.toBeInTheDocument();
  });
});

describe("RangedCard Knave of Pistols penalty", () => {
  it("marks a non-pistol ranged weapon with the −10 Ballistic Skill penalty", () => {
    renderCard({ knaveOfPistols: true });
    expect(screen.getByText("Knave: BS −10")).toBeInTheDocument();
  });

  it("does not penalise a pistol", () => {
    renderCard({
      knaveOfPistols: true,
      weapon: { ...baseWeapon, class: "Pistol" },
    });
    expect(screen.queryByText("Knave: BS −10")).not.toBeInTheDocument();
  });
});

describe("RangedCard equip toggle", () => {
  it("calls onToggleEquip when the equip button is clicked", async () => {
    const user = userEvent.setup();
    const onToggleEquip = vi.fn();
    renderCard({ onToggleEquip, isEquipped: false });
    await user.click(screen.getByRole("button", { name: "Equip" }));
    expect(onToggleEquip).toHaveBeenCalled();
  });
});

describe("RangedCard grenade launcher", () => {
  const grenadeLauncher: RangedWeapon = {
    id: "gl1",
    name: "Grenade Launcher",
    referenceId: "cr-grenade-launcher",
  };

  it("shows carried grenades", () => {
    const grenades: GrenadeItem[] = [{ id: "g1", name: "Frag Grenade", quantity: 3 }];
    renderCard({ weapon: grenadeLauncher, grenades });
    expect(screen.getByText("Frag Grenade")).toBeInTheDocument();
  });

  it("shows an empty-state message when there are no grenades", () => {
    renderCard({ weapon: grenadeLauncher, grenades: [] });
    expect(screen.getByText(/No grenades/)).toBeInTheDocument();
  });
});

describe("RangedCard thrown weapon", () => {
  const thrownWeapon: RangedWeapon = {
    id: "t1",
    name: "Throwing Star",
    class: "Thrown",
    custom: true,
    quantity: 2,
  };

  it("shows a quantity stepper instead of an ammo section", () => {
    renderCard({ weapon: thrownWeapon });
    expect(screen.getByText("Quantity")).toBeInTheDocument();
    expect(screen.queryByText("Ammo")).not.toBeInTheDocument();
  });

  it("calls onUpdateQuantity when the stepper is incremented", async () => {
    const user = userEvent.setup();
    const { onUpdateQuantity } = renderCard({ weapon: thrownWeapon });
    await user.click(screen.getByRole("button", { name: "Increase quantity" }));
    expect(onUpdateQuantity).toHaveBeenCalledWith(3);
  });
});

describe("RangedCard craftsmanship", () => {
  it("shows the craftsmanship description in an info modal", async () => {
    const user = userEvent.setup();
    renderCard();
    await user.click(screen.getByRole("button", { name: "Show information about Common Weapon" }));
    expect(screen.getByText(/no additional modifier/)).toBeInTheDocument();
  });
});

describe("RangedCard ammo picker", () => {
  it("opens the ammo picker and adds an existing ammo type", async () => {
    const user = userEvent.setup();
    const { onUpdateAmmoEntries } = renderCard();
    await user.click(addButtonNear("Ammo"));
    expect(screen.getByText("Add Ammo Type")).toBeInTheDocument();
    await user.click(screen.getByText("Charge Pack (Pistol)"));
    expect(onUpdateAmmoEntries).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          referenceId: "cr-charge-pack-pistol",
          name: "Charge Pack (Pistol)",
          loaded: true,
        }),
      ],
      { optimistic: true }
    );
  });

  it("adds a custom/unlisted ammo type", async () => {
    const user = userEvent.setup();
    const { onUpdateAmmoEntries } = renderCard();
    await user.click(addButtonNear("Ammo"));
    await user.type(screen.getByPlaceholderText("Ammo name…"), "Homemade Slugs");
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(onUpdateAmmoEntries).toHaveBeenCalledWith(
      [expect.objectContaining({ name: "Homemade Slugs", referenceId: undefined, loaded: true })],
      { optimistic: true }
    );
  });
});

describe("RangedCard ammo optimistic saves", () => {
  const entries = [
    {
      id: "e1",
      referenceId: "cr-charge-pack-pistol",
      name: "Charge Pack (Pistol)",
      clips: 1,
      rounds: 0,
      loaded: true,
    },
    {
      id: "e2",
      referenceId: "cr-charge-pack-basic",
      name: "Charge Pack (Basic)",
      clips: 0,
      rounds: 5,
      loaded: false,
    },
  ];

  it("asks for confirmation and waits for the server when an ammo type is removed", async () => {
    const user = userEvent.setup();
    const { onUpdateAmmoEntries } = renderCard({ weapon: { ...baseWeapon, ammoEntries: entries } });

    await user.click(screen.getByRole("button", { name: "Remove Charge Pack (Basic)" }));
    expect(onUpdateAmmoEntries).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(onUpdateAmmoEntries).toHaveBeenCalledWith([expect.objectContaining({ id: "e1" })]);
  });

  it("keeps the Remove pop-up open when removing an ammo type is refused", async () => {
    const user = userEvent.setup();
    const onUpdateAmmoEntries = vi.fn().mockResolvedValue(false);
    renderCard({ weapon: { ...baseWeapon, ammoEntries: entries }, onUpdateAmmoEntries });

    await user.click(screen.getByRole("button", { name: "Remove Charge Pack (Basic)" }));
    await user.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() => expect(onUpdateAmmoEntries).toHaveBeenCalledOnce());
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("asks for an optimistic save when a different ammo type is marked as loaded", async () => {
    const user = userEvent.setup();
    const { onUpdateAmmoEntries } = renderCard({ weapon: { ...baseWeapon, ammoEntries: entries } });

    await user.click(screen.getByRole("button", { name: "Mark Charge Pack (Basic) as loaded" }));

    expect(onUpdateAmmoEntries).toHaveBeenCalledWith(
      [
        expect.objectContaining({ id: "e1", loaded: false }),
        expect.objectContaining({ id: "e2", loaded: true }),
      ],
      { optimistic: true }
    );
  });

  it("asks for an optimistic save when a round count changes", async () => {
    const user = userEvent.setup();
    const { onUpdateAmmoEntries } = renderCard({ weapon: { ...baseWeapon, ammoEntries: entries } });

    await user.click(screen.getAllByRole("button", { name: "Increase quantity" })[0]);

    await waitFor(() => expect(onUpdateAmmoEntries).toHaveBeenCalled());
    expect(onUpdateAmmoEntries).toHaveBeenLastCalledWith(expect.any(Array), { optimistic: true });
  });
});
