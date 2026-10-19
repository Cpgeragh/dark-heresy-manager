// tests/integration/GrenadeCard.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { GrenadeCard } from "../../src/pages/CharacterSheet/weapons/GrenadeCard";
import type { GrenadeItem } from "../../src/types/Character";

const baseItem: GrenadeItem = {
  id: "g1",
  name: "Custom Frag",
  quantity: 5,
  type: "Grenade",
  class: "Thrown",
  damage: "2d10 X",
  pen: "0",
  weight: "0.5 kg",
  value: "10 Thrones",
  availability: "Common",
  custom: true,
};

function renderCard(props: Partial<React.ComponentProps<typeof GrenadeCard>> = {}) {
  const onRemove = vi.fn();
  const onUpdateQty = vi.fn();
  render(
    <GrenadeCard
      item={baseItem}
      editable={true}
      strengthBonus={4}
      isEquipped
      onRemove={onRemove}
      onUpdateQty={onUpdateQty}
      {...props}
    />
  );
  return { onRemove, onUpdateQty };
}

describe("GrenadeCard shared header", () => {
  it("shows the Remove button in the closed header and the chevron last", () => {
    renderCard({ isEquipped: false, onToggleEquip: vi.fn() });
    expect(screen.queryByText("Range")).not.toBeInTheDocument();
    const remove = screen.getByRole("button", { name: "Remove Custom Frag" });
    const expand = screen.getByRole("button", { name: "Expand Custom Frag details" });
    expect(remove).toBeInTheDocument();
    expect(
      remove.compareDocumentPosition(screen.getByRole("button", { name: "Equip" })) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(expand).toBeInTheDocument();
  });

  it("shows an information button beside the name and a hyphen on the Rules line", () => {
    renderCard();
    expect(
      screen.getByRole("button", { name: "Show information about Custom Frag" })
    ).toBeInTheDocument();
    expect(screen.getByText("Rules").parentElement).toHaveTextContent("Rules-");
  });
});

describe("GrenadeCard rules", () => {
  it("shows a Rules information button when the grenade has rules", () => {
    renderCard({ item: { ...baseItem, rules: "Fills a 3m area." } });
    expect(
      screen.getByRole("button", { name: "Show information about Custom Frag Rules" })
    ).toBeInTheDocument();
    expect(screen.getByText("Rules").parentElement).not.toHaveTextContent("Rules-");
  });
});

describe("GrenadeCard header label", () => {
  it("shows a Grenade type chip and a Thrown class chip for a grenade", () => {
    renderCard();
    expect(screen.getByText("Grenade")).toBeInTheDocument();
    expect(screen.getByText("Thrown")).toBeInTheDocument();
  });

  it("shows a Mine type chip and an Exotic class chip (not Grenade/Thrown) for a mine", () => {
    renderCard({ item: { ...baseItem, type: "Mine", class: "Exotic" } });
    expect(screen.getByText("Mine")).toBeInTheDocument();
    expect(screen.getByText("Exotic")).toBeInTheDocument();
    expect(screen.queryByText("Grenade")).not.toBeInTheDocument();
    expect(screen.queryByText("Thrown")).not.toBeInTheDocument();
  });
});

describe("GrenadeCard Range stat", () => {
  it("shows a Range stat for a grenade", () => {
    renderCard();
    expect(screen.getByText("Range")).toBeInTheDocument();
  });

  it("does not show a Range stat for a mine", () => {
    renderCard({ item: { ...baseItem, type: "Mine" } });
    expect(screen.queryByText("Range")).not.toBeInTheDocument();
  });
});

describe("GrenadeCard stowed variant", () => {
  it("shows the stowed overflow card instead of the regular one", () => {
    renderCard({ isStowedCard: true });
    expect(screen.getByText("Stowed · 5 remaining")).toBeInTheDocument();
    expect(screen.queryByText("Grenade")).not.toBeInTheDocument();
    expect(screen.queryByText("Thrown")).not.toBeInTheDocument();
  });
});

describe("GrenadeCard equip toggle", () => {
  it("calls onToggleEquip when the equip button is clicked", async () => {
    const user = userEvent.setup();
    const onToggleEquip = vi.fn();
    renderCard({ onToggleEquip, isEquipped: false });
    await user.click(screen.getByRole("button", { name: "Equip" }));
    expect(onToggleEquip).toHaveBeenCalled();
  });

  it("resets expansion when equipped status changes", async () => {
    const user = userEvent.setup();
    const props = {
      item: baseItem,
      editable: true,
      strengthBonus: 4,
      onRemove: vi.fn(),
      onUpdateQty: vi.fn(),
    };
    const { rerender } = render(<GrenadeCard {...props} isEquipped={false} />);

    expect(screen.getByRole("button", { name: "Expand Custom Frag details" })).toBeInTheDocument();

    rerender(<GrenadeCard {...props} isEquipped />);
    expect(
      screen.getByRole("button", { name: "Collapse Custom Frag details" })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Collapse Custom Frag details" }));
    rerender(<GrenadeCard {...props} isEquipped={false} />);
    rerender(<GrenadeCard {...props} isEquipped />);

    expect(
      screen.getByRole("button", { name: "Collapse Custom Frag details" })
    ).toBeInTheDocument();
  });
});

describe("GrenadeCard remove", () => {
  it("calls onRemove only after removal is confirmed", async () => {
    const user = userEvent.setup();
    const { onRemove } = renderCard();

    await user.click(screen.getByRole("button", { name: "Remove Custom Frag" }));
    expect(onRemove).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(onRemove).toHaveBeenCalledOnce();
  });
});

describe("GrenadeCard quantity", () => {
  it("calls onUpdateQty when the quantity is incremented", async () => {
    const user = userEvent.setup();
    const { onUpdateQty } = renderCard();
    await user.click(screen.getByRole("button", { name: "Increase quantity" }));
    expect(onUpdateQty).toHaveBeenCalledWith(6);
  });

  it("shows the ready/stowed split note when more than 3 are equipped", () => {
    renderCard({ item: { ...baseItem, quantity: 5 }, isEquipped: true });
    expect(screen.getByText("3 ready, rest stowed")).toBeInTheDocument();
    expect(screen.getByText("3 ready")).toBeInTheDocument();
  });
});

describe("GrenadeCard mishaps", () => {
  it("shows the Explosive Mishaps info for a grenade", () => {
    renderCard();
    expect(screen.getByText("Mishaps")).toBeInTheDocument();
  });

  it("hides the Explosive Mishaps info for a mine", () => {
    renderCard({ item: { ...baseItem, type: "Mine" } });
    expect(screen.queryByText("Mishaps")).not.toBeInTheDocument();
  });
});

describe("GrenadeCard damage display", () => {
  it("shows a Special damage badge", () => {
    renderCard({ item: { ...baseItem, damage: "Special" } });
    expect(screen.getByText("Special")).toBeInTheDocument();
  });

  it("shows a dash when there is no damage", () => {
    renderCard({ item: { ...baseItem, damage: undefined } });
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1);
  });
});
