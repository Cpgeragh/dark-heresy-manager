// tests/integration/ImplantRow.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { ImplantRow } from "../../src/pages/CharacterSheet/CyberneticsTab/ImplantRow";
import type { CyberneticItem } from "../../src/types/Character";
import type { CampaignCustomItem } from "../../src/types/CustomItems";

// Real reference entry with poor/common/good craftsmanship tiers, so the
// quality chip is genuinely clickable — not fabricated, checked against
// src/data/reference/cyberneticsReference.ts directly.
const CONCEALED_WEAPON_BIONIC_ID = "ih-concealed-weapon-bionic";

function item(over: Partial<CyberneticItem> = {}): CyberneticItem {
  return { id: "c1", name: "Auto-Quill", ...over };
}

describe("ImplantRow", () => {
  it("renders the item name", () => {
    render(
      <ImplantRow item={item()} editable={true} onCycleQuality={vi.fn()} onRemove={vi.fn()} />
    );
    expect(screen.getByText("Auto-Quill")).toBeInTheDocument();
  });

  it("shows a status badge when linked to a campaign library item", () => {
    const libraryItem = { status: "published" } as CampaignCustomItem<"cybernetic">;
    render(
      <ImplantRow
        item={item()}
        libraryItem={libraryItem}
        editable={true}
        onCycleQuality={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(screen.getByText(/published/i)).toBeInTheDocument();
  });

  it("shows the linked arm and weapon chips for a concealed-weapon-bionic implant", () => {
    render(
      <ImplantRow
        item={item({ referenceId: CONCEALED_WEAPON_BIONIC_ID, craftsmanship: "Common" })}
        linkedArmName="Left Bionic Arm"
        linkedWeaponName="Laspistol"
        linkedWeaponType="ranged"
        editable={true}
        onCycleQuality={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(screen.getByText("Left Bionic Arm")).toBeInTheDocument();
    expect(screen.getByText("Laspistol")).toBeInTheDocument();
  });

  it("cycles quality on click when the reference has more than one tier", async () => {
    const user = userEvent.setup();
    const onCycleQuality = vi.fn();
    render(
      <ImplantRow
        item={item({ referenceId: CONCEALED_WEAPON_BIONIC_ID, craftsmanship: "Common" })}
        editable={true}
        onCycleQuality={onCycleQuality}
        onRemove={vi.fn()}
      />
    );

    await user.click(screen.getByText("Common"));
    expect(onCycleQuality).toHaveBeenCalledWith("c1");
  });

  it("does not cycle quality when not editable", async () => {
    const user = userEvent.setup();
    const onCycleQuality = vi.fn();
    render(
      <ImplantRow
        item={item({ referenceId: CONCEALED_WEAPON_BIONIC_ID, craftsmanship: "Common" })}
        editable={false}
        onCycleQuality={onCycleQuality}
        onRemove={vi.fn()}
      />
    );

    await user.click(screen.getByText("Common"));
    expect(onCycleQuality).not.toHaveBeenCalled();
  });

  it("hides Remove for a talent-granted implant, even when editable", () => {
    render(
      <ImplantRow
        item={item({ grantedByTalentEntryUid: "t1", grantedByTalentName: "Skin of Iron" })}
        editable={true}
        onCycleQuality={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
    expect(screen.getByText(/Skin of Iron/)).toBeInTheDocument();
  });

  it("calls onRemove for a normal, non-granted implant", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <ImplantRow item={item()} editable={true} onCycleQuality={vi.fn()} onRemove={onRemove} />
    );

    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(onRemove).toHaveBeenCalledWith("c1");
  });
});
