// tests/integration/PsychicTab.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import type { UseCampaignCustomItemsResult } from "../../src/hooks/useCampaignCustomItems";

const useCampaignCustomItemsMock = vi.fn<() => UseCampaignCustomItemsResult>(() => ({
  items: [],
  loading: false,
  error: null,
}));
vi.mock("../../src/hooks/useCampaignCustomItems", () => ({
  useCampaignCustomItems: () => useCampaignCustomItemsMock(),
}));

const createDraftCustomItemMock = vi.fn(async () => ({
  customItemId: "power-lib-1",
  versionId: "power-version-1",
}));
const saveDraftCustomItemMock = vi.fn(async () => "power-version-2");
const publishCustomItemMock = vi.fn();
const archiveCustomItemMock = vi.fn();
vi.mock("../../src/services/customItemService", async () => {
  const actual = await vi.importActual<typeof import("../../src/services/customItemService")>(
    "../../src/services/customItemService"
  );
  return {
    ...actual,
    createDraftCustomItem: (...args: unknown[]) => createDraftCustomItemMock(...args),
    saveDraftCustomItem: (...args: unknown[]) => saveDraftCustomItemMock(...args),
    publishCustomItem: (...args: unknown[]) => publishCustomItemMock(...args),
    archiveCustomItem: (...args: unknown[]) => archiveCustomItemMock(...args),
    removeAllCustomItemCopies: vi.fn(),
    publishAndUpdateAllCopies: vi.fn(),
  };
});

vi.mock("../../src/data/reference/psychicReference", async () => {
  const actual = await vi.importActual<typeof import("../../src/data/reference/psychicReference")>(
    "../../src/data/reference/psychicReference"
  );
  return {
    ...actual,
    PSYCHIC_POWER_REFERENCE: [
      {
        id: "fake-minor",
        name: "Fake Minor Power",
        source: "CR",
        discipline: "Minor",
        threshold: 5,
        focusTime: "Half Action",
        sustained: false,
        range: "10m",
        description: "A fake minor power for testing.",
      },
      {
        id: "fake-major",
        name: "Fake Major Power",
        source: "CR",
        discipline: "Telepathy",
        threshold: 15,
        focusTime: "Full Action",
        sustained: true,
        range: "Unlimited",
        description: "A fake major power for testing.",
      },
      {
        id: "fake-major-2",
        name: "Fake Biomancy Power",
        source: "DotDG",
        discipline: "Biomancy",
        threshold: 10,
        focusTime: "Half Action",
        sustained: false,
        range: "5m",
        description: "A second fake major power, different discipline and source.",
      },
    ],
  };
});

import { PsychicTab } from "../../src/pages/characterSheet/PsychicTab";
import { ToastProvider } from "../../src/components/Toast";
import type { PsychicBlock } from "../../src/types/Character";
import type { CampaignCustomItem } from "../../src/types/CustomItems";

const emptyPsychic: PsychicBlock = { psyRating: 2, minorPowers: [], majorPowers: [] };

function renderTab(props: Partial<React.ComponentProps<typeof PsychicTab>> = {}) {
  const onUpdate = vi.fn();
  render(
    <ToastProvider>
      <PsychicTab
        campaignId="test-campaign"
        characterId="test-char"
        userId="test-user"
        characterName="Test Acolyte"
        isDM={false}
        psychic={emptyPsychic}
        psyRating={2}
        editable={true}
        onUpdate={onUpdate}
        {...props}
      />
    </ToastProvider>
  );
  return { onUpdate };
}

