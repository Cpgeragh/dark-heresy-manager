// tests/integration/CampaignOverview.test.tsx
//
// CharacterRow, MyCharacterCard, PartyRosterTile, BeginSessionForm, SessionCard,
// CustomItemLibraryAdmin and the section drawer are all mocked, each already
// has its own dedicated test file. This file is scoped to the campaign page's
// own orchestration: which section opens from the link, the section menu for
// each role, character creation/import, the repair-summaries actions, search
// filtering, and DM-only wiring (including the kebab-menu content, which isn't
// rendered inside this component's own tree: it's handed to a header-extension
// setter to be displayed elsewhere, so those tests capture and separately
// render it).
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
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

const chatsState = vi.hoisted(() => ({
  value: { chats: [] as unknown[], loading: false, error: null as Error | null },
}));
vi.mock("../../src/context/useChatsContext", () => ({
  useChatsContext: () => chatsState.value,
}));
vi.mock("../../src/services/chatService", () => ({ clearChat: vi.fn() }));

vi.mock("../../src/components/SectionDrawer", () => ({
  SectionDrawer: ({
    navigation,
    onPageChange,
  }: {
    navigation: { pages: { id: string; label: string }[] };
    onPageChange: (id: string) => void;
  }) => (
    <div>
      {navigation.pages.map((page) => (
        <button key={page.id} onClick={() => onPageChange(page.id)}>
          Go to {page.label}
        </button>
      ))}
    </div>
  ),
}));

