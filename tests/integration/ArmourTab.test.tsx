// tests/integration/ArmourTab.test.tsx
import { beforeEach, describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";

import type {
  UseCampaignCustomItemsArgs,
  UseCampaignCustomItemsResult,
} from "../../src/hooks/useCampaignCustomItems";

const useCampaignCustomItemsMock = vi.fn<
  (args: UseCampaignCustomItemsArgs) => UseCampaignCustomItemsResult
>(() => ({ items: [], loading: false, error: null }));
vi.mock("../../src/hooks/useCampaignCustomItems", () => ({
  useCampaignCustomItems: (args: UseCampaignCustomItemsArgs) => useCampaignCustomItemsMock(args),
}));

import { ArmourTab } from "../../src/pages/CharacterSheet/ArmourTab";
import { ToastProvider } from "../../src/components/Toast";
import type { WornArmourPiece, CyberneticItem } from "../../src/types/Character";

function piece(over: Partial<WornArmourPiece> = {}): WornArmourPiece {
  return { id: "a1", name: "Flak Jacket", locations: ["body"], ap: 3, worn: true, ...over };
}

function libraryArmour(name: string) {
  return {
    id: "lib-armour",
    campaignId: "test-campaign",
    category: "armour",
    status: "published",
    name,
    creator: { userId: "u1" },
    latestVersionId: "v1",
    latestVersionNumber: 1,
    publishedVersionId: "v1",
    draftVersionId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: { userId: "u1" },
    updatedBy: { userId: "u1" },
    data: { armourKind: "worn", name, locations: ["body"], ap: 2 },
  };
}

function renderTab(props: Partial<React.ComponentProps<typeof ArmourTab>> = {}) {
  const onUpdate = vi.fn();
  render(
    <ToastProvider>
      <ArmourTab
        campaignId="test-campaign"
        characterId="test-char"
        userId="test-user"
        isDM={false}
        armour={[piece()]}
        toughnessBonus={4}
        editable={true}
        onUpdate={onUpdate}
        cybernetics={[] as CyberneticItem[]}
        {...props}
      />
    </ToastProvider>
  );
  return { onUpdate };
}

beforeEach(() => {
  useCampaignCustomItemsMock.mockClear();
  useCampaignCustomItemsMock.mockReturnValue({ items: [], loading: false, error: null });
});

describe("ArmourTab", () => {
  it("enables the custom-item subscription only after a picker opens", () => {
    renderTab({ armour: [] });

    expect(useCampaignCustomItemsMock.mock.lastCall?.[0].enabled).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "+ Equip" }));

    expect(useCampaignCustomItemsMock.mock.lastCall?.[0].enabled).toBe(true);
  });

  it("renders the location summary and section headers", () => {
    renderTab();
    expect(screen.getByText("Location Summary")).toBeInTheDocument();
    expect(screen.getByText("Worn")).toBeInTheDocument();
    expect(screen.getByText("Stowed")).toBeInTheDocument();
    expect(screen.getByText("Force Fields")).toBeInTheDocument();
  });

  it("renders a worn piece by name", () => {
    renderTab();
    expect(screen.getAllByText("Flak Jacket").length).toBeGreaterThan(0);
  });

  it("reflects the toughness bonus in the summary table", () => {
    renderTab({ toughnessBonus: 4 });
    // TB column shows the bonus for each of the six locations.
    expect(screen.getAllByText("4").length).toBeGreaterThanOrEqual(6);
  });

  it("adds the Natural Armour trait's AP to every location's total", () => {
    renderTab({
      armour: [],
      toughnessBonus: 0,
      traits: [
        { uid: "t1", talentId: "natural-armour", name: "Natural Armour (3)", specialisation: "3" },
      ],
    });
    // Total column: ap(0) + toughnessBonus(0) + bionic(0) + naturalArmourBonus(3) = 3, for all six locations.
    expect(screen.getAllByText("3").length).toBeGreaterThanOrEqual(6);
  });

  it("adds The Flesh is Weak Machine AP to every location and labels its source", () => {
    renderTab({
      armour: [],
      toughnessBonus: 0,
      talents: {
        homeworld: "",
        talents: [
          { uid: "f1", talentId: "the-flesh-is-weak", name: "The Flesh is Weak" },
          { uid: "f2", talentId: "the-flesh-is-weak", name: "The Flesh is Weak" },
        ],
        traits: [],
      },
    });
    expect(screen.getAllByText("2").length).toBeGreaterThanOrEqual(6);
    expect(
      screen.getByRole("button", { name: "Show information about Misc Bonuses" })
    ).toBeInTheDocument();
  });

  it("shows equip/stow add affordances when editable", () => {
    renderTab();
    expect(screen.getByText("+ Equip")).toBeInTheDocument();
    expect(screen.getByText("+ Stow")).toBeInTheDocument();
  });

  it("shows 'View' instead of add affordances in read-only mode", () => {
    renderTab({ editable: false, armour: [] });
    expect(screen.getAllByText("View").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText("+ Equip")).not.toBeInTheDocument();
  });

  it("shows empty states when there is no armour", () => {
    renderTab({ armour: [] });
    expect(screen.getByText("No armour worn.")).toBeInTheDocument();
    expect(screen.getByText("No armour stowed.")).toBeInTheDocument();
    expect(screen.getByText("No force field equipped.")).toBeInTheDocument();
  });

  it("adds an existing library armour piece optimistically", () => {
    useCampaignCustomItemsMock.mockReturnValue({
      items: [libraryArmour("Custom Coat")] as never,
      loading: false,
      error: null,
    });
    const { onUpdate } = renderTab({ armour: [] });

    fireEvent.click(screen.getByRole("button", { name: "+ Equip" }));
    fireEvent.click(screen.getByText("Custom Coat"));

    expect(onUpdate).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          name: "Custom Coat",
          worn: true,
          customLibraryId: "lib-armour",
          customLibraryVersionId: "v1",
        }),
      ],
      { optimistic: true }
    );
  });

  it("fits Hexagramatic Wards to compatible armour", () => {
    const armour = [
      piece({
        referenceId: "cr-power-armour",
        name: "Power Armour",
        locations: ["head", "body", "rightArm", "leftArm", "rightLeg", "leftLeg"],
      }),
    ];
    const { onUpdate } = renderTab({ armour });

    const upgradeHeader = screen.getAllByText("Upgrades").at(-1)!.parentElement!;
    fireEvent.click(within(upgradeHeader).getByRole("button", { name: "Add upgrade" }));
    fireEvent.click(screen.getByText("Hexagramatic Wards"));

    expect(onUpdate).toHaveBeenCalledWith(
      [expect.objectContaining({ upgrades: ["ih-hexagramatic-wards"] })],
      { optimistic: true }
    );
  });

  it("asks for an optimistic update when an upgrade is removed from armour", () => {
    const armour = [
      piece({
        referenceId: "cr-power-armour",
        name: "Power Armour",
        locations: ["head", "body", "rightArm", "leftArm", "rightLeg", "leftLeg"],
        upgrades: ["ih-hexagramatic-wards"],
      }),
    ];
    const { onUpdate } = renderTab({ armour });

    const wardsLabel = screen.getAllByText("Hexagramatic Wards")[0];
    fireEvent.click(wardsLabel.parentElement!.querySelector("button")!);

    expect(onUpdate).toHaveBeenCalledWith([expect.objectContaining({ upgrades: [] })], {
      optimistic: true,
    });
  });

  it("asks for an optimistic update when a worn piece is stowed", () => {
    const { onUpdate } = renderTab();

    fireEvent.click(screen.getAllByRole("button", { name: "Stow" })[0]);

    expect(onUpdate).toHaveBeenCalledWith([expect.objectContaining({ id: "a1", worn: false })], {
      optimistic: true,
    });
  });

  it("asks for an optimistic update when a stowed piece is worn", () => {
    const { onUpdate } = renderTab({ armour: [piece({ worn: false })] });

    fireEvent.click(screen.getAllByRole("button", { name: "Wear" })[0]);

    expect(onUpdate).toHaveBeenCalledWith([expect.objectContaining({ id: "a1", worn: true })], {
      optimistic: true,
    });
  });

  it("asks for an optimistic update when a piece is removed", () => {
    const { onUpdate } = renderTab();

    fireEvent.click(screen.getAllByRole("button", { name: "Remove" })[0]);

    expect(onUpdate).toHaveBeenCalledWith([], { optimistic: true });
  });

  it("asks for an optimistic update when a force field is deactivated", () => {
    const { onUpdate } = renderTab({
      armour: [
        piece({
          id: "f1",
          name: "Refraction Field",
          locations: [],
          ap: 0,
          isForceField: true,
          protectionRating: 30,
        }),
      ],
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Deactivate" })[0]);

    expect(onUpdate).toHaveBeenCalledWith([expect.objectContaining({ id: "f1", worn: false })], {
      optimistic: true,
    });
  });

  it("asks for an optimistic update when the spare cell count of a force field changes", () => {
    const { onUpdate } = renderTab({
      armour: [
        piece({
          id: "f1",
          name: "Refractor Field",
          referenceId: "ih-refractor-field",
          locations: [],
          ap: 0,
          isForceField: true,
          spareCells: 1,
        }),
      ],
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Increase" })[0]);

    expect(onUpdate).toHaveBeenCalledWith([expect.objectContaining({ id: "f1", spareCells: 2 })], {
      optimistic: true,
    });
  });

  it("asks for an optimistic update when Archeotech armour is removed", () => {
    const onUpdateArcheotech = vi.fn();
    renderTab({
      armour: [],
      archeotech: [
        {
          id: "x1",
          name: "Ork Mega Armour",
          type: "Armour",
          ap: 10,
          locations: ["head", "body"],
          equipped: true,
        },
      ],
      onUpdateArcheotech,
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Remove" })[0]);

    expect(onUpdateArcheotech).toHaveBeenCalledWith([], { optimistic: true });
  });
});
