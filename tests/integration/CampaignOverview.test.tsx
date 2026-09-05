// tests/integration/CampaignOverview.test.tsx
//
// CharacterRow, SessionForm, SessionCard, DMInbox, and CustomItemLibraryAdmin are
// all mocked — each already has its own dedicated test file. This file is
// scoped to CampaignOverview's own orchestration:
// character creation/import, the repair-summaries action, search filtering, and
// DM-only wiring (including the kebab-menu content, which isn't rendered inside
// this component's own tree — it's handed to a header-extension setter to be
// displayed elsewhere, so those two tests capture and separately render it).
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { IMPORTANT_TOAST_DURATION } from "../../src/constants/ui";
import type { CampaignWithId, CharacterListItem } from "../../src/types/Firestore";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useParams: () => useParamsMock() };
});
const useParamsMock = vi.fn(() => ({ campaignId: "campaign-1" }));

const useCampaignMock = vi.fn();
vi.mock("../../src/hooks/useCampaign", () => ({
  useCampaign: (...args: unknown[]) => useCampaignMock(...args),
}));

const useSessionsMock = vi.fn();
vi.mock("../../src/hooks/useSessions", () => ({
  useSessions: (...args: unknown[]) => useSessionsMock(...args),
}));

const useCampaignCharactersMock = vi.fn();
vi.mock("../../src/hooks/useCampaignCharacters", () => ({
  useCampaignCharacters: (...args: unknown[]) => useCampaignCharactersMock(...args),
}));

const setKebabContentMock = vi.fn();
const clearKebabContentMock = vi.fn();
vi.mock("../../src/context/useHeaderExtension", () => ({
  useHeaderExtensionSetters: () => ({
    setKebabContent: setKebabContentMock,
    clearKebabContent: clearKebabContentMock,
  }),
}));

const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastWarning = vi.fn();
vi.mock("../../src/components/Toast", () => ({
  useToast: () => ({ error: mockToastError, success: mockToastSuccess, warning: mockToastWarning }),
}));

const createNewCharacterMock = vi.fn();
const importCharacterMock = vi.fn();
const repairCharacterSummariesMock = vi.fn();
vi.mock("../../src/services/characterService", () => ({
  createNewCharacter: (...args: unknown[]) => createNewCharacterMock(...args),
  importCharacter: (...args: unknown[]) => importCharacterMock(...args),
  repairCharacterSummaries: (...args: unknown[]) => repairCharacterSummariesMock(...args),
}));

const applySessionXpMock = vi.fn();
const repairSessionSummariesMock = vi.fn();
vi.mock("../../src/services/sessionService", () => ({
  applySessionXp: (...args: unknown[]) => applySessionXpMock(...args),
  repairSessionSummaries: (...args: unknown[]) => repairSessionSummariesMock(...args),
}));

const readCharacterImportFileMock = vi.fn();
vi.mock("../../src/firestore/firebaseValidation", async () => {
  const actual = await vi.importActual<typeof import("../../src/firestore/firebaseValidation")>(
    "../../src/firestore/firebaseValidation"
  );
  return {
    ...actual,
    readCharacterImportFile: (...args: unknown[]) => readCharacterImportFileMock(...args),
  };
});

vi.mock("../../src/pages/CampaignOverview/CharacterRow", () => ({
  CharacterRow: ({ characterName }: { characterName: string }) => (
    <div>Mock CharacterRow: {characterName}</div>
  ),
}));

const useCampaignCharacterSummariesMock = vi.fn();
vi.mock("../../src/hooks/useCampaignCharacterSummaries", () => ({
  useCampaignCharacterSummaries: (...args: unknown[]) => useCampaignCharacterSummariesMock(...args),
}));

vi.mock("../../src/pages/CampaignOverview/MyCharacterCard", () => ({
  MyCharacterCard: ({ character }: { character: { header?: { characterName?: string } } }) => (
    <div>Mock MyCharacterCard: {character.header?.characterName}</div>
  ),
}));

vi.mock("../../src/pages/CampaignOverview/PartyRosterTile", () => ({
  PartyRosterTile: ({ summary }: { summary: { characterName: string } }) => (
    <div>Mock PartyRosterTile: {summary.characterName}</div>
  ),
}));

vi.mock("../../src/pages/CampaignOverview/SessionForm", () => ({
  SessionForm: ({ onClose }: { onClose: () => void }) => (
    <div>
      Mock SessionForm
      <button onClick={onClose}>Mock Close Session Form</button>
    </div>
  ),
}));

