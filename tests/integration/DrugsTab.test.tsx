// tests/integration/DrugsTab.test.tsx
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

vi.mock("../../src/pages/CharacterSheet/DrugsTab/CustomDrugForm", () => ({
  CustomDrugForm: ({
    onAdd,
    onCancel,
  }: {
    onAdd: (item: unknown) => void;
    onCancel: () => void;
  }) => (
    <div>
      <button onClick={() => onAdd({ id: "draft-1", name: "Custom Stim", source: "Custom" })}>
        Mock Submit Custom Drug
      </button>
      <button onClick={onCancel}>Mock Cancel</button>
    </div>
  ),
}));

import { DrugsTab } from "../../src/pages/CharacterSheet/DrugsTab";
import { ToastProvider } from "../../src/components/Toast";
import type { DrugItem } from "../../src/types/Character";

// Real reference drug, already used by DrugPicker's own test file.
const DRUG_NAME = "Dryas";

function renderTab(props: Partial<React.ComponentProps<typeof DrugsTab>> = {}) {
  const onUpdate = vi.fn();
  render(
    <ToastProvider>
      <DrugsTab
        campaignId="campaign-1"
        characterId="char-1"
        userId="user-1"
        isDM={false}
        drugs={[]}
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

describe("DrugsTab", () => {
  it("always shows the Excessive Drug Use rule", () => {
    renderTab();
    expect(screen.getByText("Excessive Drug Use")).toBeInTheDocument();
  });

  it("shows an error state when custom items fail to load", () => {
    useCampaignCustomItemsMock.mockReturnValue({
      items: [],
      loading: false,
      error: new Error("boom"),
    });
    renderTab();
    expect(screen.getByText("Unable to load custom drug items.")).toBeInTheDocument();
  });

  it("shows a loading state", () => {
    useCampaignCustomItemsMock.mockReturnValue({ items: [], loading: true, error: null });
    renderTab();
    expect(screen.getByText("Loading custom drug items…")).toBeInTheDocument();
  });

  it("shows the empty message when no drugs are carried", () => {
    renderTab();
    expect(screen.getByText("No drugs carried.")).toBeInTheDocument();
  });

  it("shows View instead of Add drug when not editable", () => {
    renderTab({ editable: false });
    expect(screen.getByRole("button", { name: "View drugs" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add drug" })).not.toBeInTheDocument();
  });

  it("adds a real drug from the reference picker", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab();

    await user.click(screen.getByRole("button", { name: "Add drug" }));
    await user.click(screen.getByText(DRUG_NAME));

    expect(onUpdate).toHaveBeenCalledWith([
      expect.objectContaining({ name: DRUG_NAME, quantity: 1 }),
    ]);
  });

  it("creates a custom drug, updates the character, and returns to the picker", async () => {
    const user = userEvent.setup();
    createDraftCustomItemMock.mockResolvedValue({ customItemId: "lib-1", versionId: "v1" });
    const { onUpdate } = renderTab();

    await user.click(screen.getByRole("button", { name: "Add drug" }));
    await user.click(screen.getByRole("button", { name: "Add custom drug" }));
    await user.click(screen.getByText("Mock Submit Custom Drug"));

    expect(createDraftCustomItemMock).toHaveBeenCalledWith(
      expect.objectContaining({ campaignId: "campaign-1", category: "drug" })
    );
    await screen.findByRole("dialog", { name: "Add Drug" });
    expect(onUpdate).toHaveBeenCalledWith([
      expect.objectContaining({ customLibraryId: "lib-1", customLibraryVersionId: "v1" }),
    ]);
  });

  it("blocks custom-drug creation with a toast when no one is signed in", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab({ userId: null });

    await user.click(screen.getByRole("button", { name: "Add drug" }));
    await user.click(screen.getByRole("button", { name: "Add custom drug" }));
    await user.click(screen.getByText("Mock Submit Custom Drug"));

    expect(createDraftCustomItemMock).not.toHaveBeenCalled();
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("removes an existing drug", async () => {
    const user = userEvent.setup();
    const drug: DrugItem = { id: "d1", name: "Obscura", referenceId: "obscura", quantity: 1 };
    const { onUpdate } = renderTab({ drugs: [drug] });

    // The row renders twice (mobile-column copy + desktop-grid copy, both mounted
    // simultaneously, CSS-hidden per breakpoint), so target the first real match.
    await user.click(screen.getAllByRole("button", { name: "Remove" })[0]);

    expect(onUpdate).toHaveBeenCalledWith([]);
  });
});
