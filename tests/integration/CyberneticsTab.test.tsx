// tests/integration/CyberneticsTab.test.tsx
//
// ImplantPicker, ImplantRow, IntegratedWeaponPicker, CustomImplantForm,
// CustomRangedForm, CustomMeleeForm, and ConcealedWeaponBionicInstaller are all
// mocked here, each already has its own dedicated test file. This file is
// scoped to CyberneticsTab's own orchestration: the
// concealed-weapon-bionic install flow, quality-cycling and its weapon-link side
// effect, the custom/library implant flows, and integrated-weapon wiring.
import { useState } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import type {
  UseCampaignCustomItemsArgs,
  UseCampaignCustomItemsResult,
} from "../../src/hooks/useCampaignCustomItems";

const recordComponentRenderMock = vi.hoisted(() => vi.fn());

const useCampaignCustomItemsMock = vi.fn<
  (args: UseCampaignCustomItemsArgs) => UseCampaignCustomItemsResult
>(() => ({ items: [], loading: false, error: null }));
vi.mock("../../src/hooks/useCampaignCustomItems", () => ({
  useCampaignCustomItems: (args: UseCampaignCustomItemsArgs) => useCampaignCustomItemsMock(args),
}));

const createDraftCustomItemMock = vi.fn();
vi.mock("../../src/services/customItemService", async () => {
  const actual = await vi.importActual<typeof import("../../src/services/customItemService")>(
    "../../src/services/customItemService"
  );
  return {
    ...actual,
    createDraftCustomItem: (...args: unknown[]) => createDraftCustomItemMock(...args),
  };
});

vi.mock("../../src/pages/CharacterSheet/CyberneticsTab/ImplantPicker", () => ({
  ImplantPicker: ({
    onSelect,
    onSelectCustomItem,
    onCustom,
  }: {
    onSelect: (ref: unknown, craftsmanship?: string) => void;
    onSelectCustomItem: (libraryItem: unknown) => void;
    onCustom: () => void;
  }) => (
    <div>
      <button
        onClick={() =>
          onSelect(
            { id: "auto-quill", name: "Auto-Quill", source: "CR", availability: "Rare" },
            "Common"
          )
        }
      >
        Mock Select Plain Implant
      </button>
      <button
        onClick={() =>
          onSelect(
            { id: "ih-concealed-weapon-bionic", name: "Concealed Weapon Bionic", source: "IH" },
            "Common"
          )
        }
      >
        Mock Select Concealed Weapon Bionic
      </button>
      <button
        onClick={() =>
          onSelectCustomItem({
            id: "custom-lib-1",
            status: "published",
            publishedVersionId: "v1",
            data: { name: "Custom Grafted Claw", source: "Custom" },
          })
        }
      >
        Mock Select Library Implant
      </button>
      <button onClick={onCustom}>Mock Add Custom Implant Trigger</button>
    </div>
  ),
}));

vi.mock("../../src/pages/CharacterSheet/CyberneticsTab/ImplantRow", () => ({
  ImplantRow: ({
    item,
    onRemove,
  }: {
    item: { id: string; name: string };
    onRemove: (id: string) => unknown;
  }) => {
    recordComponentRenderMock("ImplantRow");
    const [refused, setRefused] = useState(false);
    return (
      <div>
        <span>{item.name}</span>
        <button onClick={async () => setRefused((await onRemove(item.id)) === false)}>
          Remove {item.name}
        </button>
        {refused && <span>Removal refused</span>}
      </div>
    );
  },
}));

vi.mock("../../src/pages/CharacterSheet/CyberneticsTab/CustomImplantForm", () => ({
  CustomImplantForm: ({
    onAdd,
    onCancel,
  }: {
    onAdd: (item: unknown) => void;
    onCancel: () => void;
  }) => (
    <div>
      <button onClick={() => onAdd({ id: "draft-1", name: "Custom Bionic Eye", source: "Custom" })}>
        Mock Submit Custom Implant
      </button>
      <button onClick={onCancel}>Mock Cancel</button>
    </div>
  ),
}));

vi.mock("../../src/pages/CharacterSheet/CyberneticsTab/ConcealedWeaponBionicInstaller", () => ({
  ConcealedWeaponBionicInstaller: ({
    onInstall,
    onClose,
  }: {
    onInstall: (armId: string, weapon: { id: string; type: "ranged" | "melee" }) => void;
    onClose: () => void;
  }) => (
    <div>
      <button onClick={() => onInstall("arm-1", { id: "ranged-1", type: "ranged" })}>
        Mock Complete Concealed Install
      </button>
      <button onClick={onClose}>Mock Cancel Concealed Install</button>
    </div>
  ),
}));

