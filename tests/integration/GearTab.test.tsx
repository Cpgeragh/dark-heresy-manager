// tests/integration/GearTab.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { useState } from "react";
import type {
  UseCampaignCustomItemsArgs,
  UseCampaignCustomItemsResult,
} from "../../src/hooks/useCampaignCustomItems";

const recordComponentRenderMock = vi.hoisted(() => vi.fn());
vi.mock("../../src/performance/performanceMetrics", async () => {
  const actual = await vi.importActual<typeof import("../../src/performance/performanceMetrics")>(
    "../../src/performance/performanceMetrics"
  );
  return { ...actual, recordComponentRender: recordComponentRenderMock };
});

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

vi.mock("../../src/pages/CharacterSheet/GearTab/CustomGearForm", () => ({
  CustomGearForm: ({
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

vi.mock("../../src/pages/CharacterSheet/GearTab/CustomConsumableForm", () => ({
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

import { GearTab } from "../../src/pages/CharacterSheet/GearTab";
import { ToastProvider } from "../../src/components/Toast";
import type { GearItem, ConsumableItem } from "../../src/types/Character";

// Real reference entries, already used by GearPicker's/ConsumablePicker's own test files —
// both have a fixed cost, so clicking calls onSelect directly with no GM-input sub-step.
const GEAR_NAME = "Backpack";
const CONSUMABLE_NAME = "Belly-Churn";
const VARIABLE_GEAR_NAME = "Charm";

function libraryItem(category: string, name: string, data: Record<string, unknown> = {}) {
  return {
    id: `lib-${category}`,
    campaignId: "campaign-1",
    category,
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
    data: { name, ...data },
  };
}

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

function StatefulGearRenderBoundary() {
  const [gear, setGear] = useState<GearItem[]>([{ id: "gear-1", name: "Auspex", source: "CR" }]);
  return (
    <ToastProvider>
      <button onClick={() => setGear([{ ...gear[0], name: "Updated Auspex" }])}>
        Update owned gear
      </button>
      <GearTab
        campaignId="campaign-1"
        characterId="char-1"
        userId="user-1"
        isDM={false}
        gear={gear}
        consumables={[]}
        editable
        onUpdate={setGear}
        onUpdateConsumables={() => undefined}
      />
    </ToastProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useCampaignCustomItemsMock.mockReturnValue({ items: [], loading: false, error: null });
});

describe("GearTab", () => {
  it("does not rebuild owned rows when the gear picker opens and closes", async () => {
    const user = userEvent.setup();
    useCampaignCustomItemsMock.mockImplementation(({ enabled }) => ({
      items: [],
      loading: Boolean(enabled),
      error: null,
    }));
    renderTab({
      gear: [{ id: "gear-1", name: "Auspex", source: "CR" }],
      consumables: [{ id: "consumable-1", name: "Stimm", quantity: 1, source: "CR" }],
    });
    const rowRenderCount = () =>
      recordComponentRenderMock.mock.calls.filter(
        ([name]) => name === "GearItemRow" || name === "ConsumableRow"
      ).length;
    const initialRowRenderCount = rowRenderCount();

    await user.click(screen.getByRole("button", { name: "Add item" }));
    expect(screen.getByText("Auspex")).toBeInTheDocument();
    await user.keyboard("{Escape}");

    expect(initialRowRenderCount).toBe(2);
    expect(rowRenderCount()).toBe(initialRowRenderCount);
  });

  it("rebuilds an owned row when its inventory data changes", async () => {
    const user = userEvent.setup();
    render(<StatefulGearRenderBoundary />);
    const initialRowRenderCount = recordComponentRenderMock.mock.calls.filter(
      ([name]) => name === "GearItemRow"
    ).length;

    await user.click(screen.getByRole("button", { name: "Update owned gear" }));

    expect(screen.getByText("Updated Auspex")).toBeInTheDocument();
    expect(
      recordComponentRenderMock.mock.calls.filter(([name]) => name === "GearItemRow").length
    ).toBeGreaterThan(initialRowRenderCount);
  });

  it("enables the custom-item subscription only after a picker opens", async () => {
    const user = userEvent.setup();
    renderTab();

    expect(useCampaignCustomItemsMock.mock.lastCall?.[0].enabled).toBe(false);

    await user.click(screen.getByRole("button", { name: "Add item" }));

    expect(useCampaignCustomItemsMock.mock.lastCall?.[0].enabled).toBe(true);
  });

  it("shows an error state when custom items fail to load", () => {
    useCampaignCustomItemsMock.mockReturnValue({
      items: [],
      loading: false,
      error: new Error("boom"),
    });
    renderTab({
      gear: [{ id: "gear-1", name: "Linked Gear", customLibraryId: "library-1" }],
    });
    expect(screen.getByText("Unable to load custom gear.")).toBeInTheDocument();
  });

  it("shows a loading state", () => {
    useCampaignCustomItemsMock.mockReturnValue({ items: [], loading: true, error: null });
    renderTab({
      gear: [{ id: "gear-1", name: "Linked Gear", customLibraryId: "library-1" }],
    });
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

  it("adds a real gear item from the reference picker", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab();

    await user.click(screen.getByRole("button", { name: "Add item" }));
    await user.click(screen.getByText(GEAR_NAME));

    expect(onUpdate).toHaveBeenCalledWith([expect.objectContaining({ name: GEAR_NAME })], {
      optimistic: true,
    });
  }, 15000);

  it("keeps an item with an assigned cost on a visible save, not an optimistic one", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab();

    await user.click(screen.getByRole("button", { name: "Add item" }));
    await user.click(screen.getByText(VARIABLE_GEAR_NAME));
    await user.type(screen.getByLabelText(/Cost \(Thrones\)/), "500");
    await user.click(screen.getByRole("button", { name: "Add to Inventory" }));

    expect(onUpdate).toHaveBeenCalledWith([
      expect.objectContaining({ name: VARIABLE_GEAR_NAME, value: "500 Thrones" }),
    ]);
  }, 15000);

  it("adds a real consumable from the reference picker", async () => {
    const user = userEvent.setup();
    const { onUpdateConsumables } = renderTab();

    await user.click(screen.getByRole("button", { name: "Add consumable" }));
    await user.click(screen.getByText(CONSUMABLE_NAME));

    expect(onUpdateConsumables).toHaveBeenCalledWith(
      [expect.objectContaining({ name: CONSUMABLE_NAME, quantity: 1 })],
      { optimistic: true }
    );
  }, 15000);

  it("adds an existing library gear item optimistically", async () => {
    const user = userEvent.setup();
    useCampaignCustomItemsMock.mockReturnValue({
      items: [libraryItem("gear", "Custom Rope")] as never,
      loading: false,
      error: null,
    });
    const { onUpdate } = renderTab();

    await user.click(screen.getByRole("button", { name: "Add item" }));
    await user.click(screen.getByText("Custom Rope"));

    expect(onUpdate).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          name: "Custom Rope",
          customLibraryId: "lib-gear",
          customLibraryVersionId: "v1",
        }),
      ],
      { optimistic: true }
    );
  }, 15000);

  it("adds an existing library consumable optimistically", async () => {
    const user = userEvent.setup();
    useCampaignCustomItemsMock.mockReturnValue({
      items: [libraryItem("consumable", "Custom Tonic")] as never,
      loading: false,
      error: null,
    });
    const { onUpdateConsumables } = renderTab();

    await user.click(screen.getByRole("button", { name: "Add consumable" }));
    await user.click(screen.getByText("Custom Tonic"));

    expect(onUpdateConsumables).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          name: "Custom Tonic",
          customLibraryId: "lib-consumable",
          customLibraryVersionId: "v1",
        }),
      ],
      { optimistic: true }
    );
  }, 15000);

  it("creates a custom gear item, updates the character, and returns to the picker", async () => {
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
  }, 15000);

  it("creates a custom consumable, updates the character, and returns to the picker", async () => {
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
  }, 15000);

  it("blocks custom-gear creation with a toast when no one is signed in", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab({ userId: null });

    await user.click(screen.getByRole("button", { name: "Add item" }));
    await user.click(screen.getByRole("button", { name: "Add custom item" }));
    await user.click(screen.getByText("Mock Submit Custom Gear"));

    expect(createDraftCustomItemMock).not.toHaveBeenCalled();
    expect(onUpdate).not.toHaveBeenCalled();
  }, 15000);

  it("removes an existing gear item", async () => {
    const user = userEvent.setup();
    const item: GearItem = { id: "g1", name: "Grapnel", referenceId: "grapnel" };
    const { onUpdate } = renderTab({ gear: [item] });

    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(onUpdate).toHaveBeenCalledWith([], { optimistic: true });
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

    expect(onUpdateConsumables).toHaveBeenCalledWith([], { optimistic: true });
  });

  it("does not show a spinner on a gear row for an optimistic add", async () => {
    const user = userEvent.setup();
    let finish: () => void = () => undefined;
    const onUpdate = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    );
    renderTab({ onUpdate });

    await user.click(screen.getByRole("button", { name: "Add item" }));
    await user.click(screen.getByText(GEAR_NAME));

    const row = screen.getByText(GEAR_NAME).closest("button");
    expect(onUpdate).toHaveBeenCalledWith([expect.objectContaining({ name: GEAR_NAME })], {
      optimistic: true,
    });
    expect(row).not.toHaveAttribute("aria-busy");
    expect(row).not.toBeDisabled();

    await act(async () => finish());
  }, 15000);

  it("does not show a spinner on a consumable row for an optimistic add", async () => {
    const user = userEvent.setup();
    let finish: () => void = () => undefined;
    const onUpdateConsumables = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    );
    renderTab({ onUpdateConsumables });

    await user.click(screen.getByRole("button", { name: "Add consumable" }));
    await user.click(screen.getByText(CONSUMABLE_NAME));

    const row = screen.getByText(CONSUMABLE_NAME).closest("button");
    expect(onUpdateConsumables).toHaveBeenCalledWith(
      [expect.objectContaining({ name: CONSUMABLE_NAME })],
      { optimistic: true }
    );
    expect(row).not.toHaveAttribute("aria-busy");
    expect(row).not.toBeDisabled();

    await act(async () => finish());
  }, 15000);

  it("does not show a spinner on Remove for an optimistic gear removal", async () => {
    const user = userEvent.setup();
    let finish: () => void = () => undefined;
    const onUpdate = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    );
    const item: GearItem = { id: "g1", name: "Grapnel", referenceId: "grapnel" };
    renderTab({ gear: [item], onUpdate });

    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(onUpdate).toHaveBeenCalledWith([], { optimistic: true });
    expect(screen.getByRole("button", { name: "Remove" })).not.toHaveAttribute("aria-busy");

    await act(async () => finish());
  });

  it("does not show a spinner on Remove for an optimistic consumable removal", async () => {
    const user = userEvent.setup();
    let finish: () => void = () => undefined;
    const onUpdateConsumables = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    );
    const item: ConsumableItem = { id: "c1", name: "Stimm", referenceId: "stimm", quantity: 2 };
    renderTab({ consumables: [item], onUpdateConsumables });

    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(onUpdateConsumables).toHaveBeenCalledWith([], { optimistic: true });
    expect(screen.getByRole("button", { name: "Remove" })).not.toHaveAttribute("aria-busy");

    await act(async () => finish());
  });
});
