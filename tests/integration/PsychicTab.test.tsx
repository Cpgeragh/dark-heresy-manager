// tests/integration/PsychicTab.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { useState } from "react";
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
    archiveAndRemoveAllCustomItemCopies: (...args: unknown[]) => archiveCustomItemMock(...args),
    preflightCustomItemArchive: vi.fn().mockResolvedValue({
      safe: true,
      affectedDocuments: 1,
      affectedCopies: 0,
    }),
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
        id: "fake-minor-2",
        name: "Second Fake Minor Power",
        source: "CR",
        discipline: "Minor",
        threshold: 6,
        focusTime: "Half Action",
        sustained: false,
        range: "You",
        description: "A second fake minor power for testing.",
      },
      {
        id: "fake-minor-3",
        name: "Third Fake Minor Power",
        source: "CR",
        discipline: "Minor",
        threshold: 7,
        focusTime: "Half Action",
        sustained: false,
        range: "You",
        description: "A third fake minor power for testing.",
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

import { PsychicTab } from "../../src/pages/CharacterSheet/PsychicTab";
import { ToastProvider } from "../../src/components/Toast";
import type { PsychicBlock, TalentsAndTraitsBlock } from "../../src/types/Character";
import type { CampaignCustomItem } from "../../src/types/CustomItems";

const emptyPsychic: PsychicBlock = { psyRating: 2, minorPowers: [], majorPowers: [] };
const emptyTalents: TalentsAndTraitsBlock = { homeworld: "", talents: [], traits: [] };

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
        talents={emptyTalents}
        psyRating={2}
        editable={true}
        onUpdate={onUpdate}
        {...props}
      />
    </ToastProvider>
  );
  return { onUpdate };
}

