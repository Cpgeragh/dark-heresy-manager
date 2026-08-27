// tests/integration/Dashboard.test.tsx
//
// PortraitUpload, RecoveryBackupBanner, QrModal, ClaimForm, and ClaimPreview are
// all mocked — each already has (or is separately queued for) its own dedicated
// test file. useRecoveryLookup and useClaimActions are also mocked directly, same
// reasoning. This file is scoped to Dashboard's own orchestration: DM campaign
// CRUD (create/edit/archive/delete-with-preflight-progress/restore), the QR panel
// gating, the player campaign list, and the claim-a-character flow including the
// ?code= URL auto-lookup.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { User } from "firebase/auth";
import "@testing-library/jest-dom";

const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

const useCampaignsContextMock = vi.fn();
vi.mock("../../src/context/useCampaignsContext", () => ({
  useCampaignsContext: () => useCampaignsContextMock(),
}));

const usePlayerCharactersMock = vi.fn();
vi.mock("../../src/hooks/usePlayerCharacters", () => ({
  usePlayerCharacters: (...args: unknown[]) => usePlayerCharactersMock(...args),
}));

const useArchivedCampaignsMock = vi.fn();
vi.mock("../../src/hooks/useArchivedCampaigns", () => ({
  useArchivedCampaigns: (...args: unknown[]) => useArchivedCampaignsMock(...args),
}));

const useRecoveryLookupMock = vi.fn();
vi.mock("../../src/pages/ClaimCharacter/hooks/useRecoveryLookup", () => ({
  useRecoveryLookup: () => useRecoveryLookupMock(),
}));

const claimCharacterMock = vi.fn();
vi.mock("../../src/pages/ClaimCharacter/hooks/useClaimActions", () => ({
  useClaimActions: () => ({ claimCharacter: claimCharacterMock }),
}));

const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastWarning = vi.fn();
vi.mock("../../src/components/Toast", () => ({
  useToast: () => ({ error: mockToastError, success: mockToastSuccess, warning: mockToastWarning }),
}));

const createCampaignMock = vi.fn();
const updateCampaignDetailsMock = vi.fn();
const archiveCampaignMock = vi.fn();
const restoreCampaignMock = vi.fn();
const preflightCampaignDeletionMock = vi.fn();
const deleteCampaignMock = vi.fn();
vi.mock("../../src/services/campaignService", () => ({
  createCampaign: (...args: unknown[]) => createCampaignMock(...args),
  updateCampaignDetails: (...args: unknown[]) => updateCampaignDetailsMock(...args),
  archiveCampaign: (...args: unknown[]) => archiveCampaignMock(...args),
  restoreCampaign: (...args: unknown[]) => restoreCampaignMock(...args),
  preflightCampaignDeletion: (...args: unknown[]) => preflightCampaignDeletionMock(...args),
  deleteCampaign: (...args: unknown[]) => deleteCampaignMock(...args),
}));

vi.mock("../../src/components/PortraitUpload", () => ({
  PortraitUpload: () => <div>Mock Portrait</div>,
}));

vi.mock("../../src/components/RecoveryBackupBanner", () => ({
  RecoveryBackupBanner: () => <div>Mock RecoveryBackupBanner</div>,
}));

vi.mock("../../src/ui/QrModal", () => ({
  QrModal: ({ onClose }: { onClose: () => void }) => (
    <div>
      Mock QrModal
      <button onClick={onClose}>Mock Close QrModal</button>
    </div>
  ),
}));

vi.mock("../../src/pages/ClaimCharacter/ClaimForm", () => ({
  ClaimForm: ({
    code,
    onCodeChange,
    onSubmit,
  }: {
    code: string;
    onCodeChange: (value: string) => void;
    onSubmit: () => void;
  }) => (
    <div>
      <input
        aria-label="Recovery code"
        value={code}
        onChange={(e) => onCodeChange(e.target.value)}
      />
      <button onClick={onSubmit}>Mock Lookup</button>
    </div>
  ),
}));

vi.mock("../../src/pages/ClaimCharacter/ClaimPreview", () => ({
  ClaimPreview: ({
    characterName,
    onClaim,
  }: {
    characterName: string;
    onClaim: () => void;
  }) => (
    <div>
      Mock ClaimPreview: {characterName}
      <button onClick={onClaim}>Mock Claim</button>
    </div>
  ),
}));

import Dashboard from "../../src/pages/Dashboard";
import type { CampaignWithId, CharacterListItem } from "../../src/types/Firestore";

const user1 = { uid: "user-1" } as User;

function dmCampaign(over: Partial<CampaignWithId> = {}): CampaignWithId {
  return { id: "campaign-1", name: "The Lathe Run", dmId: "user-1", ...over } as CampaignWithId;
}