vi.mock("../../src/pages/CampaignOverview/SessionCard", () => ({
  SessionCard: ({
    session,
    onDelete,
    onSave,
    onApplyXp,
  }: {
    session: { id: string };
    onDelete?: () => void;
    onSave?: () => void;
    onApplyXp?: () => void;
  }) => (
    <div>
      Mock SessionCard: {session.id}
      {onDelete && <button onClick={onDelete}>Mock Delete Session</button>}
      {onSave && <button onClick={onSave}>Mock Save Session</button>}
      {onApplyXp && <button onClick={onApplyXp}>Mock Apply XP</button>}
    </div>
  ),
}));

vi.mock("../../src/pages/CampaignOverview/DMInbox", () => ({
  DMInbox: () => <div>Mock DMInbox</div>,
}));

vi.mock("../../src/pages/CampaignOverview/CustomItemLibraryAdmin", () => ({
  CustomItemLibraryAdmin: () => <div>Mock CustomItemLibraryAdmin</div>,
}));

import CampaignOverview from "../../src/pages/CampaignOverview";

function character(over: Partial<CharacterListItem> = {}): CharacterListItem {
  return {
    id: "char-1",
    campaignId: "campaign-1",
    userId: "player-1",
    isEditableByPlayer: true,
    recoveryCode: "DH-AAAA-BBBB",
    header: { characterName: "Vex" },
    ...over,
  } as CharacterListItem;
}

function campaign(over: Partial<CampaignWithId> = {}): CampaignWithId {
  return { id: "campaign-1", name: "The Lathe Run", dmId: "dm-1", ...over } as CampaignWithId;
}

beforeEach(() => {
  vi.clearAllMocks();
  useParamsMock.mockReturnValue({ campaignId: "campaign-1" });
  useCampaignMock.mockReturnValue({ campaign: campaign(), loading: false, error: null });
  useSessionsMock.mockReturnValue({
    sessions: [],
    loading: false,
    error: null,
    deleteSession: vi.fn(),
    updateSession: vi.fn(),
  });
  useCampaignCharactersMock.mockReturnValue({ characters: [], loading: false, error: null });
  useCampaignCharacterSummariesMock.mockReturnValue({ summaries: [], loading: false, error: null });
});

function renderPage(effectiveUserId = "player-1") {
  render(<CampaignOverview effectiveUserId={effectiveUserId} />);
}

describe("CampaignOverview — character query role", () => {
  it("requests only the current player's full character documents", () => {
    renderPage("player-1");

    expect(useSessionsMock).toHaveBeenCalledWith("campaign-1", false);
    expect(useCampaignCharactersMock).toHaveBeenCalledWith("campaign-1", "player-1", false);
  });

  it("requests the DM campaign character view only for the campaign DM", () => {
    renderPage("dm-1");

    expect(useSessionsMock).toHaveBeenCalledWith("campaign-1", true);
    expect(useCampaignCharactersMock).toHaveBeenCalledWith("campaign-1", "dm-1", true);
  });
});