function StatefulPsychicTab({
  initialPsychic = emptyPsychic,
  talents = emptyTalents,
}: {
  initialPsychic?: PsychicBlock;
  talents?: TalentsAndTraitsBlock;
} = {}) {
  const [psychic, setPsychic] = useState(initialPsychic);
  return (
    <ToastProvider>
      <PsychicTab
        campaignId="test-campaign"
        characterId="test-char"
        userId="test-user"
        characterName="Test Acolyte"
        isDM={false}
        psychic={psychic}
        talents={talents}
        psyRating={2}
        editable
        onUpdate={setPsychic}
      />
    </ToastProvider>
  );
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
  it("shows Disciplines as read-only Talent-controlled status chips", () => {
    renderTab({ psychic: { ...emptyPsychic, disciplines: ["Biomancy"] } });

    expect(screen.getByLabelText("Biomancy: known")).not.toHaveClass("text-emerald-400/50");
    expect(screen.getByLabelText("Telepathy: not known")).toHaveClass(
      "border-fuchsia-700/50",
      "bg-fuchsia-950/15",
      "text-fuchsia-400/50"
    );
    expect(screen.queryByRole("button", { name: "Biomancy" })).not.toBeInTheDocument();
  });

  it("combines available selections and bypasses add routes in view-only mode", async () => {
    const user = userEvent.setup();
    const talents: TalentsAndTraitsBlock = {
      ...emptyTalents,
      talents: [
        { uid: "minor-purchase", talentId: "minor-psychic-power", name: "Minor Psychic Power" },
        {
          uid: "psy-rating-purchase",
          talentId: "psy-rating-1",
          name: "Psy Rating 1",
          acquisition: { psyRatingMinorPowerGrants: 2 },
        },
      ],
    };
    renderTab({ talents, editable: false });

    expect(screen.getAllByText("Available: 3").length).toBeGreaterThan(0);
    await user.click(screen.getAllByRole("button", { name: "View Minor Powers" })[0]);
    expect(screen.getByRole("dialog", { name: "View Psychic Powers" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Add Minor Power" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Use Minor Psychic Power selection" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Use Psy Rating selection" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Add independent Minor power" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Select Fake Minor Power" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Expand Fake Minor Power details" })
    ).toBeInTheDocument();
  });

  it("renders Minor and Major sections", () => {
    renderTab();
    expect(screen.getAllByText(/Minor Powers/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Major Powers/i).length).toBeGreaterThanOrEqual(1);
  });

  it("adds a reference power to the character", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab();
    await user.click(screen.getAllByRole("button", { name: "Add Minor Power" })[0]);
    await user.click(await screen.findByRole("button", { name: "Select Fake Minor Power" }));
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        minorPowers: [expect.objectContaining({ name: "Fake Minor Power", isMinor: true })],
      })
    );
  });

  it("keeps the Psychic picker open and removes an added finite power", async () => {
    const user = userEvent.setup();
    render(<StatefulPsychicTab />);
    await user.click(screen.getAllByRole("button", { name: "Add Minor Power" })[0]);
    await user.click(await screen.findByRole("button", { name: "Select Fake Minor Power" }));

    const dialog = screen.getByRole("dialog", { name: "Add Psychic Power" });
    expect(within(dialog).queryByText("Fake Minor Power")).not.toBeInTheDocument();
  });

  it("includes the discipline-wide rule when adding a reference power", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab();
    await user.click(screen.getAllByRole("button", { name: "Add Major Power" })[0]);
    await user.click(await screen.findByRole("button", { name: "Select Fake Major Power" }));

    expect(onUpdate.mock.calls[0][0].majorPowers[0].description).toContain(
      "Discipline rule: If a Psyker uses a telepathic power"
    );
    expect(onUpdate.mock.calls[0][0].majorPowers[0].description).toContain("psychic rot");
  });

  it("creates a custom power as a campaign draft", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab();
    await user.click(screen.getAllByRole("button", { name: "Add Minor Power" })[0]);
    await user.click(await screen.findByRole("button", { name: "Custom Minor Power" }));
    await user.type(screen.getByPlaceholderText("Power name..."), "Homebrew Whisper");
    await user.click(screen.getByRole("button", { name: "Half" }));
    await user.type(screen.getByPlaceholderText("e.g. 8"), "6");
    await user.click(screen.getByRole("button", { name: "You" }));
    await user.click(screen.getByRole("button", { name: "No" }));
    await user.click(screen.getByRole("radio", { name: "Custom" }));
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
    expect(screen.getByRole("dialog", { name: "Add Psychic Power" })).toBeInTheDocument();
  });

  it("keeps a purchase link on the character but out of a shared custom-power definition", async () => {
    const user = userEvent.setup();
    const talents: TalentsAndTraitsBlock = {
      ...emptyTalents,
      talents: [
        { uid: "minor-purchase-1", talentId: "minor-psychic-power", name: "Minor Psychic Power" },
      ],
    };
    const { onUpdate } = renderTab({ talents });
    await user.click(screen.getAllByRole("button", { name: "Add Minor Power" })[0]);
    await user.click(screen.getByRole("button", { name: "Use Minor Psychic Power selection" }));
    await user.click(await screen.findByRole("button", { name: "Custom Minor Power" }));
    await user.type(screen.getByPlaceholderText("Power name..."), "Purchased Whisper");
    await user.click(screen.getByRole("button", { name: "Half" }));
    await user.type(screen.getByPlaceholderText("e.g. 8"), "6");
    await user.click(screen.getByRole("button", { name: "You" }));
    await user.click(screen.getByRole("button", { name: "No" }));
    await user.click(screen.getByRole("radio", { name: "Custom" }));
    await user.click(screen.getByRole("button", { name: "Add Power" }));

    expect(createDraftCustomItemMock.mock.calls[0][0].data).not.toHaveProperty("talentEntryUid");
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        minorPowers: [expect.objectContaining({ talentEntryUid: "minor-purchase-1" })],
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
    await user.click(screen.getAllByRole("button", { name: "Add Major Power" })[0]);
    await user.click(await screen.findByRole("button", { name: "Select Library Power" }));

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

  it("shows Publish and Archive to the DM for a draft custom power still on the character", async () => {
    const user = userEvent.setup();
    useCampaignCustomItemsMock.mockReturnValue({
      items: [
        libraryPower({
          status: "draft",
          publishedVersionId: null,
          draftVersionId: "lib-version-1",
        }),
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
    await user.click(screen.getAllByRole("button", { name: "Expand Library Power details" })[0]);
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

    await user.click(screen.getAllByRole("button", { name: "Expand Library Power details" })[0]);
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
    await user.click(screen.getAllByRole("button", { name: "Add Major Power" })[0]);
    expect(await screen.findByText("Fake Major Power")).toBeInTheDocument();
    expect(screen.getByText("Fake Biomancy Power")).toBeInTheDocument();

    await user.click(screen.getByText("All Disciplines"));
    const biomancyOptions = screen.getAllByText("Biomancy");
    await user.click(biomancyOptions[biomancyOptions.length - 1]);

    expect(screen.getByText("Fake Biomancy Power")).toBeInTheDocument();
    expect(screen.queryByText("Fake Major Power")).not.toBeInTheDocument();
  });

  it("restores the Psychic list position after returning from a filter screen", async () => {
    const user = userEvent.setup();
    renderTab();
    await user.click(screen.getAllByRole("button", { name: "Add Major Power" })[0]);

    const dialog = await screen.findByRole("dialog", { name: "Add Psychic Power" });
    const list = dialog.querySelector<HTMLElement>(".overflow-y-auto");
    if (!list) throw new Error("No Psychic picker scroll container found");
    list.scrollTop = 165;
    fireEvent.scroll(list);

    await user.click(within(dialog).getByText("All Sources"));
    await user.click(screen.getByRole("button", { name: "Back" }));

    const restored = screen
      .getByRole("dialog", { name: "Add Psychic Power" })
      .querySelector<HTMLElement>(".overflow-y-auto");
    expect(restored?.scrollTop).toBe(165);
  });

  it("filters the Major picker by source, including custom library items", async () => {
    useCampaignCustomItemsMock.mockReturnValue({
      items: [libraryPower({ data: { ...libraryPower().data, origin: "2nd Ed" } })],
      loading: false,
      error: null,
    });
    const user = userEvent.setup();
    renderTab();
    await user.click(screen.getAllByRole("button", { name: "Add Major Power" })[0]);
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
    await user.click(screen.getAllByRole("button", { name: "Add Minor Power" })[0]);
    await screen.findByText("Fake Minor Power");

    expect(screen.getByText("All Sources")).toBeInTheDocument();
    expect(screen.queryByText("All Disciplines")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument();
  });

  it("offers and consumes an available Minor Psychic Power purchase", async () => {
    const user = userEvent.setup();
    const talents: TalentsAndTraitsBlock = {
      ...emptyTalents,
      talents: [
        { uid: "minor-purchase-1", talentId: "minor-psychic-power", name: "Minor Psychic Power" },
      ],
    };
    const { onUpdate } = renderTab({ talents });

    await user.click(screen.getAllByRole("button", { name: "Add Minor Power" })[0]);
    const talentRoute = screen.getByRole("button", { name: "Use Minor Psychic Power selection" });
    expect(talentRoute).toHaveClass("rounded-lg", "border-slate-500");
    expect(within(talentRoute).getByText("Available: 1")).toHaveClass("text-amber-300");
    const independentRoute = screen.getByRole("button", { name: "Add independent Minor power" });
    expect(within(independentRoute).getByText("No selection used")).toHaveClass("text-slate-300");
    expect(independentRoute.querySelector('[data-picker-arrow="right"]')).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Use Minor Psychic Power selection" }));
    const powerPicker = screen.getByRole("dialog", { name: "Add Psychic Power" });
    expect(within(powerPicker).getByRole("button", { name: "Back" })).toBeInTheDocument();
    expect(within(powerPicker).queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("dialog", { name: "Add Minor Power" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Use Minor Psychic Power selection" })
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Use Minor Psychic Power selection" }));
    await user.click(await screen.findByRole("button", { name: "Select Fake Minor Power" }));

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        minorPowers: [expect.objectContaining({ talentEntryUid: "minor-purchase-1" })],
      })
    );
  });

  it("keeps purchased mode active until every purchase is used, then returns to the route menu", async () => {
    const user = userEvent.setup();
    const talents: TalentsAndTraitsBlock = {
      ...emptyTalents,
      talents: [
        { uid: "minor-purchase-1", talentId: "minor-psychic-power", name: "Minor Psychic Power" },
        { uid: "minor-purchase-2", talentId: "minor-psychic-power", name: "Minor Psychic Power" },
      ],
    };
    render(<StatefulPsychicTab talents={talents} />);

    await user.click(screen.getAllByRole("button", { name: "Add Minor Power" })[0]);
    await user.click(screen.getByRole("button", { name: "Use Minor Psychic Power selection" }));
    await user.click(await screen.findByRole("button", { name: "Select Fake Minor Power" }));

    const activePowerPicker = screen.getByRole("dialog", { name: "Add Psychic Power" });
    expect(activePowerPicker).toBeInTheDocument();
    expect(
      within(activePowerPicker).queryByRole("button", { name: "Use Minor Psychic Power selection" })
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Select Second Fake Minor Power" }));

    expect(screen.getByRole("dialog", { name: "Add Minor Power" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Add Psychic Power" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Use Minor Psychic Power selection" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add independent Minor power" })).toBeInTheDocument();
    expect(screen.queryByText("All selections used")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Select Third Fake Minor Power" })
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Available: 1")).not.toBeInTheDocument();
    expect(screen.getAllByText("Minor Psychic Power")).toHaveLength(4);
    expect(screen.queryByText("Talent purchase")).not.toBeInTheDocument();
  });

  it("rejects custom power names that differ only by spacing or capitalisation", async () => {
    const user = userEvent.setup();
    render(
      <StatefulPsychicTab
        initialPsychic={{
          ...emptyPsychic,
          minorPowers: [{ id: "dull-pain", name: "Dull Pain", known: true, isMinor: true }],
        }}
      />
    );

    await user.click(screen.getAllByRole("button", { name: "Add Minor Power" })[0]);
    await user.click(screen.getByRole("button", { name: "Custom Minor Power" }));
    await user.type(screen.getByPlaceholderText("Power name..."), "  dull pain  ");

    expect(screen.getByText("That power is already on this character.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Power" })).toBeDisabled();
  });

  it("shows purchased-power availability beside the matching headings", () => {
    const talents: TalentsAndTraitsBlock = {
      ...emptyTalents,
      talents: [
        { uid: "minor-purchase-1", talentId: "minor-psychic-power", name: "Minor Psychic Power" },
        { uid: "major-purchase-1", talentId: "psychic-power", name: "Psychic Power" },
      ],
    };
    renderTab({ talents });

    for (const heading of screen.getAllByRole("heading", { name: "Minor Powers" })) {
      expect(heading.parentElement).toHaveClass("flex-col", "items-start", "gap-2");
      expect(within(heading.parentElement!).getByText("Available: 1")).toBeInTheDocument();
    }
    for (const heading of screen.getAllByRole("heading", { name: "Major Powers" })) {
      expect(heading.parentElement).toHaveClass("flex-col", "items-start", "gap-2");
      expect(within(heading.parentElement!).getByText("Available: 1")).toBeInTheDocument();
    }
  });

  it("hides and restores the availability chip as a purchase is linked and released", async () => {
    const user = userEvent.setup();
    const talents: TalentsAndTraitsBlock = {
      ...emptyTalents,
      talents: [
        { uid: "minor-purchase-1", talentId: "minor-psychic-power", name: "Minor Psychic Power" },
      ],
    };
    const { unmount } = render(<StatefulPsychicTab talents={talents} />);
    expect(screen.getAllByText("Available: 1").length).toBeGreaterThan(0);
    await user.click(screen.getAllByRole("button", { name: "Add Minor Power" })[0]);
    await user.click(screen.getByRole("button", { name: "Use Minor Psychic Power selection" }));
    await user.click(await screen.findByRole("button", { name: "Select Fake Minor Power" }));
    expect(screen.queryByText("Available: 1")).not.toBeInTheDocument();

    unmount();
    render(
      <StatefulPsychicTab
        talents={talents}
        initialPsychic={{
          ...emptyPsychic,
          minorPowers: [
            {
              id: "linked-minor",
              name: "Linked Minor",
              known: true,
              isMinor: true,
              talentEntryUid: "minor-purchase-1",
            },
          ],
        }}
      />
    );
    expect(screen.queryByText("Available: 1")).not.toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Delete Linked Minor" })[0]);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getAllByText("Available: 1").length).toBeGreaterThan(0);
  });

  it("can add a power without consuming an available purchase", async () => {
    const user = userEvent.setup();
    const talents: TalentsAndTraitsBlock = {
      ...emptyTalents,
      talents: [
        { uid: "minor-purchase-1", talentId: "minor-psychic-power", name: "Minor Psychic Power" },
      ],
    };
    const { onUpdate } = renderTab({ talents });

    await user.click(screen.getAllByRole("button", { name: "Add Minor Power" })[0]);
    await user.click(screen.getByRole("button", { name: "Add independent Minor power" }));
    await user.click(await screen.findByRole("button", { name: "Select Fake Minor Power" }));

    const added = onUpdate.mock.calls[0][0].minorPowers[0];
    expect(added.talentEntryUid).toBeUndefined();
  });

  it("manually assigns an existing unlinked power to an available matching purchase", async () => {
    const user = userEvent.setup();
    const talents: TalentsAndTraitsBlock = {
      ...emptyTalents,
      talents: [{ uid: "major-purchase-1", talentId: "psychic-power", name: "Psychic Power" }],
    };
    const psychic: PsychicBlock = {
      ...emptyPsychic,
      majorPowers: [{ id: "existing-major", name: "Existing Major", known: true, isMinor: false }],
    };
    const { onUpdate } = renderTab({ talents, psychic });

    await user.click(screen.getAllByRole("button", { name: "Expand Existing Major details" })[0]);
    await user.click(screen.getAllByRole("button", { name: "Use Psychic Power selection" })[0]);

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        majorPowers: [expect.objectContaining({ talentEntryUid: "major-purchase-1" })],
      })
    );
  });

  it("removes a linked power without deleting its Talent purchase", async () => {
    const user = userEvent.setup();
    const talents: TalentsAndTraitsBlock = {
      ...emptyTalents,
      talents: [
        { uid: "minor-purchase-1", talentId: "minor-psychic-power", name: "Minor Psychic Power" },
      ],
    };
    const psychic: PsychicBlock = {
      ...emptyPsychic,
      minorPowers: [
        {
          id: "linked-minor",
          name: "Linked Minor",
          known: true,
          isMinor: true,
          talentEntryUid: "minor-purchase-1",
        },
      ],
    };
    const { onUpdate } = renderTab({ talents, psychic });
    await user.click(screen.getAllByRole("button", { name: "Delete Linked Minor" })[0]);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ minorPowers: [] }));
    expect(talents.talents).toHaveLength(1);
  });

  it("shows, consumes, and releases a Psy Rating power grant", async () => {
    const user = userEvent.setup();
    const talents: TalentsAndTraitsBlock = {
      ...emptyTalents,
      talents: [
        {
          uid: "psy-rating-purchase",
          talentId: "psy-rating-1",
          name: "Psy Rating 1",
          acquisition: {
            psyRatingWillpowerBonus: 4,
            psyRatingMinorPowerGrants: 2,
          },
        },
      ],
    };
    const { onUpdate } = renderTab({ talents });

    expect(screen.getAllByText("Available: 2").length).toBeGreaterThan(0);
    await user.click(screen.getAllByRole("button", { name: "Add Minor Power" })[0]);
    const psyRatingRoute = screen.getByRole("button", { name: "Use Psy Rating selection" });
    expect(psyRatingRoute).toHaveClass("rounded-lg", "border-slate-500");
    expect(within(psyRatingRoute).getByText("Available: 2")).toHaveClass("text-indigo-300");
    await user.click(screen.getByRole("button", { name: "Use Psy Rating selection" }));
    await user.click(await screen.findByRole("button", { name: "Select Fake Minor Power" }));

    const linked = onUpdate.mock.calls[0][0] as PsychicBlock;
    expect(linked.minorPowers[0].psyRatingTalentEntryUid).toBe("psy-rating-purchase");

    onUpdate.mockClear();
    const linkedRender = renderTab({ talents, psychic: linked });
    await user.click(screen.getAllByRole("button", { name: "Delete Fake Minor Power" }).at(-1)!);
    await user.click(screen.getAllByRole("button", { name: "Delete" }).at(-1)!);
    expect(linkedRender.onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ minorPowers: [] })
    );
  });

  it("keeps consuming the selected Psy Rating grant until every selection is used, then returns to the route menu", async () => {
    const user = userEvent.setup();
    const talents: TalentsAndTraitsBlock = {
      ...emptyTalents,
      talents: [
        {
          uid: "psy-rating-purchase",
          talentId: "psy-rating-1",
          name: "Psy Rating 1",
          acquisition: {
            psyRatingWillpowerBonus: 4,
            psyRatingMinorPowerGrants: 2,
          },
        },
      ],
    };
    render(<StatefulPsychicTab talents={talents} />);

    await user.click(screen.getAllByRole("button", { name: "Add Minor Power" })[0]);
    await user.click(screen.getByRole("button", { name: "Use Psy Rating selection" }));
    await user.click(await screen.findByRole("button", { name: "Select Fake Minor Power" }));
    await user.click(await screen.findByRole("button", { name: "Select Second Fake Minor Power" }));

    expect(screen.getByRole("dialog", { name: "Add Minor Power" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Add Psychic Power" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Use Psy Rating selection" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add independent Minor power" })).toBeInTheDocument();
    expect(screen.queryByText("All selections used")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Select Third Fake Minor Power" })
    ).not.toBeInTheDocument();
    expect(screen.getAllByText("Psy Rating 1")).toHaveLength(4);
    expect(screen.queryByText("Psy Rating grant")).not.toBeInTheDocument();
  });

  it("manually assigns an existing unlinked power to a Psy Rating grant", async () => {
    const user = userEvent.setup();
    const talents: TalentsAndTraitsBlock = {
      ...emptyTalents,
      talents: [
        {
          uid: "psy-rating-purchase",
          talentId: "psy-rating-3",
          name: "Psy Rating 3",
          acquisition: { psyRatingMajorPowerGrants: 1, psyRatingDiscipline: "Telepathy" },
        },
      ],
    };
    const psychic: PsychicBlock = {
      ...emptyPsychic,
      majorPowers: [
        { id: "existing", name: "Existing Major", discipline: "Telepathy", known: true },
      ],
    };
    const { onUpdate } = renderTab({ talents, psychic });
    await user.click(screen.getAllByRole("button", { name: "Expand Existing Major details" })[0]);
    await user.click(screen.getByRole("button", { name: "Use Psy Rating selection" }));
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        majorPowers: [expect.objectContaining({ psyRatingTalentEntryUid: "psy-rating-purchase" })],
      })
    );
  });
});
