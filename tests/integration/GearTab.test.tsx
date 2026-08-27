// tests/integration/GearTab.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

vi.mock("../../src/pages/characterSheet/GearTab/CustomItemForm", () => ({
  CustomItemForm: ({
    onAdd,
    onCancel,
  }: {
    onAdd: (item: unknown) => void;
    onCancel: () => void;
  }) => (
    <div>
      <button onClick={() => onAdd({ id: "draft-1", name: "Custom Kit", source: "Custom" })}>
        Mock Submit Custom Gear
      </button>
      <button onClick={onCancel}>Mock Cancel</button>
    </div>
  ),
}));

vi.mock("../../src/pages/characterSheet/GearTab/CustomConsumableForm", () => ({
  CustomConsumableForm: ({
    onAdd,
    onCancel,
  }: {
    onAdd: (item: unknown) => void;
    onCancel: () => void;
  }) => (
    <div>
      <button onClick={() => onAdd({ id: "draft-2", name: "Custom Tonic", source: "Custom" })}>
        Mock Submit Custom Consumable
      </button>
      <button onClick={onCancel}>Mock Cancel</button>
    </div>
  ),
}));

import { GearTab } from "../../src/pages/characterSheet/GearTab";
import { ToastProvider } from "../../src/components/Toast";
import type { GearItem, ConsumableItem } from "../../src/types/Character";

// Real reference entries, already used by GearPicker's/ConsumablePicker's own test files —
// both have a fixed cost, so clicking calls onSelect directly with no GM-input sub-step.
const GEAR_NAME = "Backpack";
const CONSUMABLE_NAME = "Belly-Churn";

function renderTab(props: Partial<React.ComponentProps<typeof GearTab>> = {}) {
  const onUpdate = vi.fn();
  const onUpdateConsumables = vi.fn();
  render(
    <ToastProvider>
      <GearTab
        campaignId="campaign-1"
        characterId="char-1"
        userId="user-1"
        isDM={false}
        gear={[]}
        consumables={[]}
        editable={true}
        onUpdate={onUpdate}
        onUpdateConsumables={onUpdateConsumables}
        {...props}
      />
    </ToastProvider>
  );
  return { onUpdate, onUpdateConsumables };
}

beforeEach(() => {
  vi.clearAllMocks();
  useCampaignCustomItemsMock.mockReturnValue({ items: [], loading: false, error: null });
});

describe("GearTab", () => {
  it("shows an error state when custom items fail to load", () => {
    useCampaignCustomItemsMock.mockReturnValue({
      items: [],
      loading: false,
      error: new Error("boom"),
    });
    renderTab();
    expect(screen.getByText("Unable to load custom gear.")).toBeInTheDocument();
  });

  it("shows a loading state", () => {
    useCampaignCustomItemsMock.mockReturnValue({ items: [], loading: true, error: null });
    renderTab();
    expect(screen.getByText("Loading custom gear…")).toBeInTheDocument();
  });

  it("shows both empty messages when there is nothing carried", () => {
    renderTab();
    expect(screen.getByText("No items recorded.")).toBeInTheDocument();
    expect(screen.getByText("No consumables recorded.")).toBeInTheDocument();
  });

  it("shows View instead of Add for both sections when not editable", () => {
    renderTab({ editable: false });
    expect(screen.getByRole("button", { name: "View items" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View consumables" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add item" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add consumable" })).not.toBeInTheDocument();
  });

  it(
    "adds a real gear item from the reference picker",
    async () => {
      const user = userEvent.setup();
      const { onUpdate } = renderTab();

      await user.click(screen.getByRole("button", { name: "Add item" }));
      await user.click(screen.getByText(GEAR_NAME));

      expect(onUpdate).toHaveBeenCalledWith([expect.objectContaining({ name: GEAR_NAME })]);
    },
    15000
  );

  it(
    "adds a real consumable from the reference picker",
    async () => {
      const user = userEvent.setup();
      const { onUpdateConsumables } = renderTab();

      await user.click(screen.getByRole("button", { name: "Add consumable" }));
      await user.click(screen.getByText(CONSUMABLE_NAME));

      expect(onUpdateConsumables).toHaveBeenCalledWith([
        expect.objectContaining({ name: CONSUMABLE_NAME, quantity: 1 }),
      ]);
    },
    15000
  );

  it(
    "creates a custom gear item, updates the character, and returns to the picker",
    async () => {
      const user = userEvent.setup();
      createDraftCustomItemMock.mockResolvedValue({ customItemId: "lib-1", versionId: "v1" });
      const { onUpdate } = renderTab();

      await user.click(screen.getByRole("button", { name: "Add item" }));
      await user.click(screen.getByRole("button", { name: "Add custom item" }));
      await user.click(screen.getByText("Mock Submit Custom Gear"));

      expect(createDraftCustomItemMock).toHaveBeenCalledWith(
        expect.objectContaining({ campaignId: "campaign-1", category: "gear" })
      );
      await screen.findByRole("dialog", { name: "Add Item" });
      expect(onUpdate).toHaveBeenCalledWith([
        expect.objectContaining({ customLibraryId: "lib-1", customLibraryVersionId: "v1" }),
      ]);
    },
    15000
  );

  it(
    "creates a custom consumable, updates the character, and returns to the picker",
    async () => {
      const user = userEvent.setup();
      createDraftCustomItemMock.mockResolvedValue({ customItemId: "lib-2", versionId: "v2" });
      const { onUpdateConsumables } = renderTab();

      await user.click(screen.getByRole("button", { name: "Add consumable" }));
      await user.click(screen.getByRole("button", { name: "Add custom consumable" }));
      await user.click(screen.getByText("Mock Submit Custom Consumable"));

      expect(createDraftCustomItemMock).toHaveBeenCalledWith(
        expect.objectContaining({ campaignId: "campaign-1", category: "consumable" })
      );
      await screen.findByRole("dialog", { name: "Add Consumable" });
      expect(onUpdateConsumables).toHaveBeenCalledWith([
        expect.objectContaining({ customLibraryId: "lib-2", customLibraryVersionId: "v2" }),
      ]);
    },
    15000
  );

  it(
    "blocks custom-gear creation with a toast when no one is signed in",
    async () => {
      const user = userEvent.setup();
      const { onUpdate } = renderTab({ userId: null });

      await user.click(screen.getByRole("button", { name: "Add item" }));
      await user.click(screen.getByRole("button", { name: "Add custom item" }));
      await user.click(screen.getByText("Mock Submit Custom Gear"));

      expect(createDraftCustomItemMock).not.toHaveBeenCalled();
      expect(onUpdate).not.toHaveBeenCalled();
    },
    15000
  );

  it("removes an existing gear item", async () => {
    const user = userEvent.setup();
    const item: GearItem = { id: "g1", name: "Grapnel", referenceId: "grapnel" };
    const { onUpdate } = renderTab({ gear: [item] });

    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(onUpdate).toHaveBeenCalledWith([]);
  });

  it("removes an existing consumable", async () => {
    const user = userEvent.setup();
    const item: ConsumableItem = {
      id: "c1",
      name: "Stimm",
      referenceId: "stimm",
      quantity: 2,
    };
    const { onUpdateConsumables } = renderTab({ consumables: [item] });

    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(onUpdateConsumables).toHaveBeenCalledWith([]);
  });
});