describe("CampaignOverview", () => {
  it("shows a message when no campaign is selected", () => {
    useParamsMock.mockReturnValue({ campaignId: undefined });
    renderPage();
    expect(screen.getByText("No campaign selected.")).toBeInTheDocument();
  });

  it("shows safe recovery actions when campaign or character data fails to load", () => {
    useCampaignMock.mockReturnValue({ campaign: undefined, loading: false, error: new Error("x") });
    renderPage();
    expect(
      screen.getByText(
        "Unable to load this campaign. You may no longer have access, or there may be a temporary connection problem."
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try Again" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Return to Dashboard" })).toBeInTheDocument();
    expect(useCampaignCharacterSummariesMock).toHaveBeenLastCalledWith(null);
  });

  it("shows a loading state", () => {
    useCampaignMock.mockReturnValue({ campaign: undefined, loading: true, error: null });
    renderPage();
    expect(screen.getByText("Loading campaign…")).toBeInTheDocument();
  });

  it("shows Campaign not found once loading finishes with no campaign", () => {
    useCampaignMock.mockReturnValue({ campaign: undefined, loading: false, error: null });
    renderPage();
    expect(screen.getByText("Campaign not found.")).toBeInTheDocument();
  });

  it("renders characters and filters them by search", async () => {
    const user = userEvent.setup();
    useCampaignCharactersMock.mockReturnValue({
      characters: [
        character({ id: "c1", header: { characterName: "Vex" } }),
        character({ id: "c2", header: { characterName: "Thrun" } }),
      ],
      loading: false,
      error: null,
    });
    renderPage("dm-1");

    expect(screen.getByText("Mock CharacterRow: Vex")).toBeInTheDocument();
    expect(screen.getByText("Mock CharacterRow: Thrun")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Search…"), "Vex");

    expect(screen.getByText("Mock CharacterRow: Vex")).toBeInTheDocument();
    expect(screen.queryByText("Mock CharacterRow: Thrun")).not.toBeInTheDocument();
  });

  it("creates a character and shows a success toast with the recovery code", async () => {
    const user = userEvent.setup();
    createNewCharacterMock.mockResolvedValue("DH-CCCC-DDDD");
    renderPage("dm-1");

    await user.type(screen.getByPlaceholderText("Character Name"), "Marcus");
    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(createNewCharacterMock).toHaveBeenCalledWith("campaign-1", "Marcus");
    expect(mockToastSuccess).toHaveBeenCalledWith(
      expect.stringContaining("DH-CCCC-DDDD"),
      IMPORTANT_TOAST_DURATION,
      "DH-CCCC-DDDD"
    );
    expect(screen.getByPlaceholderText("Character Name")).toHaveValue("");
  });

  it("shows a warning toast and does not create a character for an invalid name", async () => {
    const user = userEvent.setup();
    renderPage("dm-1");

    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(createNewCharacterMock).not.toHaveBeenCalled();
    expect(mockToastWarning).toHaveBeenCalled();
  });

  it("shows an error toast when character creation fails", async () => {
    const user = userEvent.setup();
    createNewCharacterMock.mockRejectedValue(new Error("Name already taken"));
    renderPage("dm-1");

    await user.type(screen.getByPlaceholderText("Character Name"), "Marcus");
    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(mockToastError).toHaveBeenCalledWith("Name already taken");
  });

  it("only shows DM-only sections and the Create-character controls for the DM", () => {
    useCampaignCharactersMock.mockReturnValue({
      characters: [character({ id: "c1", header: { characterName: "Vex" } })],
      loading: false,
      error: null,
    });
    renderPage("player-1");
    expect(screen.queryByText("Mock DMInbox")).not.toBeInTheDocument();
    expect(screen.queryByText("Mock CustomItemLibraryAdmin")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Character Name")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search…")).not.toBeInTheDocument();
    expect(screen.queryByText("Mock CharacterRow: Vex")).not.toBeInTheDocument();

    renderPage("dm-1");
    expect(screen.getByText("Mock DMInbox")).toBeInTheDocument();
    expect(screen.getByText("Mock CustomItemLibraryAdmin")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Character Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search…")).toBeInTheDocument();
  });

  it("wires SessionCard's delete/save/apply-XP handlers only for the DM", () => {
    useSessionsMock.mockReturnValue({
      sessions: [{ id: "s1", attendees: [], xpAwarded: 0 }],
      loading: false,
      error: null,
      deleteSession: vi.fn(),
      updateSession: vi.fn(),
    });

    renderPage("player-1");
    expect(screen.queryByText("Mock Delete Session")).not.toBeInTheDocument();

    renderPage("dm-1");
    expect(screen.getByText("Mock Delete Session")).toBeInTheDocument();
    expect(screen.getByText("Mock Save Session")).toBeInTheDocument();
    expect(screen.getByText("Mock Apply XP")).toBeInTheDocument();
  });

  it("clears the kebab content for a non-DM and sets it for the DM", () => {
    renderPage("player-1");
    expect(clearKebabContentMock).toHaveBeenCalled();
    expect(setKebabContentMock).not.toHaveBeenCalled();

    renderPage("dm-1");
    expect(setKebabContentMock).toHaveBeenCalled();
  });

  it("imports a character from a JSON file and shows a success toast", async () => {
    readCharacterImportFileMock.mockResolvedValue({});
    importCharacterMock.mockResolvedValue("Imported Hero");
    renderPage("dm-1");

    const kebabContent = setKebabContentMock.mock.calls.at(-1)?.[0];
    render(kebabContent);
    const file = new File(["{}"], "character.json", { type: "application/json" });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() =>
      expect(mockToastSuccess).toHaveBeenCalledWith(
        'Imported "Imported Hero" successfully',
        IMPORTANT_TOAST_DURATION
      )
    );
    expect(importCharacterMock).toHaveBeenCalledWith("campaign-1", {});
  });

  it("shows an error toast when import fails", async () => {
    readCharacterImportFileMock.mockRejectedValue(new Error("Invalid file"));
    renderPage("dm-1");

    const kebabContent = setKebabContentMock.mock.calls.at(-1)?.[0];
    render(kebabContent);
    const file = new File(["not json"], "character.json", { type: "application/json" });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith("Invalid file"));
  });

  it("repairs character summaries and shows a count-aware success toast", async () => {
    const user = userEvent.setup();
    repairCharacterSummariesMock.mockResolvedValue(3);
    renderPage("dm-1");

    const kebabContent = setKebabContentMock.mock.calls.at(-1)?.[0];
    render(kebabContent);
    await user.click(screen.getByRole("button", { name: "Repair Character Summaries" }));

    expect(repairCharacterSummariesMock).toHaveBeenCalledWith("campaign-1");
    await waitFor(() =>
      expect(mockToastSuccess).toHaveBeenCalledWith("Repaired 3 character summaries.")
    );
  });

  it("repairs historical session summaries and shows a count-aware success toast", async () => {
    const user = userEvent.setup();
    repairSessionSummariesMock.mockResolvedValue(2);
    renderPage("dm-1");

    const kebabContent = setKebabContentMock.mock.calls.at(-1)?.[0];
    render(kebabContent);
    await user.click(screen.getByRole("button", { name: "Repair Session Summaries" }));

    expect(repairSessionSummariesMock).toHaveBeenCalledWith("campaign-1");
    await waitFor(() =>
      expect(mockToastSuccess).toHaveBeenCalledWith("Repaired 2 session summaries.")
    );
  });
});

