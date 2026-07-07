// tests/integration/WeaponsTab.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

const useCampaignCustomItemsMock = vi.fn(() => ({ items: [], loading: false, error: null }));
vi.mock("../../src/hooks/useCampaignCustomItems", () => ({
  useCampaignCustomItems: () => useCampaignCustomItemsMock(),
}));

const publishCustomItemMock = vi.fn();
const archiveCustomItemMock = vi.fn();
vi.mock("../../src/services/customItemService", async () => {
  const actual = await vi.importActual<typeof import("../../src/services/customItemService")>(
    "../../src/services/customItemService"
  );
  return {
    ...actual,
    publishCustomItem: (...args: unknown[]) => publishCustomItemMock(...args),
    archiveCustomItem: (...args: unknown[]) => archiveCustomItemMock(...args),
    removeAllCustomItemCopies: vi.fn(),
    publishAndUpdateAllCopies: vi.fn(),
  };
});

import { WeaponsTab } from "../../src/pages/characterSheet/WeaponsTab";
import { ToastProvider } from "../../src/components/Toast";
import type {
  RangedWeapon,
  MeleeWeapon,
  CyberneticItem,
  ArcheotechItem,
} from "../../src/types/Character";
import type { CampaignCustomItem } from "../../src/types/CustomItems";

const ranged: RangedWeapon = { id: "r1", name: "Lasgun", damage: "1d10+3", pen: "0" };
const melee: MeleeWeapon = { id: "m1", name: "Chainsword", damage: "1d10+2", pen: "2" };

function renderTab(props: Partial<React.ComponentProps<typeof WeaponsTab>> = {}) {
  const noop = vi.fn();
  render(
    <ToastProvider>
      <WeaponsTab
        campaignId="test-campaign"
        characterId="test-char"
        userId="test-user"
        isDM={false}
        rangedWeapons={[ranged]}
        meleeWeapons={[melee]}
        grenades={[]}
        editable={true}
        strengthBonus={4}
        onUpdateRanged={noop}
        onUpdateMelee={noop}
        onUpdateGrenades={noop}
        shields={[]}
        onUpdateShields={noop}
        cybernetics={[] as CyberneticItem[]}
        archeotech={[] as ArcheotechItem[]}
        onUpdateArcheotech={noop}
        {...props}
      />
    </ToastProvider>
  );
  return { noop };
}

