// tests/integration/CustomItemAdminRow.test.tsx

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

vi.mock("../../src/services/customItemService", () => ({
  publishCustomItem: vi.fn(),
  archiveCustomItem: vi.fn(),
  removeAllCustomItemCopies: vi.fn(),
  publishAndUpdateAllCopies: vi.fn(),
  restoreCustomItem: vi.fn(),
  permanentlyDeleteCustomItem: vi.fn(),
}));

import { CustomItemAdminRow } from "../../src/pages/CampaignOverview/CustomItemAdminRow";
import { ToastProvider } from "../../src/components/Toast";
import type { CampaignCustomItem } from "../../src/types/CustomItems";

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
    data: { name: "Custom Auspex", description: "", weight: "1 kg", value: "50 Thrones", availability: "Rare", source: "Custom" },
    ...overrides,
  } as CampaignCustomItem;
}

function renderRow(item: CampaignCustomItem) {
  render(
    <ToastProvider>
      <CustomItemAdminRow item={item} campaignId="camp-1" userId="dm-1" />
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