vi.mock("../../src/pages/CharacterSheet/weapons/IntegratedWeaponPicker", () => ({
  IntegratedWeaponPicker: ({
    onSelectRanged,
    onCustomRanged,
  }: {
    onSelectRanged: (ref: unknown, craftsmanship?: string) => void;
    onCustomRanged?: () => void;
  }) => (
    <div>
      <button
        onClick={() =>
          onSelectRanged(
            { id: "las-pistol", name: "Las Pistol", damage: "1d10+2", pen: "0" },
            "Common"
          )
        }
      >
        Mock Select Integrated Ranged
      </button>
      {onCustomRanged && (
        <button onClick={onCustomRanged}>Mock Add Custom Integrated Ranged Trigger</button>
      )}
    </div>
  ),
}));

vi.mock("../../src/pages/CharacterSheet/weapons/CustomRangedForm", () => ({
  // The real form sets `integrated` on the submitted weapon from its own
  // `integrated` prop (CyberneticsTab always passes it true here), so the mock
  // replicates that instead of hardcoding it, matching real behaviour.
  CustomRangedForm: ({
    integrated,
    onAdd,
    onCancel,
  }: {
    integrated?: boolean;
    onAdd: (weapon: unknown) => void;
    onCancel: () => void;
  }) => (
    <div>
      <button
        onClick={() =>
          onAdd({
            id: "draft-ranged-1",
            name: "Custom Snub Pistol",
            damage: "1d10",
            pen: "0",
            integrated,
          })
        }
      >
        Mock Submit Custom Integrated Ranged
      </button>
      <button onClick={onCancel}>Mock Cancel</button>
    </div>
  ),
}));

vi.mock("../../src/pages/CharacterSheet/weapons/CustomMeleeForm", () => ({
  CustomMeleeForm: () => <div>Mock Custom Melee Form</div>,
}));

import { CyberneticsTab } from "../../src/pages/CharacterSheet/CyberneticsTab";
import { ToastProvider } from "../../src/components/Toast";
import type { CyberneticItem, RangedWeapon } from "../../src/types/Character";

function renderTab(props: Partial<React.ComponentProps<typeof CyberneticsTab>> = {}) {
  const onUpdate = vi.fn();
  const onUpdateRanged = vi.fn();
  const onUpdateMelee = vi.fn();
  render(
    <ToastProvider>
      <CyberneticsTab
        campaignId="campaign-1"
        characterId="char-1"
        userId="user-1"
        isDM={false}
        cybernetics={[]}
        rangedWeapons={[]}
        meleeWeapons={[]}
        editable={true}
        onUpdate={onUpdate}
        onUpdateRanged={onUpdateRanged}
        onUpdateMelee={onUpdateMelee}
        {...props}
      />
    </ToastProvider>
  );
  return { onUpdate, onUpdateRanged, onUpdateMelee };
}

beforeEach(() => {
  vi.clearAllMocks();
  useCampaignCustomItemsMock.mockReturnValue({ items: [], loading: false, error: null });
});

