// tests/integration/CustomItemLibraryAdmin.test.tsx

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

vi.mock("../../src/hooks/useCampaignCustomItems", () => ({
  useCampaignCustomItems: () => ({
    loading: false,
    error: null,
    items: [
      {
        id: "1", name: "Custom Laspistol", category: "weapon", status: "published",
        creator: { userId: "u1", characterId: "c1", characterName: "Acolyte" },
        publishedVersionId: "v1", draftVersionId: null, latestVersionId: "v1",
        archivedAt: null, archivedByUserId: null,
      },
      {
        id: "2", name: "Custom Medkit", category: "gear", status: "draft",
        creator: { userId: "u1", characterId: "c1", characterName: "Servitor" },
        publishedVersionId: null, draftVersionId: "v1", latestVersionId: "v1",
        archivedAt: null, archivedByUserId: null,
      },
      {
        id: "3", name: "Old Drug", category: "drug", status: "archived",
        creator: { userId: "u1", characterId: "c1", characterName: "Acolyte" },
        publishedVersionId: "v1", draftVersionId: null, latestVersionId: "v1",
        archivedAt: new Date(), archivedByUserId: "dm-1",
      },
    ],
  }),
}));

vi.mock("../../src/services/customItemService", () => ({
  publishCustomItem: vi.fn(),
  archiveCustomItem: vi.fn(),
  removeAllCustomItemCopies: vi.fn(),
  publishAndUpdateAllCopies: vi.fn(),
  restoreCustomItem: vi.fn(),
  permanentlyDeleteCustomItem: vi.fn(),
}));

import { CustomItemLibraryAdmin } from "../../src/pages/CampaignOverview/CustomItemLibraryAdmin";
import { ToastProvider } from "../../src/components/Toast";

function renderAdmin() {
  render(
    <ToastProvider>
      <CustomItemLibraryAdmin campaignId="camp-1" userId="dm-1" />
    </ToastProvider>
  );
}

describe("CustomItemLibraryAdmin", () => {
  it("shows all items by default", () => {
    renderAdmin();
    expect(screen.getByText("Custom Laspistol")).toBeInTheDocument();
    expect(screen.getByText("Custom Medkit")).toBeInTheDocument();
    expect(screen.getByText("Old Drug")).toBeInTheDocument();
  });

  it("filtering by category hides non-matching items", () => {
    renderAdmin();
    fireEvent.click(screen.getByRole("button", { name: "Gear" }));
    expect(screen.getByText("Custom Medkit")).toBeInTheDocument();
    expect(screen.queryByText("Custom Laspistol")).not.toBeInTheDocument();
    expect(screen.queryByText("Old Drug")).not.toBeInTheDocument();
  });

  it("filtering by status hides non-matching items", () => {
    renderAdmin();
    fireEvent.click(screen.getByText("Archived"));
    expect(screen.getByText("Old Drug")).toBeInTheDocument();
    expect(screen.queryByText("Custom Laspistol")).not.toBeInTheDocument();
    expect(screen.queryByText("Custom Medkit")).not.toBeInTheDocument();
  });

  it("shows empty state when no items match the filter", () => {
    renderAdmin();
    fireEvent.click(screen.getByText("Consumable"));
    expect(screen.getByText("No custom items match the current filter.")).toBeInTheDocument();
  });
});
