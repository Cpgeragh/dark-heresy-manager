// tests/integration/CustomItemAdminRow.test.tsx

import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

vi.mock("../../src/services/customItemService", () => ({
  publishCustomItem: vi.fn(),
  archiveAndRemoveAllCustomItemCopies: vi.fn(),
  publishAndUpdateAllCopies: vi.fn(),
  restoreCustomItem: vi.fn(),
  permanentlyDeleteCustomItem: vi.fn(),
  preflightCustomItemArchive: vi
    .fn()
    .mockResolvedValue({ safe: true, affectedDocuments: 1, affectedCopies: 0 }),
  preflightCustomItemUpdateAllCopies: vi
    .fn()
    .mockResolvedValue({ safe: true, affectedDocuments: 2, affectedCopies: 0 }),
  preflightPermanentCustomItemDeletion: vi
    .fn()
    .mockResolvedValue({ safe: true, affectedDocuments: 2, affectedCopies: 0 }),
}));

import { CustomItemAdminRow } from "../../src/pages/CampaignOverview/CustomItemAdminRow";
import { ToastProvider, useToasts } from "../../src/components/Toast";
import type { CampaignCustomItem } from "../../src/types/CustomItems";
import {
  archiveAndRemoveAllCustomItemCopies,
  permanentlyDeleteCustomItem,
} from "../../src/services/customItemService";

function makeItem(overrides: Partial<CampaignCustomItem> = {}): CampaignCustomItem {
  return {
    id: "item-1",
    campaignId: "camp-1",
    category: "gear",
    status: "draft",
    name: "Custom Auspex",
    creator: { userId: "player-1", characterId: "char-1", characterName: "Acolyte" },
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: { userId: "player-1", characterId: "char-1", characterName: "Acolyte" },
    updatedBy: { userId: "player-1", characterId: "char-1", characterName: "Acolyte" },
    publishedVersionId: null,
    draftVersionId: "v1",
    latestVersionId: "v1",
    latestVersionNumber: 1,
    archivedAt: null,
    archivedByUserId: null,
    data: {
      name: "Custom Auspex",
      description: "",
      weight: "1 kg",
      value: "50 Thrones",
      availability: "Rare",
      source: "Custom",
    },
    ...overrides,
  } as CampaignCustomItem;
}

// The provider only holds toast state, so this lists the messages it holds.
function ToastMessages() {
  const toasts = useToasts();
  return (
    <ul>
      {toasts.map((toast) => (
        <li key={toast.id}>{toast.message}</li>
      ))}
    </ul>
  );
}

function renderRow(item: CampaignCustomItem) {
  render(
    <ToastProvider>
      <CustomItemAdminRow item={item} campaignId="camp-1" userId="dm-1" />
      <ToastMessages />
    </ToastProvider>
  );
}

describe("CustomItemAdminRow", () => {
  it("shows item name, category and creator", () => {
    renderRow(makeItem());
    expect(screen.getByText("Custom Auspex")).toBeInTheDocument();
    expect(screen.getByText("Gear")).toBeInTheDocument();
    expect(screen.getByText("Acolyte")).toBeInTheDocument();
  });

  it("draft item shows Publish and Archive, not Restore or Delete", () => {
    renderRow(makeItem());
    expect(screen.getByText("Publish")).toBeInTheDocument();
    expect(screen.getByText("Archive")).toBeInTheDocument();
    expect(screen.queryByText("Restore")).not.toBeInTheDocument();
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
  });

  it("published item without pending draft shows Archive only", () => {
    renderRow(makeItem({ status: "published", publishedVersionId: "v1", draftVersionId: null }));
    expect(screen.queryByText("Publish")).not.toBeInTheDocument();
    expect(screen.getByText("Archive")).toBeInTheDocument();
    expect(screen.queryByText("Update All Copies")).not.toBeInTheDocument();
    expect(screen.queryByText("Restore")).not.toBeInTheDocument();
  });

  it("published item with pending draft shows Update All Copies", () => {
    renderRow(makeItem({ status: "published", publishedVersionId: "v1", draftVersionId: "v2" }));
    expect(screen.getByText("Update All Copies")).toBeInTheDocument();
  });

  it("archived item shows Restore and Delete, not Publish or Archive", () => {
    renderRow(makeItem({ status: "archived", archivedAt: new Date(), archivedByUserId: "dm-1" }));
    expect(screen.queryByText("Publish")).not.toBeInTheDocument();
    expect(screen.queryByText("Archive")).not.toBeInTheDocument();
    expect(screen.getByText("Restore")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });
});

describe("CustomItemAdminRow confirmations", () => {
  it("closes the Archive pop-up once the archive succeeds", async () => {
    const user = userEvent.setup();
    vi.mocked(archiveAndRemoveAllCustomItemCopies).mockResolvedValueOnce(2);
    renderRow(makeItem());

    await user.click(screen.getByRole("button", { name: "Archive" }));
    const dialog = screen.getByRole("dialog", { name: "Archive Custom Item" });
    await user.click(within(dialog).getByRole("button", { name: "Archive" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Archive" })).toBeInTheDocument();
  });

  it("keeps the Archive pop-up open when the archive fails", async () => {
    const user = userEvent.setup();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.mocked(archiveAndRemoveAllCustomItemCopies).mockRejectedValueOnce(new Error("offline"));
    renderRow(makeItem());

    await user.click(screen.getByRole("button", { name: "Archive" }));
    const dialog = screen.getByRole("dialog", { name: "Archive Custom Item" });
    await user.click(within(dialog).getByRole("button", { name: "Archive" }));

    expect(await screen.findByText("Failed to archive item.")).toBeInTheDocument();
    await waitFor(() =>
      expect(within(dialog).getByRole("button", { name: "Archive" })).toBeEnabled()
    );
    expect(screen.getByRole("dialog", { name: "Archive Custom Item" })).toBeInTheDocument();
  });

  it("keeps the permanent Delete question open when the delete fails", async () => {
    const user = userEvent.setup();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.mocked(permanentlyDeleteCustomItem).mockRejectedValueOnce(new Error("offline"));
    renderRow(makeItem({ status: "archived", archivedAt: new Date(), archivedByUserId: "dm-1" }));

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.type(await screen.findByPlaceholderText("DELETE"), "DELETE");
    const confirm = screen.getByRole("button", { name: "Delete Permanently" });
    await waitFor(() => expect(confirm).toBeEnabled());
    await user.click(confirm);

    expect(await screen.findByText("Failed to delete item.")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Delete Permanently" })).toBeEnabled()
    );
    expect(screen.getByPlaceholderText("DELETE")).toBeInTheDocument();
  });
});