function libraryPower(
  overrides: Partial<CampaignCustomItem<"power">> = {}
): CampaignCustomItem<"power"> {
  return {
    id: "lib-power-1",
    campaignId: "test-campaign",
    category: "power",
    status: "published",
    name: "Library Power",
    creator: { userId: "other-user", characterId: "other-char", characterName: "Other Acolyte" },
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: { userId: "other-user" },
    updatedBy: { userId: "other-user" },
    publishedVersionId: "lib-version-1",
    draftVersionId: null,
    latestVersionId: "lib-version-1",
    latestVersionNumber: 1,
    archivedAt: null,
    archivedByUserId: null,
    data: {
      name: "Library Power",
      discipline: "Telepathy",
      threshold: "12",
      focusTime: "Half Action",
      range: "20m",
      sustained: "No",
      isMinor: false,
      custom: true,
      origin: "Custom",
    },
    ...overrides,
  };
}

beforeEach(() => {
  useCampaignCustomItemsMock.mockReturnValue({ items: [], loading: false, error: null });
  createDraftCustomItemMock.mockClear();
  saveDraftCustomItemMock.mockClear();
  publishCustomItemMock.mockClear();
  archiveCustomItemMock.mockClear();
});

describe("PsychicTab", () => {
  it("renders Minor and Major sections", () => {
    renderTab();
    expect(screen.getAllByText(/Minor Powers/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Major Powers/i).length).toBeGreaterThanOrEqual(1);
  });

  it("adds a reference power to the character", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab();
    await user.click(screen.getAllByText("+ Add Minor Power")[0]);
    await user.click(await screen.findByText("Fake Minor Power"));
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        minorPowers: [expect.objectContaining({ name: "Fake Minor Power", isMinor: true })],
      })
    );
  });

  it("creates a custom power as a campaign draft", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab();
    await user.click(screen.getAllByText("+ Add Minor Power")[0]);
    await user.click(await screen.findByText("+ Custom minor power"));
    await user.type(screen.getByPlaceholderText("Power name..."), "Homebrew Whisper");
    await user.click(screen.getByRole("button", { name: "Half" }));
    await user.type(screen.getByPlaceholderText("e.g. 8"), "6");
    await user.click(screen.getByRole("button", { name: "You" }));
    await user.click(screen.getByRole("button", { name: "No" }));
    await user.click(screen.getByRole("button", { name: "Custom" }));
    await user.click(screen.getByRole("button", { name: "Add Power" }));

    expect(createDraftCustomItemMock).toHaveBeenCalledWith(
      expect.objectContaining({
        campaignId: "test-campaign",
        category: "power",
        creator: { userId: "test-user", characterId: "test-char", characterName: "Test Acolyte" },
        data: expect.objectContaining({ name: "Homebrew Whisper", isMinor: true }),
      })
    );
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        minorPowers: [
          expect.objectContaining({
            name: "Homebrew Whisper",
            customLibraryId: "power-lib-1",
            customLibraryVersionId: "power-version-1",
          }),
        ],
      })
    );
  });

  it("adds an already-published power selected from the campaign library", async () => {
    useCampaignCustomItemsMock.mockReturnValue({
      items: [libraryPower()],
      loading: false,
      error: null,
    });
    const user = userEvent.setup();
    const { onUpdate } = renderTab();
    await user.click(screen.getAllByText("+ Add Major Power")[0]);
    await user.click(await screen.findByText("Library Power"));

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        majorPowers: [
          expect.objectContaining({
            name: "Library Power",
            customLibraryId: "lib-power-1",
            customLibraryVersionId: "lib-version-1",
          }),
        ],
      })
    );
  });

  it("shows Publish and Archive to the DM for a draft custom power still on the character", () => {
    useCampaignCustomItemsMock.mockReturnValue({
      items: [
        libraryPower({ status: "draft", publishedVersionId: null, draftVersionId: "lib-version-1" }),
      ],
      loading: false,
      error: null,
    });
    renderTab({
      isDM: true,
      psychic: {
        psyRating: 2,
        minorPowers: [],
        majorPowers: [
          {
            id: "char-power-1",
            name: "Library Power",
            discipline: "Telepathy",
            threshold: "12",
            focusTime: "Half Action",
            range: "20m",
            sustained: "No",
            isMinor: false,
            custom: true,
            origin: "Custom",
            known: true,
            customLibraryId: "lib-power-1",
            customLibraryVersionId: "lib-version-1",
          },
        ],
      },
    });
    expect(screen.getAllByText("Publish").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Archive").length).toBeGreaterThanOrEqual(1);
  });

  it("saves an edited custom power definition as a new draft version", async () => {
    useCampaignCustomItemsMock.mockReturnValue({
      items: [
        libraryPower({
          creator: { userId: "test-user", characterId: "test-char", characterName: "Test Acolyte" },
        }),
      ],
      loading: false,
      error: null,
    });
    const user = userEvent.setup();
    const { onUpdate } = renderTab({
      psychic: {
        psyRating: 2,
        minorPowers: [],
        majorPowers: [
          {
            id: "char-power-1",
            name: "Library Power",
            discipline: "Telepathy",
            threshold: "12",
            focusTime: "Half Action",
            range: "20m",
            sustained: "No",
            isMinor: false,
            custom: true,
            origin: "Custom",
            known: true,
            customLibraryId: "lib-power-1",
            customLibraryVersionId: "lib-version-1",
          },
        ],
      },
    });

    await user.click(screen.getAllByRole("button", { name: "Edit Definition" })[0]);
    const nameInput = await screen.findByDisplayValue("Library Power");
    await user.clear(nameInput);
    await user.type(nameInput, "Revised Library Power");
    await user.click(screen.getByRole("button", { name: "Save Power" }));

    expect(saveDraftCustomItemMock).toHaveBeenCalledWith(
      expect.objectContaining({
        campaignId: "test-campaign",
        customItemId: "lib-power-1",
        data: expect.objectContaining({ name: "Revised Library Power" }),
      })
    );
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        majorPowers: [
          expect.objectContaining({
            name: "Revised Library Power",
            customLibraryVersionId: "power-version-2",
          }),
        ],
      })
    );
  });

  it("filters the Major picker by discipline", async () => {
    const user = userEvent.setup();
    renderTab();
    await user.click(screen.getAllByText("+ Add Major Power")[0]);
    expect(await screen.findByText("Fake Major Power")).toBeInTheDocument();
    expect(screen.getByText("Fake Biomancy Power")).toBeInTheDocument();

    await user.click(screen.getByText("All Disciplines"));
    const biomancyOptions = screen.getAllByText("Biomancy");
    await user.click(biomancyOptions[biomancyOptions.length - 1]);

    expect(screen.getByText("Fake Biomancy Power")).toBeInTheDocument();
    expect(screen.queryByText("Fake Major Power")).not.toBeInTheDocument();
  });

  it("filters the Major picker by source, including custom library items", async () => {
    useCampaignCustomItemsMock.mockReturnValue({
      items: [libraryPower({ data: { ...libraryPower().data, origin: "2nd Ed" } })],
      loading: false,
      error: null,
    });
    const user = userEvent.setup();
    renderTab();
    await user.click(screen.getAllByText("+ Add Major Power")[0]);
    expect(await screen.findByText("Library Power")).toBeInTheDocument();

    await user.click(screen.getByText("All Sources"));
    await user.click(screen.getByText("DotDG"));

    expect(screen.getByText("Fake Biomancy Power")).toBeInTheDocument();
    expect(screen.queryByText("Fake Major Power")).not.toBeInTheDocument();
    expect(screen.queryByText("Library Power")).not.toBeInTheDocument();
  });

  it("shows only a Source filter, no Discipline filter, on the Minor picker", async () => {
    const user = userEvent.setup();
    renderTab();
    await user.click(screen.getAllByText("+ Add Minor Power")[0]);
    await screen.findByText("Fake Minor Power");

    expect(screen.getByText("All Sources")).toBeInTheDocument();
    expect(screen.queryByText("All Disciplines")).not.toBeInTheDocument();
  });
});