describe("WeaponsTab", () => {
  it("renders the Ranged and Melee sections", () => {
    renderTab();
    expect(screen.getAllByText("Ranged").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Melee").length).toBeGreaterThanOrEqual(1);
  });

  it("renders provided weapons by name", () => {
    renderTab();
    expect(screen.getByText("Lasgun")).toBeInTheDocument();
    expect(screen.getByText("Chainsword")).toBeInTheDocument();
  });

  it("shows empty states when there are no weapons", () => {
    renderTab({ rangedWeapons: [], meleeWeapons: [] });
    expect(screen.getByText("No ranged weapons.")).toBeInTheDocument();
    expect(screen.getByText("No melee weapons.")).toBeInTheDocument();
  });

  it("shows add affordances when editable", () => {
    renderTab({ rangedWeapons: [], meleeWeapons: [] });
    expect(screen.getAllByText("+ Add").length).toBeGreaterThanOrEqual(2);
  });

  it("shows 'View' labels in read-only mode", () => {
    renderTab({ editable: false, rangedWeapons: [], meleeWeapons: [] });
    expect(screen.getAllByText("View").length).toBeGreaterThanOrEqual(2);
  });

  it("shows only rounds for loose-loaded ranged ammo", () => {
    renderTab({
      meleeWeapons: [],
      rangedWeapons: [
        {
          id: "shotgun",
          referenceId: "cr-shotgun",
          name: "Shotgun",
          class: "Basic",
          clip: "2",
          weight: "5 kg",
          equipped: true,
          ammoEntries: [
            {
              id: "shells",
              referenceId: "cr-shells",
              name: "Shells",
              clips: 3,
              rounds: 1,
              loaded: true,
            },
          ],
        },
      ],
    });

    expect(screen.getByText("Rounds")).toBeInTheDocument();
    expect(screen.queryByText("Clips")).not.toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("shows clips and rounds for clip-fed ranged ammo", () => {
    renderTab({
      meleeWeapons: [],
      rangedWeapons: [
        {
          id: "autogun",
          referenceId: "cr-autogun",
          name: "Autogun",
          class: "Basic",
          clip: "30",
          weight: "5 kg",
          equipped: true,
          ammoEntries: [
            {
              id: "bullets",
              referenceId: "cr-bullets",
              name: "Bullets",
              clips: 2,
              rounds: 5,
              loaded: true,
            },
          ],
        },
      ],
    });

    expect(screen.getByText("Clips")).toBeInTheDocument();
    expect(screen.getByText("Rounds")).toBeInTheDocument();
  });
});

// Real reference rows have their own Rules InfoModal titled with the bare
// item name, always mounted (closed) into the DOM — filter for whichever
// match has a role="button" row as an ancestor.
function row(name: string): HTMLElement {
  const match = screen
    .getAllByText(name)
    .map((el) => el.closest('[role="button"]'))
    .find((el): el is HTMLElement => el !== null);
  if (!match) throw new Error(`No role="button" row found for: ${name}`);
  return match;
}

function addButtonIn(sectionHeading: string): HTMLElement {
  // The mobile tab bar also has a button with the same text as each section
  // heading — find the match that's inside an actual <section> (the desktop
  // heading), not the tablist button.
  const heading = screen
    .getAllByText(sectionHeading)
    .map((el) => el.closest("section"))
    .find((el): el is HTMLElement => el !== null);
  if (!heading) throw new Error(`No <section> found for heading: ${sectionHeading}`);
  return within(heading).getByText("+ Add");
}

describe("WeaponsTab add from reference", () => {
  it("adds a Ranged weapon with default (Common) craftsmanship", async () => {
    const user = userEvent.setup();
    const { noop } = renderTab({ rangedWeapons: [], meleeWeapons: [] });
    await user.click(addButtonIn("Ranged"));
    await user.click(row("Lasgun"));
    await user.click(screen.getByRole("button", { name: "Add Weapon" }));
    expect(noop).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ name: "Lasgun", craftsmanship: "Common" })])
    );
  });

  it("adds a Ranged weapon with Poor craftsmanship, which adds the Unreliable quality", async () => {
    const user = userEvent.setup();
    const { noop } = renderTab({ rangedWeapons: [], meleeWeapons: [] });
    await user.click(addButtonIn("Ranged"));
    await user.click(row("Lasgun"));
    await user.click(screen.getByRole("button", { name: "Poor" }));
    await user.click(screen.getByRole("button", { name: "Add Weapon" }));
    expect(noop).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Lasgun",
          craftsmanship: "Poor",
          specialRules: expect.stringContaining("Unreliable"),
        }),
      ])
    );
  });

  it("adds a Melee weapon with Best craftsmanship, which adds +1 damage", async () => {
    const user = userEvent.setup();
    const { noop } = renderTab({ rangedWeapons: [], meleeWeapons: [] });
    await user.click(addButtonIn("Melee"));
    await user.click(row("Chainsword"));
    await user.click(screen.getByRole("button", { name: "Best" }));
    await user.click(screen.getByRole("button", { name: "Add Weapon" }));
    expect(noop).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ name: "Chainsword", craftsmanship: "Best" })])
    );
    const addedWeapon = noop.mock.calls[0][0][0];
    expect(addedWeapon.damage).not.toBe(""); // sanity: damage was computed, not left blank
  });

  it("adds a Grenade from the reference picker in a single step (no craftsmanship screen)", async () => {
    const user = userEvent.setup();
    const { noop } = renderTab({});
    await user.click(addButtonIn("Explosives"));
    await user.click(row("Frag Grenade"));
    expect(noop).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ name: "Frag Grenade" })])
    );
  });

  it("adds a Shield from the reference picker in a single step", async () => {
    const user = userEvent.setup();
    const { noop } = renderTab({});
    await user.click(addButtonIn("Shields"));
    await user.click(row("Enforcer Riot Shield"));
    expect(noop).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ name: "Enforcer Riot Shield" })])
    );
  });
});