function playerCharacter(over: Partial<CharacterListItem> = {}): CharacterListItem {
  return {
    id: "char-1",
    campaignId: "campaign-2",
    userId: "user-1",
    isEditableByPlayer: true,
    recoveryCode: "DH-AAAA-BBBB",
    header: { characterName: "Vex" },
    ...over,
  } as CharacterListItem;
}

function renderDashboard(props: Partial<React.ComponentProps<typeof Dashboard>> = {}) {
  render(
    <MemoryRouter>
      <Dashboard
        user={user1}
        effectiveUserId="user-1"
        isLinked={false}
        firstName="Alice"
        {...props}
      />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useCampaignsContextMock.mockReturnValue({
    dmCampaigns: [],
    playerCampaigns: [],
    dmLoading: false,
    playerLoading: false,
    dmError: null,
    playerError: null,
  });
  usePlayerCharactersMock.mockReturnValue({ characters: [], loading: false, error: null });
  useArchivedCampaignsMock.mockReturnValue({ campaigns: [], loading: false, error: null });
  useRecoveryLookupMock.mockReturnValue({ loading: false, error: null, data: null, lookup: vi.fn() });
});

describe("Dashboard DM campaign list", () => {
  it("creates a campaign and shows a success toast", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.type(screen.getByPlaceholderText("Campaign Name"), "New Crusade");
    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(createCampaignMock).toHaveBeenCalledWith("New Crusade", "user-1", "Alice", undefined);
    await waitFor(() => expect(mockToastSuccess).toHaveBeenCalledWith("Campaign created successfully"));
  });

  it("passes a typed Inquisitor Name through to createCampaign", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.type(screen.getByPlaceholderText("Inquisitor Name (optional)"), "Inquisitor Vail");
    await user.type(screen.getByPlaceholderText("Campaign Name"), "New Crusade");
    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(createCampaignMock).toHaveBeenCalledWith(
      "New Crusade",
      "user-1",
      "Alice",
      "Inquisitor Vail"
    );
  });

  it("shows a warning toast and does not create a campaign for an invalid name", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(createCampaignMock).not.toHaveBeenCalled();
    expect(mockToastWarning).toHaveBeenCalled();
  });

  it("edits a campaign name inline", async () => {
    const user = userEvent.setup();
    useCampaignsContextMock.mockReturnValue({
      dmCampaigns: [dmCampaign()],
      playerCampaigns: [],
      dmLoading: false,
      playerLoading: false,
      dmError: null,
      playerError: null,
    });
    renderDashboard();

    await user.click(screen.getByRole("button", { name: "Edit" }));
    const input = screen.getByLabelText("Edit campaign name");
    await user.clear(input);
    await user.type(input, "Renamed Crusade");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(updateCampaignDetailsMock).toHaveBeenCalledWith("campaign-1", "Renamed Crusade", "");
  });

  it("seeds and edits the Inquisitor Name alongside the campaign name", async () => {
    const user = userEvent.setup();
    useCampaignsContextMock.mockReturnValue({
      dmCampaigns: [dmCampaign({ inquisitorName: "Inquisitor Vail" })],
      playerCampaigns: [],
      dmLoading: false,
      playerLoading: false,
      dmError: null,
      playerError: null,
    });
    renderDashboard();

    await user.click(screen.getByRole("button", { name: "Edit" }));
    const inquisitorInput = screen.getByLabelText("Edit Inquisitor name");
    expect(inquisitorInput).toHaveValue("Inquisitor Vail");
    await user.clear(inquisitorInput);
    await user.type(inquisitorInput, "Inquisitor Rey");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(updateCampaignDetailsMock).toHaveBeenCalledWith(
      "campaign-1",
      "The Lathe Run",
      "Inquisitor Rey"
    );
  });

  it("archives a campaign", async () => {
    const user = userEvent.setup();
    useCampaignsContextMock.mockReturnValue({
      dmCampaigns: [dmCampaign()],
      playerCampaigns: [],
      dmLoading: false,
      playerLoading: false,
      dmError: null,
      playerError: null,
    });
    renderDashboard();

    await user.click(screen.getByRole("button", { name: "Archive" }));
    await user.click(screen.getByRole("button", { name: "Yes" }));

    expect(archiveCampaignMock).toHaveBeenCalledWith("campaign-1");
  });

  it("runs the delete-with-preflight-and-progress flow for an active campaign", async () => {
    const user = userEvent.setup();
    preflightCampaignDeletionMock.mockResolvedValue({ jobId: "job-1", totalCount: 5 });
    useCampaignsContextMock.mockReturnValue({
      dmCampaigns: [dmCampaign()],
      playerCampaigns: [],
      dmLoading: false,
      playerLoading: false,
      dmError: null,
      playerError: null,
    });
    renderDashboard();

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() =>
      expect(screen.getByText("This permanently deletes 5 documents.")).toBeInTheDocument()
    );
    expect(screen.getByRole("button", { name: "Yes" })).toBeDisabled();

    await user.type(screen.getByPlaceholderText("DELETE"), "DELETE");
    await user.click(screen.getByRole("button", { name: "Yes" }));

    expect(deleteCampaignMock).toHaveBeenCalledWith("job-1", expect.any(Function));
  });

  it("shows archived campaigns behind a toggle, with a working restore action", async () => {
    const user = userEvent.setup();
    useArchivedCampaignsMock.mockReturnValue({
      campaigns: [dmCampaign({ id: "campaign-2", name: "Retired Crusade" })],
      loading: false,
      error: null,
    });
    renderDashboard();

    expect(screen.queryByText("Retired Crusade")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Archived/ }));
    expect(screen.getByText("Retired Crusade")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Restore" }));
    expect(restoreCampaignMock).toHaveBeenCalledWith("campaign-2");
  });
});