vi.mock("../../src/pages/CampaignOverview/CharacterRow", () => ({
  CharacterRow: ({
    characterId,
    characterName,
    onDeleted,
  }: {
    characterId: string;
    characterName: string;
    onDeleted?: (characterId: string) => void;
  }) => (
    <div>
      Mock CharacterRow: {characterName}
      <button onClick={() => onDeleted?.(characterId)}>Mock Delete {characterName}</button>
    </div>
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

vi.mock("../../src/pages/CampaignOverview/BeginSessionForm", () => ({
  BeginSessionForm: ({
    characters,
    onBegin,
    onClose,
  }: {
    characters: { id: string; characterName: string }[];
    onBegin: (date: string, attendees: string[]) => void;
    onClose: () => void;
  }) => (
    <div>
      Mock BeginSessionForm
      {characters.map((entry) => (
        <span key={entry.id}>Session attendee: {entry.characterName}</span>
      ))}
      <button onClick={() => onBegin("2026-10-17", ["c1"])}>Mock Begin</button>
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
    onCloseSession,
  }: {
    session: { id: string };
    onDelete?: () => void;
    onSave?: () => void;
    onApplyXp?: () => void;
    onCloseSession?: () => void;
  }) => (
    <div>
      Mock SessionCard: {session.id}
      {onDelete && <button onClick={onDelete}>Mock Delete Session</button>}
      {onSave && <button onClick={onSave}>Mock Save Session</button>}
      {onApplyXp && <button onClick={onApplyXp}>Mock Apply XP</button>}
      {onCloseSession && <button onClick={onCloseSession}>Mock Close Session</button>}
    </div>
  ),
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

function sessionsResult(over: Record<string, unknown> = {}) {
  return {
    sessions: [],
    openSession: null,
    loading: false,
    error: null,
    startSession: vi.fn(),
    closeSession: vi.fn(),
    deleteSession: vi.fn(),
    updateSession: vi.fn(),
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
  useParamsMock.mockReturnValue({ campaignId: "campaign-1" });
  useCampaignMock.mockReturnValue({ campaign: campaign(), loading: false, error: null });
  useSessionsMock.mockReturnValue(sessionsResult());
  useCampaignCharactersMock.mockReturnValue({ characters: [], loading: false, error: null });
  useCampaignCharacterSummariesMock.mockReturnValue({ summaries: [], loading: false, error: null });
});

function renderPage(effectiveUserId = "player-1", section?: string) {
  const search = section ? `?section=${section}` : "";
  render(
    <MemoryRouter initialEntries={[`/campaign/campaign-1${search}`]}>
      <CampaignOverview effectiveUserId={effectiveUserId} />
    </MemoryRouter>
  );
}

describe("CampaignOverview: what each section requests", () => {
  it("requests only the current player's own character documents on the Party section", () => {
    renderPage("player-1");

    expect(useCampaignCharactersMock).toHaveBeenCalledWith("campaign-1", "player-1");
    expect(useCampaignCharacterSummariesMock).toHaveBeenCalledWith("campaign-1");
    expect(useSessionsMock).not.toHaveBeenCalled();
  });

  it("requests only the character summaries for the campaign DM on the Party section", () => {
    renderPage("dm-1");

    expect(useCampaignCharactersMock).toHaveBeenCalledWith(null, "dm-1");
    expect(useCampaignCharacterSummariesMock).toHaveBeenCalledWith("campaign-1");
    expect(useSessionsMock).not.toHaveBeenCalled();
  });

  it("requests the sessions only on the Session History section, with the viewer's role", () => {
    renderPage("player-1", "sessions");
    expect(useSessionsMock).toHaveBeenCalledWith("campaign-1", false);
    expect(useCampaignCharactersMock).not.toHaveBeenCalled();

    renderPage("dm-1", "sessions");
    expect(useSessionsMock).toHaveBeenCalledWith("campaign-1", true);
  });
});

describe("CampaignOverview", () => {
  it("shows a message when no campaign is selected", () => {
    useParamsMock.mockReturnValue({ campaignId: undefined });
    renderPage();
    expect(screen.getByRole("heading", { name: "No Campaign Selected" })).toBeInTheDocument();
  });

  it("shows safe recovery actions when campaign data fails to load", () => {
    useCampaignMock.mockReturnValue({ campaign: undefined, loading: false, error: new Error("x") });
    renderPage();
    expect(
      screen.getByRole("heading", { name: "Unable to Load This Campaign" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "You may no longer have access, or there may be a temporary connection problem."
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try Again" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Return to Dashboard" })).toBeInTheDocument();
    expect(useCampaignCharacterSummariesMock).not.toHaveBeenCalled();
  });

  it("shows safe recovery actions when the player's characters fail to load", () => {
    useCampaignCharactersMock.mockReturnValue({
      characters: [],
      loading: false,
      error: new Error("x"),
    });
    renderPage("player-1");
    expect(screen.getByRole("button", { name: "Try Again" })).toBeInTheDocument();
  });

  function expectNothingShown() {
    expect(screen.queryByText("Loading campaign…")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Campaign Not Found" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "No Campaign Selected" })).not.toBeInTheDocument();
  }

  it("shows nothing, not even loading text, while the campaign loads", () => {
    useCampaignMock.mockReturnValue({ campaign: undefined, loading: true, error: null });
    renderPage();
    expectNothingShown();
  });

  it("shows nothing while the player's characters are still loading", () => {
    useCampaignCharactersMock.mockReturnValue({ characters: [], loading: true, error: null });
    renderPage("player-1");
    expectNothingShown();
    expect(screen.queryByText("No one else has joined yet.")).not.toBeInTheDocument();
  });

  it("shows nothing while the party roster is still loading, for a player", () => {
    useCampaignCharacterSummariesMock.mockReturnValue({
      summaries: [],
      loading: true,
      error: null,
    });
    renderPage("player-1");
    expectNothingShown();
    expect(screen.queryByText("No one else has joined yet.")).not.toBeInTheDocument();
  });

  it("shows nothing while sessions are still loading", () => {
    useSessionsMock.mockReturnValue(sessionsResult({ loading: true }));
    renderPage("dm-1", "sessions");
    expectNothingShown();
    expect(screen.queryByText("No sessions recorded yet.")).not.toBeInTheDocument();
  });

  it("shows Campaign Not Found once loading finishes with no campaign", () => {
    useCampaignMock.mockReturnValue({ campaign: undefined, loading: false, error: null });
    renderPage();
    expect(screen.getByRole("heading", { name: "Campaign Not Found" })).toBeInTheDocument();
  });
});

describe("CampaignOverview: sections and the section menu", () => {
  it("opens on Party by default, with the campaign name as the page title", () => {
    renderPage("dm-1");
    expect(screen.getByRole("heading", { level: 1, name: "The Lathe Run" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Party" })).toBeInTheDocument();
  });

  it("lists Party, Custom Item Library and Session History for the DM", () => {
    renderPage("dm-1");
    expect(screen.getByRole("button", { name: "Go to Party" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go to Custom Item Library" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go to Session History" })).toBeInTheDocument();
  });

  it("lists only Party and Session History for a player", () => {
    renderPage("player-1");
    expect(screen.getByRole("button", { name: "Go to Party" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go to Session History" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Go to Custom Item Library" })
    ).not.toBeInTheDocument();
  });

  it("switches sections from the menu and updates the title", async () => {
    const user = userEvent.setup();
    renderPage("dm-1");

    await user.click(screen.getByRole("button", { name: "Go to Session History" }));
    expect(screen.getByRole("heading", { name: "Session History" })).toBeInTheDocument();
    expect(screen.getByText("No sessions recorded yet.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create Character" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Go to Custom Item Library" }));
    expect(screen.getByRole("heading", { name: "Custom Item Library" })).toBeInTheDocument();
    expect(screen.getByText("Mock CustomItemLibraryAdmin")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Go to Party" }));
    expect(screen.getByRole("button", { name: "Create Character" })).toBeInTheDocument();
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "instant" });
  });

  it("opens the Custom Item Library section for the DM", () => {
    renderPage("dm-1", "custom-items");
    expect(screen.getByRole("heading", { name: "Custom Item Library" })).toBeInTheDocument();
    expect(screen.getByText("Mock CustomItemLibraryAdmin")).toBeInTheDocument();
  });

  it("falls back to Party when a player asks for the Custom Item Library", async () => {
    renderPage("player-1", "custom-items");

    await waitFor(() => expect(screen.getByRole("heading", { name: "Party" })).toBeInTheDocument());
    expect(screen.queryByText("Mock CustomItemLibraryAdmin")).not.toBeInTheDocument();
  });

  it("falls back to Party when the section in the link is not one of the sections", async () => {
    renderPage("dm-1", "nonsense");

    await waitFor(() => expect(screen.getByRole("heading", { name: "Party" })).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Create Character" })).toBeInTheDocument();
  });
});

describe("CampaignOverview: the DM's Party section", () => {
  it("renders characters and filters them by search", async () => {
    const user = userEvent.setup();
    useCampaignCharacterSummariesMock.mockReturnValue({
      summaries: [
        { id: "c1", campaignId: "campaign-1", characterName: "Vex", userId: "player-1" },
        { id: "c2", campaignId: "campaign-1", characterName: "Thrun", userId: null },
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

  async function openCreateWindow(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole("button", { name: "Create Character" }));
    return screen.findByRole("dialog", { name: "Create Character" });
  }

  it("creates a character from the plus window, shows the recovery code and closes it", async () => {
    const user = userEvent.setup();
    createNewCharacterMock.mockResolvedValue("DH-CCCC-DDDD");
    renderPage("dm-1");

    const dialog = await openCreateWindow(user);
    await user.type(within(dialog).getByRole("textbox", { name: "Character name" }), "Marcus");
    await user.click(within(dialog).getByRole("button", { name: "Create" }));

    expect(createNewCharacterMock).toHaveBeenCalledWith("campaign-1", "Marcus");
    expect(mockToastSuccess).toHaveBeenCalledWith(
      expect.stringContaining("DH-CCCC-DDDD"),
      IMPORTANT_TOAST_DURATION,
      "DH-CCCC-DDDD"
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Create Character" })).not.toBeInTheDocument()
    );
  });

  it("keeps Create disabled until a name is typed, so nothing is created without one", async () => {
    const user = userEvent.setup();
    renderPage("dm-1");

    const dialog = await openCreateWindow(user);
    const createButton = within(dialog).getByRole("button", { name: "Create" });
    expect(createButton).toBeDisabled();

    await user.click(createButton);
    expect(createNewCharacterMock).not.toHaveBeenCalled();

    await user.type(within(dialog).getByRole("textbox", { name: "Character name" }), "Marcus");
    expect(createButton).toBeEnabled();
  });

  it("shows an error toast and keeps the window open when character creation fails", async () => {
    const user = userEvent.setup();
    createNewCharacterMock.mockRejectedValue(new Error("Name already taken"));
    renderPage("dm-1");

    const dialog = await openCreateWindow(user);
    await user.type(within(dialog).getByRole("textbox", { name: "Character name" }), "Marcus");
    await user.click(within(dialog).getByRole("button", { name: "Create" }));

    expect(mockToastError).toHaveBeenCalledWith("Name already taken");
    expect(screen.getByRole("dialog", { name: "Create Character" })).toBeInTheDocument();
  });

  it("clears the typed name when the window is cancelled", async () => {
    const user = userEvent.setup();
    renderPage("dm-1");

    const dialog = await openCreateWindow(user);
    await user.type(within(dialog).getByRole("textbox", { name: "Character name" }), "Marcus");
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog", { name: "Create Character" })).not.toBeInTheDocument();

    const reopened = await openCreateWindow(user);
    expect(within(reopened).getByRole("textbox", { name: "Character name" })).toHaveValue("");
    expect(createNewCharacterMock).not.toHaveBeenCalled();
  });

  it("only shows the search and Create-character controls to the DM", () => {
    useCampaignCharactersMock.mockReturnValue({
      characters: [character({ id: "c1", header: { characterName: "Vex" } })],
      loading: false,
      error: null,
    });
    renderPage("player-1");
    expect(screen.queryByRole("button", { name: "Create Character" })).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search…")).not.toBeInTheDocument();
    expect(screen.queryByText("Mock CharacterRow: Vex")).not.toBeInTheDocument();

    renderPage("dm-1");
    expect(screen.getByRole("button", { name: "Create Character" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search…")).toBeInTheDocument();
  });

  it("lists every character equally, with no player style card", () => {
    useCampaignCharacterSummariesMock.mockReturnValue({
      summaries: [{ id: "c1", campaignId: "campaign-1", characterName: "Vex", userId: "dm-1" }],
      loading: false,
      error: null,
    });
    renderPage("dm-1");

    expect(screen.getByText("Mock CharacterRow: Vex")).toBeInTheDocument();
    expect(screen.queryByText(/Mock MyCharacterCard/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Mock PartyRosterTile/)).not.toBeInTheDocument();
  });
});

describe("CampaignOverview: the Session History section", () => {
  it("wires SessionCard's delete/save/apply-XP handlers only for the DM", () => {
    useSessionsMock.mockReturnValue(
      sessionsResult({ sessions: [{ id: "s1", attendees: [], xpAwarded: 0 }] })
    );

    renderPage("player-1", "sessions");
    expect(screen.getByText("Mock SessionCard: s1")).toBeInTheDocument();
    expect(screen.queryByText("Mock Delete Session")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Begin Session" })).not.toBeInTheDocument();

    renderPage("dm-1", "sessions");
    expect(screen.getByText("Mock Delete Session")).toBeInTheDocument();
    expect(screen.getByText("Mock Save Session")).toBeInTheDocument();
    expect(screen.getByText("Mock Apply XP")).toBeInTheDocument();
  });

  it("offers the DM every campaign character as a session attendee, claimed or not", async () => {
    const user = userEvent.setup();
    useCampaignCharacterSummariesMock.mockReturnValue({
      summaries: [
        { id: "c1", campaignId: "campaign-1", characterName: "Vex", userId: "player-1" },
        { id: "c2", campaignId: "campaign-1", characterName: "Thrun", userId: null },
      ],
      loading: false,
      error: null,
    });
    renderPage("dm-1", "sessions");

    await user.click(screen.getByRole("button", { name: "Begin Session" }));

    expect(screen.getByText("Session attendee: Vex")).toBeInTheDocument();
    expect(screen.getByText("Session attendee: Thrun")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Begin Session" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Mock Close Session Form" }));
    expect(screen.getByRole("button", { name: "Begin Session" })).toBeInTheDocument();
  });

  it("disables Begin Session with a note while a session is open", () => {
    useSessionsMock.mockReturnValue(
      sessionsResult({
        sessions: [{ id: "s1", status: "open", attendees: [], xpAwarded: 0 }],
        openSession: { id: "s1", status: "open", attendees: [], xpAwarded: 0 },
      })
    );
    renderPage("dm-1", "sessions");

    expect(screen.getByRole("button", { name: "Begin Session" })).toBeDisabled();
    expect(
      screen.getByText("Close the open session before beginning another.")
    ).toBeInTheDocument();
  });

  it("begins and closes sessions through the hook", async () => {
    const user = userEvent.setup();
    const startSession = vi.fn().mockResolvedValue(undefined);
    useSessionsMock.mockReturnValue(
      sessionsResult({
        startSession,
        sessions: [{ id: "s1", status: "open", attendees: [], xpAwarded: 0 }],
      })
    );
    renderPage("dm-1", "sessions");

    expect(screen.getByRole("button", { name: "Mock Close Session" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Begin Session" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Begin Session" }));
    await user.click(screen.getByRole("button", { name: "Mock Begin" }));

    expect(startSession).toHaveBeenCalledWith("2026-10-17", ["c1"]);
  });

  it("shows an error state when the sessions fail to load", () => {
    useSessionsMock.mockReturnValue(sessionsResult({ error: new Error("x") }));
    renderPage("player-1", "sessions");
    expect(
      screen.getByText("Unable to load sessions. Please refresh the page.")
    ).toBeInTheDocument();
  });
});

describe("CampaignOverview: the header options menu", () => {
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

  it("opens the file chooser from the Import JSON button", async () => {
    const user = userEvent.setup();
    renderPage("dm-1");

    const kebabContent = setKebabContentMock.mock.calls.at(-1)?.[0];
    render(kebabContent);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, "click");
    await user.click(screen.getByRole("button", { name: "Import JSON" }));

    expect(clickSpy).toHaveBeenCalledTimes(1);
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

describe("CampaignOverview: GM and Inquisitor name", () => {
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

  it("shows the GM and Inquisitor name on the Party section only", async () => {
    const user = userEvent.setup();
    useCampaignMock.mockReturnValue({
      campaign: campaign({ gmName: "Cain" }),
      loading: false,
      error: null,
    });
    renderPage("dm-1");
    expect(screen.getByText("Cain")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Go to Session History" }));
    expect(screen.queryByText("Cain")).not.toBeInTheDocument();
  });

  it("shows neither line when both are unset", () => {
    renderPage("dm-1");
    expect(screen.queryByText("Game Master")).not.toBeInTheDocument();
  });
});

describe("CampaignOverview: the player's Party section", () => {
  it("shows the player's own character as a card, with no My Characters heading", () => {
    useCampaignCharactersMock.mockReturnValue({
      characters: [character({ id: "c1", header: { characterName: "Vex" } })],
      loading: false,
      error: null,
    });
    renderPage("player-1");

    expect(screen.getByText("Mock MyCharacterCard: Vex")).toBeInTheDocument();
    expect(screen.queryByText("My Characters")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search…")).not.toBeInTheDocument();
  });

  it("shows an empty state when the player has no character in this campaign", () => {
    renderPage("player-1");
    expect(
      screen.getByText("You haven't claimed a character in this campaign yet.")
    ).toBeInTheDocument();
  });

  it("shows the player's own card first, then the others as simple rows without it repeated", () => {
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
    expect(
      screen.getAllByText(/Mock (MyCharacterCard|PartyRosterTile)/).map((node) => node.textContent)
    ).toEqual(["Mock MyCharacterCard: Vex", "Mock PartyRosterTile: Thrun"]);
  });

  it("shows an empty state when no one else has joined", () => {
    renderPage("player-1");
    expect(screen.getByText("No one else has joined yet.")).toBeInTheDocument();
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
});

describe("CampaignOverview: messages", () => {
  it("has no Messages section for the DM, because messages live in the header now", () => {
    useCampaignCharactersMock.mockReturnValue({
      characters: [character({ id: "c1", header: { characterName: "Vex" } })],
      loading: false,
      error: null,
    });
    renderPage("dm-1");

    expect(screen.queryByText("Messages")).not.toBeInTheDocument();
  });
});

describe("CampaignOverview: chats after a character is deleted", () => {
  const chatFor = (characterId: string) => ({
    id: `campaign-1__${characterId}__player-1`,
    campaignId: "campaign-1",
    characterId,
    playerAccountId: "player-1",
    role: "dm",
    otherAccountId: "player-1",
    otherName: "Anna",
    campaignName: "Calixis",
    characterName: characterId,
    lastMessage: "Hello",
    lastTimestamp: null,
    unreadCount: 0,
    closed: true,
  });

  function renderAsDm() {
    useCampaignCharacterSummariesMock.mockReturnValue({
      summaries: [
        { id: "c1", campaignId: "campaign-1", characterName: "Vex", userId: "player-1" },
        { id: "c2", campaignId: "campaign-1", characterName: "Thrun", userId: "player-2" },
      ],
      loading: false,
      error: null,
    });
    renderPage("dm-1");
  }

  it("asks the DM whether to keep their chat once a character with a chat is deleted", async () => {
    const user = userEvent.setup();
    chatsState.value = { chats: [chatFor("c1")], loading: false, error: null };
    renderAsDm();

    await user.click(screen.getByRole("button", { name: "Mock Delete Vex" }));

    expect(await screen.findByRole("dialog", { name: "Keep your chat?" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Keep My Chat" }));
    expect(screen.queryByRole("dialog", { name: "Keep your chat?" })).not.toBeInTheDocument();
  });

  it("asks nothing when the deleted character had no chat", async () => {
    const user = userEvent.setup();
    chatsState.value = { chats: [chatFor("c1")], loading: false, error: null };
    renderAsDm();

    await user.click(screen.getByRole("button", { name: "Mock Delete Thrun" }));

    expect(screen.queryByRole("dialog", { name: /Keep your chat/ })).not.toBeInTheDocument();
  });
});