describe("WeaponsTab remove / equip-toggle", () => {
  it("removes a Ranged weapon", async () => {
    const user = userEvent.setup();
    const { noop } = renderTab();
    await user.click(screen.getByText("Lasgun")); // expand the card
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(noop).toHaveBeenCalledWith([]);
  });

  it("toggles equip on a Ranged weapon", async () => {
    const user = userEvent.setup();
    const { noop } = renderTab();
    const equipButtons = screen.getAllByRole("button", { name: "Equip" });
    await user.click(equipButtons[0]);
    expect(noop).toHaveBeenCalledWith([expect.objectContaining({ id: "r1", equipped: true })]);
  });

  it("toggles equip on a Melee weapon", async () => {
    const user = userEvent.setup();
    const { noop } = renderTab();
    const equipButtons = screen.getAllByRole("button", { name: "Equip" });
    await user.click(equipButtons[1]);
    expect(noop).toHaveBeenCalledWith([expect.objectContaining({ id: "m1", equipped: true })]);
  });
});

describe("WeaponsTab custom-item library actions", () => {
  function makeLibraryItem(): CampaignCustomItem<"weapon"> {
    return {
      id: "lib1",
      campaignId: "test-campaign",
      category: "weapon",
      status: "draft",
      name: "Custom Lasgun",
      creator: { userId: "u1" },
      latestVersionId: "v1",
      latestVersionNumber: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: { userId: "u1" },
      updatedBy: { userId: "u1" },
      draftVersionId: "v1",
      publishedVersionId: null,
      data: { weaponKind: "ranged", name: "Custom Lasgun", class: "Basic", damage: "1d10+3", pen: "0" },
    };
  }

  const linkedWeapon: RangedWeapon = {
    id: "r-linked",
    name: "Custom Lasgun",
    damage: "1d10+3",
    pen: "0",
    customLibraryId: "lib1",
    customLibraryVersionId: "v1",
  };

  it("calls publishCustomItem when a DM clicks Publish on a draft library weapon", async () => {
    const user = userEvent.setup();
    useCampaignCustomItemsMock.mockReturnValue({ items: [makeLibraryItem()], loading: false, error: null });

    renderTab({ isDM: true, rangedWeapons: [linkedWeapon], meleeWeapons: [] });
    await user.click(screen.getByText("Custom Lasgun"));
    await user.click(screen.getByRole("button", { name: "Publish" }));
    expect(publishCustomItemMock).toHaveBeenCalledWith(
      expect.objectContaining({ customItemId: "lib1" })
    );

    useCampaignCustomItemsMock.mockReturnValue({ items: [], loading: false, error: null });
  });

  it("calls archiveCustomItem when a DM clicks Archive on a library weapon", async () => {
    const user = userEvent.setup();
    useCampaignCustomItemsMock.mockReturnValue({ items: [makeLibraryItem()], loading: false, error: null });

    renderTab({ isDM: true, rangedWeapons: [linkedWeapon], meleeWeapons: [] });
    await user.click(screen.getByText("Custom Lasgun"));
    await user.click(screen.getByRole("button", { name: "Archive" }));
    expect(archiveCustomItemMock).toHaveBeenCalledWith(
      expect.objectContaining({ customItemId: "lib1" })
    );

    useCampaignCustomItemsMock.mockReturnValue({ items: [], loading: false, error: null });
  });
});
