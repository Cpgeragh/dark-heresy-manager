// tests/integration/ArcheotechTab.test.tsx
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

vi.mock("../../src/pages/CharacterSheet/ArcheotechTab/CustomArcheotechForm", () => ({
  CustomArcheotechForm: ({
    onAdd,
    onCancel,
  }: {
    onAdd: (item: unknown) => void;
    onCancel: () => void;
  }) => (
    <div>
      <button
        onClick={() =>
          onAdd({ id: "draft-1", name: "Custom Relic", type: "Wargear", source: "Custom" })
        }
      >
        Mock Submit Custom Archeotech
      </button>
      <button onClick={onCancel}>Mock Cancel</button>
    </div>
  ),
}));

import { ArcheotechTab } from "../../src/pages/CharacterSheet/ArcheotechTab";
import { ToastProvider } from "../../src/components/Toast";
import type { ArcheotechItem } from "../../src/types/Character";

// "Belecane-Pattern Stasis Grenade" has a fixed cost/availability (calls onSelect
// directly, no GM-input step) and a weapon-shaped `type` ("Grenade"), exercising
// ArcheotechTab's weapon-vs-plain-item card routing. Same real item ArcheotechPickerModal's
// own test file already uses.
const GRENADE_NAME = "Belecane-Pattern Stasis Grenade";

function renderTab(props: Partial<React.ComponentProps<typeof ArcheotechTab>> = {}) {
  const onUpdate = vi.fn();
  render(
    <ToastProvider>
      <ArcheotechTab
        campaignId="campaign-1"
        characterId="char-1"
        userId="user-1"
        isDM={false}
        archeotech={[]}
        editable={true}
        onUpdate={onUpdate}
        {...props}
      />
    </ToastProvider>
  );
  return { onUpdate };
}

beforeEach(() => {
  vi.clearAllMocks();
  useCampaignCustomItemsMock.mockReturnValue({ items: [], loading: false, error: null });
});

describe("ArcheotechTab", () => {
  it("shows an error state when custom items fail to load", () => {
    useCampaignCustomItemsMock.mockReturnValue({
      items: [],
      loading: false,
      error: new Error("boom"),
    });
    renderTab();
    expect(screen.getByText("Unable to load custom archeotech items.")).toBeInTheDocument();
  });

  it("shows a loading state", () => {
    useCampaignCustomItemsMock.mockReturnValue({ items: [], loading: true, error: null });
    renderTab();
    expect(screen.getByText("Loading custom archeotech items…")).toBeInTheDocument();
  });

  it("shows the empty message and a zero count when there is no archeotech", () => {
    renderTab();
    expect(screen.getByText("Inventory (0)")).toBeInTheDocument();
    expect(screen.getByText("No archeotech recorded.")).toBeInTheDocument();
  });

  it("shows View instead of Add item when not editable", () => {
    renderTab({ editable: false });
    expect(screen.getByRole("button", { name: "View items" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add item" })).not.toBeInTheDocument();
  });

  it("adds a weapon-typed item from the reference picker without crashing the weapon-card routing", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab();

    await user.click(screen.getByRole("button", { name: "Add item" }));
    await user.click(screen.getAllByText(GRENADE_NAME)[0]);

    expect(onUpdate).toHaveBeenCalledWith([
      expect.objectContaining({ name: GRENADE_NAME, type: "Grenade" }),
    ]);
  });

  it("creates a custom archeotech item, updates the character, and returns to the picker", async () => {
    const user = userEvent.setup();
    createDraftCustomItemMock.mockResolvedValue({ customItemId: "lib-1", versionId: "v1" });
    const { onUpdate } = renderTab();

    await user.click(screen.getByRole("button", { name: "Add item" }));
    await user.click(screen.getByRole("button", { name: "Add custom item" }));
    await user.click(screen.getByText("Mock Submit Custom Archeotech"));

    expect(createDraftCustomItemMock).toHaveBeenCalledWith(
      expect.objectContaining({ campaignId: "campaign-1", category: "archeotech" })
    );
    await screen.findByRole("dialog", { name: "Add Archeotech" });
    expect(onUpdate).toHaveBeenCalledWith([
      expect.objectContaining({ customLibraryId: "lib-1", customLibraryVersionId: "v1" }),
    ]);
  });

  it("blocks custom-item creation with a toast when no one is signed in", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab({ userId: null });

    await user.click(screen.getByRole("button", { name: "Add item" }));
    await user.click(screen.getByRole("button", { name: "Add custom item" }));
    await user.click(screen.getByText("Mock Submit Custom Archeotech"));

    expect(createDraftCustomItemMock).not.toHaveBeenCalled();
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("keeps the custom form open and does not update the character when saving fails", async () => {
    const user = userEvent.setup();
    createDraftCustomItemMock.mockRejectedValue(new Error("network error"));
    const { onUpdate } = renderTab();

    await user.click(screen.getByRole("button", { name: "Add item" }));
    await user.click(screen.getByRole("button", { name: "Add custom item" }));
    await user.click(screen.getByText("Mock Submit Custom Archeotech"));

    await screen.findByText("Mock Submit Custom Archeotech");
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("removes an existing item", async () => {
    const user = userEvent.setup();
    const item: ArcheotechItem = { id: "a1", name: "Auto-Quill", referenceId: "auto-quill" };
    const { onUpdate } = renderTab({ archeotech: [item] });

    // The row renders twice (mobile-column copy + desktop-grid copy, both mounted
    // simultaneously, CSS-hidden per breakpoint), so target the first real match.
    await user.click(screen.getAllByRole("button", { name: "Remove" })[0]);

    expect(onUpdate).toHaveBeenCalledWith([]);
  });
});