describe("CampaignOverview — GM and Inquisitor name", () => {
  it("shows the GM and Inquisitor name when both are set, for DM and player alike", () => {
    useCampaignMock.mockReturnValue({
      campaign: campaign({ gmName: "Cain", inquisitorName: "Inquisitor Vail" }),
      loading: false,
      error: null,
    });
    renderPage("dm-1");
    expect(screen.getByText("Cain")).toBeInTheDocument();
    expect(screen.getByText("Inquisitor Vail")).toBeInTheDocument();

    renderPage("player-1");
    expect(screen.getAllByText("Cain")).toHaveLength(2);
    expect(screen.getAllByText("Inquisitor Vail")).toHaveLength(2);
  });

  it("shows neither line when both are unset", () => {
    renderPage("dm-1");
    expect(screen.queryByText("GM")).not.toBeInTheDocument();
  });
});

describe("CampaignOverview — player-facing My Characters and Party", () => {
  it("shows My Characters instead of the DM Characters admin view, for a player", () => {
    useCampaignCharactersMock.mockReturnValue({
      characters: [character({ id: "c1", header: { characterName: "Vex" } })],
      loading: false,
      error: null,
    });
    renderPage("player-1");

    expect(screen.getByText("Mock MyCharacterCard: Vex")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search…")).not.toBeInTheDocument();
  });

  it("shows an empty state when the player has no character in this campaign", () => {
    renderPage("player-1");
    expect(
      screen.getByText("You haven't claimed a character in this campaign yet.")
    ).toBeInTheDocument();
  });

  it("shows the party roster, excluding the viewer's own character", () => {
    useCampaignCharactersMock.mockReturnValue({
      characters: [character({ id: "c1", header: { characterName: "Vex" } })],
      loading: false,
      error: null,
    });
    useCampaignCharacterSummariesMock.mockReturnValue({
      summaries: [
        { id: "c1", campaignId: "campaign-1", characterName: "Vex" },
        { id: "c2", campaignId: "campaign-1", characterName: "Thrun" },
      ],
      loading: false,
      error: null,
    });
    renderPage("player-1");

    expect(screen.queryByText("Mock PartyRosterTile: Vex")).not.toBeInTheDocument();
    expect(screen.getByText("Mock PartyRosterTile: Thrun")).toBeInTheDocument();
  });

  it("shows an empty state when no one else has joined", () => {
    renderPage("player-1");
    expect(screen.getByText("No one else has joined yet.")).toBeInTheDocument();
  });

  it("shows a loading state for the party roster", () => {
    useCampaignCharacterSummariesMock.mockReturnValue({
      summaries: [],
      loading: true,
      error: null,
    });
    renderPage("player-1");
    expect(screen.getByText("Loading the party roster…")).toBeInTheDocument();
  });

  it("shows an error state for the party roster", () => {
    useCampaignCharacterSummariesMock.mockReturnValue({
      summaries: [],
      loading: false,
      error: new Error("x"),
    });
    renderPage("player-1");
    expect(
      screen.getByText("Unable to load the party roster. Please refresh the page.")
    ).toBeInTheDocument();
  });

  it("does not show My Characters or Party for the DM", () => {
    renderPage("dm-1");
    expect(screen.queryByText("My Characters")).not.toBeInTheDocument();
    expect(screen.queryByText("Party")).not.toBeInTheDocument();
  });
});