describe("CyberneticsTab", () => {
  it("does not rebuild installed implants when a picker opens", async () => {
    const user = userEvent.setup();
    useCampaignCustomItemsMock.mockImplementation(({ enabled }) => ({
      items: [],
      loading: Boolean(enabled),
      error: null,
    }));
    renderTab({
      cybernetics: [{ id: "implant-1", name: "Auto-Quill", source: "CR" }],
    });
    const initialRenderCount = recordComponentRenderMock.mock.calls.filter(
      ([name]) => name === "ImplantRow"
    ).length;

    await user.click(screen.getAllByRole("button", { name: "+ Install" })[0]);

    expect(screen.getAllByText("Auto-Quill").length).toBeGreaterThan(0);
    expect(initialRenderCount).toBeGreaterThan(0);
    expect(
      recordComponentRenderMock.mock.calls.filter(([name]) => name === "ImplantRow").length
    ).toBe(initialRenderCount);
  });

  it("enables the custom-item subscription only after a picker opens", async () => {
    const user = userEvent.setup();
    renderTab();

    expect(useCampaignCustomItemsMock.mock.lastCall?.[0].enabled).toBe(false);

    await user.click(screen.getAllByRole("button", { name: "+ Install" })[0]);

    expect(useCampaignCustomItemsMock.mock.lastCall?.[0].enabled).toBe(true);
  });

  it("shows an error state when custom items fail to load", () => {
    useCampaignCustomItemsMock.mockReturnValue({
      items: [],
      loading: false,
      error: new Error("boom"),
    });
    renderTab({
      cybernetics: [{ id: "implant-1", name: "Linked Implant", customLibraryId: "library-1" }],
    });
    expect(
      screen.getByText("Unable to load custom cybernetic or integrated weapon items.")
    ).toBeInTheDocument();
  });

  it("shows no loading text while custom items load", () => {
    useCampaignCustomItemsMock.mockReturnValue({ items: [], loading: true, error: null });
    renderTab({
      cybernetics: [{ id: "implant-1", name: "Linked Implant", customLibraryId: "library-1" }],
    });
    expect(screen.queryByText("Loading custom cybernetic items…")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows both empty messages when nothing is installed", () => {
    renderTab();
    expect(screen.getByText("No integrated weapons installed.")).toBeInTheDocument();
    expect(screen.getByText("No cybernetics installed.")).toBeInTheDocument();
  });

  it("shows Mechanicus Implants only for a Tech-Priest career", () => {
    const { rerender } = render(
      <ToastProvider>
        <CyberneticsTab
          campaignId="campaign-1"
          characterId="char-1"
          userId="user-1"
          isDM={false}
          cybernetics={[]}
          rangedWeapons={[]}
          meleeWeapons={[]}
          editable={true}
          onUpdate={vi.fn()}
          onUpdateRanged={vi.fn()}
          onUpdateMelee={vi.fn()}
          career="Guardsman"
        />
      </ToastProvider>
    );
    expect(screen.queryByText("Mechanicus Implants")).not.toBeInTheDocument();

    rerender(
      <ToastProvider>
        <CyberneticsTab
          campaignId="campaign-1"
          characterId="char-1"
          userId="user-1"
          isDM={false}
          cybernetics={[]}
          rangedWeapons={[]}
          meleeWeapons={[]}
          editable={true}
          onUpdate={vi.fn()}
          onUpdateRanged={vi.fn()}
          onUpdateMelee={vi.fn()}
          career="Tech-Priest"
        />
      </ToastProvider>
    );
    expect(screen.getByText("Mechanicus Implants")).toBeInTheDocument();
    expect(screen.getByText("Electro-Graft")).toBeInTheDocument();
  });

  it("installs a plain cybernetic from the picker", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab();

    // Two "+ Install" buttons exist (Integrated Weapons, then Installed Implants).
    await user.click(screen.getAllByRole("button", { name: "+ Install" })[1]);
    await user.click(screen.getByText("Mock Select Plain Implant"));

    expect(onUpdate).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          referenceId: "auto-quill",
          name: "Auto-Quill",
          craftsmanship: "Common",
        }),
      ],
      { optimistic: true }
    );
  });

  it("opens the concealed-weapon installer instead of adding directly", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab();

    // Two "+ Install" buttons exist (Integrated Weapons, then Installed Implants).
    await user.click(screen.getAllByRole("button", { name: "+ Install" })[1]);
    await user.click(screen.getByText("Mock Select Concealed Weapon Bionic"));

    expect(onUpdate).not.toHaveBeenCalled();
    expect(screen.getByText("Mock Complete Concealed Install")).toBeInTheDocument();
  });

  it("completes a concealed-weapon-bionic install, linking the chosen weapon", async () => {
    const user = userEvent.setup();
    const rangedWeapon: RangedWeapon = {
      id: "ranged-1",
      name: "Lasgun",
      damage: "1d10+3",
      pen: "0",
    };
    const { onUpdate, onUpdateRanged } = renderTab({ rangedWeapons: [rangedWeapon] });

    // Two "+ Install" buttons exist (Integrated Weapons, then Installed Implants).
    await user.click(screen.getAllByRole("button", { name: "+ Install" })[1]);
    await user.click(screen.getByText("Mock Select Concealed Weapon Bionic"));
    await user.click(screen.getByText("Mock Complete Concealed Install"));

    expect(onUpdate).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          name: "Concealed Weapon Bionic",
          concealedWeapon: { armId: "arm-1", weaponId: "ranged-1", weaponType: "ranged" },
        }),
      ],
      { optimistic: true }
    );
    expect(onUpdateRanged).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          id: "ranged-1",
          concealedBionic: { cyberneticId: expect.any(String), craftsmanship: "Common" },
        }),
      ],
      { optimistic: true }
    );
  });

  it("installs a custom cybernetic from the campaign library", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab();

    // Two "+ Install" buttons exist (Integrated Weapons, then Installed Implants).
    await user.click(screen.getAllByRole("button", { name: "+ Install" })[1]);
    await user.click(screen.getByText("Mock Select Library Implant"));
    await user.click(screen.getByText("Mock Submit Custom Implant"));

    expect(onUpdate).toHaveBeenCalledWith(
      [expect.objectContaining({ customLibraryId: "custom-lib-1", customLibraryVersionId: "v1" })],
      { optimistic: true }
    );
  });

  it("creates a brand-new custom implant", async () => {
    const user = userEvent.setup();
    createDraftCustomItemMock.mockResolvedValue({ customItemId: "lib-1", versionId: "v1" });
    const { onUpdate } = renderTab();

    // Two "+ Install" buttons exist (Integrated Weapons, then Installed Implants).
    await user.click(screen.getAllByRole("button", { name: "+ Install" })[1]);
    await user.click(screen.getByText("Mock Add Custom Implant Trigger"));
    await user.click(screen.getByText("Mock Submit Custom Implant"));

    expect(createDraftCustomItemMock).toHaveBeenCalledWith(
      expect.objectContaining({ campaignId: "campaign-1", category: "cybernetic" })
    );
    expect(onUpdate).toHaveBeenCalledWith([
      expect.objectContaining({ customLibraryId: "lib-1", customLibraryVersionId: "v1" }),
    ]);
  });

  it("blocks custom-implant creation with a toast when no one is signed in", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab({ userId: null });

    // Two "+ Install" buttons exist (Integrated Weapons, then Installed Implants).
    await user.click(screen.getAllByRole("button", { name: "+ Install" })[1]);
    await user.click(screen.getByText("Mock Add Custom Implant Trigger"));
    await user.click(screen.getByText("Mock Submit Custom Implant"));

    expect(createDraftCustomItemMock).not.toHaveBeenCalled();
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("removes an implant", async () => {
    const user = userEvent.setup();
    const item: CyberneticItem = { id: "c1", name: "Auto-Quill" };
    const { onUpdate } = renderTab({ cybernetics: [item] });

    await user.click(screen.getAllByText("Remove Auto-Quill")[0]);

    await waitFor(() => expect(onUpdate).toHaveBeenCalledWith([]));
  });

  it("passes a refused implant removal back to the row", async () => {
    const user = userEvent.setup();
    const item: CyberneticItem = { id: "c1", name: "Auto-Quill" };
    const onUpdateCharacter = vi.fn().mockResolvedValue(false);
    renderTab({ cybernetics: [item], onUpdateCharacter });

    await user.click(screen.getAllByText("Remove Auto-Quill")[0]);

    expect(await screen.findByText("Removal refused")).toBeInTheDocument();
  });

  it("keeps the Remove pop-up open when removing an Archeotech implant is refused", async () => {
    const user = userEvent.setup();
    const onUpdateArcheotech = vi.fn().mockResolvedValue(false);
    renderTab({
      archeotech: [{ id: "a1", name: "Cortex Lattice", type: "Cybernetic" }],
      onUpdateArcheotech,
    });

    await user.click(screen.getAllByRole("button", { name: "Remove Cortex Lattice" })[0]);
    await user.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() => expect(onUpdateArcheotech).toHaveBeenCalledWith([]));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("keeps the Remove pop-up open when removing an Archeotech integrated weapon is refused", async () => {
    const user = userEvent.setup();
    const onUpdateArcheotech = vi.fn().mockResolvedValue(false);
    renderTab({
      archeotech: [{ id: "a2", name: "Phase Gauntlet", type: "Integrated Weapon" }],
      onUpdateArcheotech,
    });

    await user.click(screen.getAllByRole("button", { name: "Remove Phase Gauntlet" })[0]);
    await user.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() => expect(onUpdateArcheotech).toHaveBeenCalledWith([]));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows Remove and no Equip button on an integrated ranged weapon and removes it after confirmation", async () => {
    const user = userEvent.setup();
    const onUpdateRanged = vi.fn();
    renderTab({
      rangedWeapons: [
        { id: "ir1", name: "Las Pistol", damage: "1d10+3 E", pen: "0", integrated: true },
      ],
      onUpdateRanged,
    });

    expect(screen.queryByRole("button", { name: /^(Equip|Unequip)$/ })).not.toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Remove Las Pistol" })[0]);
    await user.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() => expect(onUpdateRanged).toHaveBeenCalledWith([]));
  });

  it("keeps the Remove pop-up open when removing an integrated ranged weapon is refused", async () => {
    const user = userEvent.setup();
    const onUpdateRanged = vi.fn().mockResolvedValue(false);
    renderTab({
      rangedWeapons: [
        { id: "ir1", name: "Las Pistol", damage: "1d10+3 E", pen: "0", integrated: true },
      ],
      onUpdateRanged,
    });

    await user.click(screen.getAllByRole("button", { name: "Remove Las Pistol" })[0]);
    await user.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() => expect(onUpdateRanged).toHaveBeenCalledWith([]));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows Remove and no Equip button on an integrated melee weapon and removes it after confirmation", async () => {
    const user = userEvent.setup();
    const onUpdateMelee = vi.fn();
    renderTab({
      meleeWeapons: [
        { id: "im1", name: "Mono-Blade", damage: "1d10+2 R", pen: "2", integrated: true },
      ],
      onUpdateMelee,
    });

    expect(screen.queryByRole("button", { name: /^(Equip|Unequip)$/ })).not.toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Remove Mono-Blade" })[0]);
    await user.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() => expect(onUpdateMelee).toHaveBeenCalledWith([]));
  });

  it("keeps the Remove pop-up open when removing an integrated melee weapon is refused", async () => {
    const user = userEvent.setup();
    const onUpdateMelee = vi.fn().mockResolvedValue(false);
    renderTab({
      meleeWeapons: [
        { id: "im1", name: "Mono-Blade", damage: "1d10+2 R", pen: "2", integrated: true },
      ],
      onUpdateMelee,
    });

    await user.click(screen.getAllByRole("button", { name: "Remove Mono-Blade" })[0]);
    await user.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() => expect(onUpdateMelee).toHaveBeenCalledWith([]));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows no Equip button on an Archeotech integrated weapon", () => {
    renderTab({
      archeotech: [{ id: "a2", name: "Phase Gauntlet", type: "Integrated Weapon" }],
      onUpdateArcheotech: vi.fn(),
    });

    expect(screen.queryByRole("button", { name: /^(Equip|Unequip)$/ })).not.toBeInTheDocument();
  });

  it("adds an integrated ranged weapon from reference", async () => {
    const user = userEvent.setup();
    const { onUpdateRanged } = renderTab();

    // First "+ Install" is the Integrated Weapons section's trigger.
    await user.click(screen.getAllByRole("button", { name: "+ Install" })[0]);
    await user.click(screen.getByText("Mock Select Integrated Ranged"));

    expect(onUpdateRanged).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          referenceId: "las-pistol",
          name: "Las Pistol",
          integrated: true,
        }),
      ],
      { optimistic: true }
    );
  });

  it("creates a custom integrated ranged weapon", async () => {
    const user = userEvent.setup();
    createDraftCustomItemMock.mockResolvedValue({ customItemId: "lib-3", versionId: "v3" });
    const { onUpdateRanged } = renderTab();

    await user.click(screen.getAllByRole("button", { name: "+ Install" })[0]);
    await user.click(screen.getByText("Mock Add Custom Integrated Ranged Trigger"));
    await user.click(screen.getByText("Mock Submit Custom Integrated Ranged"));

    expect(createDraftCustomItemMock).toHaveBeenCalledWith(
      expect.objectContaining({ campaignId: "campaign-1", category: "weapon" })
    );
    expect(onUpdateRanged).toHaveBeenCalledWith([
      expect.objectContaining({
        customLibraryId: "lib-3",
        customLibraryVersionId: "v3",
        integrated: true,
      }),
    ]);
  });

  it("keeps the custom integrated ranged form open until the character save settles", async () => {
    const user = userEvent.setup();
    createDraftCustomItemMock.mockResolvedValue({ customItemId: "lib-4", versionId: "v4" });
    let settle: () => void = () => {};
    const onUpdateRanged = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          settle = resolve;
        })
    );
    renderTab({ onUpdateRanged });

    await user.click(screen.getAllByRole("button", { name: "+ Install" })[0]);
    await user.click(screen.getByText("Mock Add Custom Integrated Ranged Trigger"));
    await user.click(screen.getByText("Mock Submit Custom Integrated Ranged"));

    expect(onUpdateRanged).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Mock Submit Custom Integrated Ranged")).toBeInTheDocument();

    await act(async () => {
      settle();
    });
    expect(screen.queryByText("Mock Submit Custom Integrated Ranged")).not.toBeInTheDocument();
    expect(screen.getByText("Mock Select Integrated Ranged")).toBeInTheDocument();
  });
});
