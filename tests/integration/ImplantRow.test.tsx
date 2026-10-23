// tests/integration/ImplantRow.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { ImplantRow } from "../../src/pages/CharacterSheet/CyberneticsTab/ImplantRow";
import type { CyberneticItem } from "../../src/types/Character";
import type { CampaignCustomItem } from "../../src/types/CustomItems";

// Real reference entry with poor/common/good craftsmanship tiers, so the
// quality chip is genuinely clickable, not fabricated, checked against
// src/data/reference/cyberneticsReference.ts directly.
const CONCEALED_WEAPON_BIONIC_ID = "ih-concealed-weapon-bionic";

function item(over: Partial<CyberneticItem> = {}): CyberneticItem {
  return { id: "c1", name: "Auto-Quill", ...over };
}

describe("ImplantRow", () => {
  it("renders the item name", () => {
    render(
      <ImplantRow item={item()} editable={true} onToggleInstalled={vi.fn()} onRemove={vi.fn()} />
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
        onToggleInstalled={vi.fn()}
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
        onToggleInstalled={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(screen.getByText("Left Bionic Arm")).toBeInTheDocument();
    expect(screen.getByText("Laspistol")).toBeInTheDocument();
  });

  it("shows craftsmanship as plain text on a Craftsmanship line, not as a button", () => {
    render(
      <ImplantRow
        item={item({ referenceId: CONCEALED_WEAPON_BIONIC_ID, craftsmanship: "Common" })}
        editable={true}
        onToggleInstalled={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    expect(screen.getByText("Craftsmanship")).toBeInTheDocument();
    expect(screen.getByText("Common")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Common" })).not.toBeInTheDocument();
  });

  it("shows the item rules behind the Rules line", async () => {
    const user = userEvent.setup();
    render(
      <ImplantRow
        item={item({ name: "Bionic Arm", referenceId: "cr-bionic-arm" })}
        editable={true}
        onToggleInstalled={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    await user.click(
      screen.getByRole("button", { name: "Show information about Bionic Arm Rules" })
    );
    expect(screen.getByRole("dialog", { name: "Bionic Arm Rules" })).toHaveTextContent(
      "Toughness Bonus against hits to the arm location"
    );
  });

  it("prints Craftsmanship before Rules, then Gained from, with the Linked chips below the lines", () => {
    render(
      <ImplantRow
        item={item({
          referenceId: CONCEALED_WEAPON_BIONIC_ID,
          craftsmanship: "Common",
          grantedByTalentName: "Skin of Iron",
          grantedByType: "Talent",
        })}
        linkedArmName="Left Bionic Arm"
        linkedWeaponName="Laspistol"
        linkedWeaponType="ranged"
        editable={true}
        onToggleInstalled={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    const labels = screen
      .getAllByText(/^(Craftsmanship|Rules|Gained from|Linked)$/)
      .map((label) => label.textContent);

    expect(labels).toEqual(["Craftsmanship", "Rules", "Gained from", "Linked"]);
  });

  it("always shows the information icon and says nothing was recorded without player notes", async () => {
    const user = userEvent.setup();
    render(
      <ImplantRow item={item()} editable={true} onToggleInstalled={vi.fn()} onRemove={vi.fn()} />
    );

    await user.click(screen.getByRole("button", { name: "Show information about Auto-Quill" }));
    expect(screen.getByText("No description recorded.")).toBeInTheDocument();
  });

  it("puts the Remove button first in the action area", () => {
    render(
      <ImplantRow item={item()} editable={true} onToggleInstalled={vi.fn()} onRemove={vi.fn()} />
    );

    const button = screen.getByRole("button", { name: "Remove Auto-Quill" });
    expect(button.parentElement?.parentElement?.firstElementChild?.contains(button)).toBe(true);
  });

  it("shows Remove for a talent-granted implant", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <ImplantRow
        item={item({ grantedByTalentEntryUid: "t1", grantedByTalentName: "Skin of Iron" })}
        editable={true}
        onToggleInstalled={vi.fn()}
        onRemove={onRemove}
      />
    );

    await user.click(screen.getByRole("button", { name: "Remove Auto-Quill" }));
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(onRemove).toHaveBeenCalledWith("c1");
    expect(screen.getByText(/Skin of Iron/)).toBeInTheDocument();
  });

  it("calls onRemove for a normal implant only after confirmation", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <ImplantRow item={item()} editable={true} onToggleInstalled={vi.fn()} onRemove={onRemove} />
    );

    await user.click(screen.getByRole("button", { name: "Remove Auto-Quill" }));
    expect(onRemove).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(onRemove).toHaveBeenCalledWith("c1");
  });

  it("keeps the Remove pop-up open when the removal is refused", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn().mockResolvedValue(false);
    render(
      <ImplantRow item={item()} editable={true} onToggleInstalled={vi.fn()} onRemove={onRemove} />
    );

    await user.click(screen.getByRole("button", { name: "Remove Auto-Quill" }));
    await user.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() => expect(onRemove).toHaveBeenCalledWith("c1"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows Uninstall on an installed implant and Install on one that is not", () => {
    const { rerender } = render(
      <ImplantRow item={item()} editable onToggleInstalled={vi.fn()} onRemove={vi.fn()} />
    );
    expect(screen.getByRole("button", { name: "Uninstall" })).toBeInTheDocument();

    rerender(
      <ImplantRow
        item={item({ installed: false })}
        editable
        onToggleInstalled={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: "Install" })).toBeInTheDocument();
  });

  it("calls onToggleInstalled with the implant id", async () => {
    const user = userEvent.setup();
    const onToggleInstalled = vi.fn();
    render(
      <ImplantRow
        item={item({ installed: false })}
        editable
        onToggleInstalled={onToggleInstalled}
        onRemove={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "Install" }));
    expect(onToggleInstalled).toHaveBeenCalledWith("c1");
  });

  it("shows a viewer an Installed chip only while the implant is installed", () => {
    const { rerender } = render(
      <ImplantRow item={item()} editable={false} onToggleInstalled={vi.fn()} onRemove={vi.fn()} />
    );
    expect(screen.getByText("Installed")).toBeInTheDocument();

    rerender(
      <ImplantRow
        item={item({ installed: false })}
        editable={false}
        onToggleInstalled={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(screen.queryByText("Installed")).not.toBeInTheDocument();
  });

  it("shows the weight chip when the implant has a weight", () => {
    render(
      <ImplantRow
        item={item({ weight: "3 kg" })}
        editable
        onToggleInstalled={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(screen.getByText("3 kg")).toBeInTheDocument();
  });

  it("has no Install button on a Concealed Weapon Bionic", () => {
    render(
      <ImplantRow
        item={item({ referenceId: CONCEALED_WEAPON_BIONIC_ID, installed: true })}
        editable
        onToggleInstalled={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(screen.queryByRole("button", { name: /^(Install|Uninstall)$/ })).not.toBeInTheDocument();
  });
});