describe("Dashboard QR panel", () => {
  it("only shows Share App when the DM has campaigns and isn't a linked device", () => {
    renderDashboard({ isLinked: false });
    expect(screen.queryByRole("button", { name: "Share App" })).not.toBeInTheDocument();

    useCampaignsContextMock.mockReturnValue({
      dmCampaigns: [dmCampaign()],
      playerCampaigns: [],
      dmLoading: false,
      playerLoading: false,
      dmError: null,
      playerError: null,
    });
    renderDashboard({ isLinked: false });
    expect(screen.getByRole("button", { name: "Share App" })).toBeInTheDocument();

    renderDashboard({ isLinked: true });
    expect(screen.getAllByRole("button", { name: "Share App" })).toHaveLength(1);
  });
});

describe("Dashboard player section", () => {
  it("shows a message when the player has no campaigns", () => {
    renderDashboard();
    expect(
      screen.getByText(/You are not part of any campaigns yet/)
    ).toBeInTheDocument();
  });

  it("renders a campaign row with only that campaign's characters", () => {
    useCampaignsContextMock.mockReturnValue({
      dmCampaigns: [],
      playerCampaigns: [{ id: "campaign-2", name: "Second Campaign" }],
      dmLoading: false,
      playerLoading: false,
      dmError: null,
      playerError: null,
    });
    usePlayerCharactersMock.mockReturnValue({
      characters: [
        playerCharacter({ id: "c1", campaignId: "campaign-2" }),
        playerCharacter({ id: "c2", campaignId: "campaign-3", header: { characterName: "Other" } }),
      ],
      loading: false,
      error: null,
    });
    renderDashboard();

    expect(screen.getByText("Second Campaign")).toBeInTheDocument();
    expect(screen.getByText("Vex")).toBeInTheDocument();
    expect(screen.queryByText("Other")).not.toBeInTheDocument();
  });
});

describe("Dashboard claim-a-character flow", () => {
  it("shows the claim preview once a lookup resolves, and claims on confirm", async () => {
    const user = userEvent.setup();
    useRecoveryLookupMock.mockReturnValue({
      loading: false,
      error: null,
      data: { characterName: "Vex", campaignName: "The Lathe Run", ownership: "unclaimed" },
      lookup: vi.fn(),
    });
    claimCharacterMock.mockResolvedValue({ campaignId: "campaign-1", characterId: "char-1" });
    renderDashboard();

    expect(screen.getByText("Mock ClaimPreview: Vex")).toBeInTheDocument();
    await user.click(screen.getByText("Mock Claim"));

    expect(claimCharacterMock).toHaveBeenCalled();
    await waitFor(() => expect(navigateMock).toHaveBeenCalled());
  });

  it("shows an error when claiming fails", async () => {
    const user = userEvent.setup();
    useRecoveryLookupMock.mockReturnValue({
      loading: false,
      error: null,
      data: { characterName: "Vex", campaignName: "The Lathe Run", ownership: "unclaimed" },
      lookup: vi.fn(),
    });
    claimCharacterMock.mockRejectedValue(new Error("Already claimed"));
    renderDashboard();

    await user.click(screen.getByText("Mock Claim"));

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith("Already claimed"));
    expect(screen.getByText("Already claimed")).toBeInTheDocument();
  });

  it("auto-looks-up a code passed in the URL on mount", () => {
    const lookup = vi.fn();
    useRecoveryLookupMock.mockReturnValue({ loading: false, error: null, data: null, lookup });
    window.history.pushState({}, "", "/?code=DH-AAAA-BBBB");

    renderDashboard();

    expect(lookup).toHaveBeenCalledWith("DH-AAAA-BBBB");
    window.history.pushState({}, "", "/");
  });
});
