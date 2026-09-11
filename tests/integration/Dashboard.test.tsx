// tests/integration/Dashboard.test.tsx
//
// PortraitUpload, RecoveryBackupBanner, QrModal, and ClaimPreview are
// all mocked — each already has its own dedicated test file. useRecoveryLookup
// and the claim service are also mocked directly, same reasoning. This file is
// scoped to Dashboard's own orchestration: DM campaign
// CRUD (create/edit/archive/delete-with-preflight-progress/restore), the QR panel
// gating, the player campaign list, and the claim-a-character flow including the
// ?code= URL auto-lookup.
import { afterEach, describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
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

const useArchivedCampaignsMock = vi.fn();
vi.mock("../../src/hooks/useArchivedCampaigns", () => ({
  useArchivedCampaigns: (...args: unknown[]) => useArchivedCampaignsMock(...args),
}));

const useRecoveryLookupMock = vi.fn();
const resetRecoveryLookupMock = vi.fn();
vi.mock("../../src/hooks/useRecoveryLookup", () => ({
  useRecoveryLookup: () => useRecoveryLookupMock(),
}));

const claimCharacterMock = vi.fn();
vi.mock("../../src/services/characterService", () => ({
  claimCharacter: (...args: unknown[]) => claimCharacterMock(...args),
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

vi.mock("../../src/ui/modals/QrModal", () => ({
  QrModal: ({ onClose }: { onClose: () => void }) => (
    <div>
      Mock QrModal
      <button onClick={onClose}>Mock Close QrModal</button>
    </div>
  ),
}));

vi.mock("../../src/pages/ClaimCharacter/ClaimPreview", () => ({
  ClaimPreview: ({ characterName, onClaim }: { characterName: string; onClaim: () => void }) => (
    <div>
      Mock ClaimPreview: {characterName}
      <button onClick={onClaim}>Mock Claim</button>
    </div>
  ),
}));

import Dashboard from "../../src/pages/Dashboard";
import type { CampaignWithId } from "../../src/types/Firestore";

const user1 = { uid: "user-1" } as User;
const desktopMatchMedia = window.matchMedia;

function dmCampaign(over: Partial<CampaignWithId> = {}): CampaignWithId {
  return { id: "campaign-1", name: "The Lathe Run", dmId: "user-1", ...over } as CampaignWithId;
}

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location-search">{location.search}</span>;
}

function renderDashboard(
  props: Partial<React.ComponentProps<typeof Dashboard>> = {},
  initialEntry = "/"
) {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Dashboard
        user={user1}
        effectiveUserId="user-1"
        isLinked={false}
        firstName="Alice"
        {...props}
      />
      <LocationProbe />
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
  useArchivedCampaignsMock.mockReturnValue({ campaigns: [], loading: false, error: null });
  useRecoveryLookupMock.mockReturnValue({
    loading: false,
    error: null,
    data: null,
    lookup: vi.fn(),
    reset: resetRecoveryLookupMock,
  });
});

afterEach(() => {
  window.matchMedia = desktopMatchMedia;
});

describe("Dashboard DM campaign list", () => {
  it("creates a campaign and shows a success toast", async () => {
    const user = userEvent.setup();
    renderDashboard();

    expect(screen.queryByLabelText("Campaign Name *")).not.toBeInTheDocument();
    expect(screen.queryByText("Create Campaign")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Create campaign" }));
    const form = screen.getByRole("dialog", { name: "Create Campaign" });
    await user.type(within(form).getByLabelText("Campaign Name *"), "New Crusade");
    await user.click(within(form).getByRole("button", { name: "Create campaign" }));

    expect(createCampaignMock).toHaveBeenCalledWith("New Crusade", undefined);
    await waitFor(() =>
      expect(mockToastSuccess).toHaveBeenCalledWith("Campaign created successfully")
    );
  });

  it("passes a typed Inquisitor Name through to createCampaign", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.click(screen.getByRole("button", { name: "Create campaign" }));
    const form = screen.getByRole("dialog", { name: "Create Campaign" });
    await user.type(within(form).getByLabelText(/Inquisitor Name/), "Inquisitor Vail");
    await user.type(within(form).getByLabelText("Campaign Name *"), "New Crusade");
    await user.click(within(form).getByRole("button", { name: "Create campaign" }));

    expect(createCampaignMock).toHaveBeenCalledWith("New Crusade", "Inquisitor Vail");
  });

  it("keeps campaign creation disabled until the required name is valid", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.click(screen.getByRole("button", { name: "Create campaign" }));
    const form = screen.getByRole("dialog", { name: "Create Campaign" });

    expect(within(form).getByRole("button", { name: "Create campaign" })).toBeDisabled();
    expect(createCampaignMock).not.toHaveBeenCalled();
    expect(mockToastWarning).not.toHaveBeenCalled();
  });

  it("submits campaign creation with Enter", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.click(screen.getByRole("button", { name: "Create campaign" }));
    await user.type(screen.getByLabelText("Campaign Name *"), "New Crusade{Enter}");

    expect(createCampaignMock).toHaveBeenCalledWith("New Crusade", undefined);
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

  it("saves an edited campaign with Enter", async () => {
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
    await user.type(input, "Renamed Crusade{Enter}");

    expect(updateCampaignDetailsMock).toHaveBeenCalledWith("campaign-1", "Renamed Crusade", "");
  });

  it("keeps an active create request visible when Escape is pressed", async () => {
    const user = userEvent.setup();
    let finish!: () => void;
    createCampaignMock.mockReturnValueOnce(new Promise<void>((resolve) => (finish = resolve)));
    renderDashboard();

    await user.click(screen.getByRole("button", { name: "Create campaign" }));
    const form = screen.getByRole("dialog", { name: "Create Campaign" });
    await user.type(within(form).getByLabelText("Campaign Name *"), "New Crusade");
    await user.click(within(form).getByRole("button", { name: "Create campaign" }));
    await user.keyboard("{Escape}");

    expect(screen.getByRole("dialog", { name: "Create Campaign" })).toBeVisible();
    finish();
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Create Campaign" })).not.toBeInTheDocument()
    );
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
    const dmEmptyState = screen.getByText("You have not created any campaigns yet.");
    const playerEmptyState = screen.getByText(/You are not part of any campaigns yet/);
    expect(dmEmptyState).toHaveClass("text-slate-500", "italic");
    expect(playerEmptyState).toHaveClass("text-slate-500", "italic");
    expect(dmEmptyState.parentElement).toHaveClass("space-y-3");
    expect(playerEmptyState.parentElement).toHaveClass("space-y-3");
    expect(dmEmptyState.closest(".rounded-lg")).toHaveClass("border-slate-500", "bg-slate-900/60");
    expect(playerEmptyState.closest(".rounded-lg")).toHaveClass(
      "border-slate-500",
      "bg-slate-900/60"
    );
    expect(screen.getByRole("button", { name: "Claim a character" })).toBeVisible();
    expect(screen.queryByText("No archived campaigns.")).not.toBeInTheDocument();
  });

  it("renders a clickable row for each campaign the player is in", () => {
    useCampaignsContextMock.mockReturnValue({
      dmCampaigns: [],
      playerCampaigns: [{ id: "campaign-2", name: "Second Campaign" }] as CampaignWithId[],
      dmLoading: false,
      playerLoading: false,
      dmError: null,
      playerError: null,
    });
    renderDashboard();

    expect(screen.getByRole("link", { name: "Second Campaign" })).toHaveAttribute(
      "href",
      "/campaign/campaign-2"
    );
  });

  it("keeps campaign actions outside the campaign navigation link", () => {
    useCampaignsContextMock.mockReturnValue({
      dmCampaigns: [dmCampaign()],
      playerCampaigns: [],
      dmLoading: false,
      playerLoading: false,
      dmError: null,
      playerError: null,
    });
    renderDashboard();

    const campaignLink = screen.getByRole("link", { name: "The Lathe Run" });
    expect(within(campaignLink).queryByRole("button")).not.toBeInTheDocument();
  });

  it("uses the standard segmented swipe layout on mobile", async () => {
    const user = userEvent.setup();
    window.matchMedia = (query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true,
      }) as MediaQueryList;

    renderDashboard();

    expect(screen.getByRole("tab", { name: "Your Campaigns" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByRole("heading", { name: "Your Campaigns" })).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: "Campaigns You Play In" })
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Playing In" }));

    expect(screen.getByRole("heading", { name: "Campaigns You Play In" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Your Campaigns" })).not.toBeInTheDocument();
  });
});

describe("Dashboard claim-a-character flow", () => {
  it("shows lookup failures in the global error toast", async () => {
    const user = userEvent.setup();
    useRecoveryLookupMock.mockReturnValue({
      loading: false,
      error: "No character found with this recovery code.",
      data: null,
      lookup: vi.fn(),
      reset: resetRecoveryLookupMock,
    });
    renderDashboard();

    await user.click(screen.getByRole("button", { name: "Claim a character" }));

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith("No character found with this recovery code.")
    );
    expect(
      screen.queryByText("No character found with this recovery code.")
    ).not.toBeInTheDocument();
  });

  it("clears the previous lookup when the form closes", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.click(screen.getByRole("button", { name: "Claim a character" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(resetRecoveryLookupMock).toHaveBeenCalledOnce();
  });

  it("submits a recovery-code lookup with Enter", async () => {
    const user = userEvent.setup();
    const lookup = vi.fn();
    useRecoveryLookupMock.mockReturnValue({
      loading: false,
      error: null,
      data: null,
      lookup,
      reset: resetRecoveryLookupMock,
    });
    renderDashboard();

    await user.click(screen.getByRole("button", { name: "Claim a character" }));
    await user.type(screen.getByLabelText("Recovery Code *"), "AAAABBBB{Enter}");

    expect(lookup).toHaveBeenCalledWith("DH-AAAA-BBBB");
  });

  it("shows the claim preview once a lookup resolves, and claims on confirm", async () => {
    const user = userEvent.setup();
    useRecoveryLookupMock.mockReturnValue({
      loading: false,
      error: null,
      data: { characterName: "Vex", campaignName: "The Lathe Run", ownership: "unclaimed" },
      lookup: vi.fn(),
      reset: resetRecoveryLookupMock,
    });
    claimCharacterMock.mockResolvedValue({ campaignId: "campaign-1", characterId: "char-1" });
    renderDashboard();

    expect(screen.queryByText("Mock ClaimPreview: Vex")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Claim a character" }));
    const form = screen.getByRole("dialog", { name: "Claim a Character" });
    expect(within(form).getByText("Mock ClaimPreview: Vex")).toBeInTheDocument();
    await user.click(within(form).getByText("Mock Claim"));

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
      reset: resetRecoveryLookupMock,
    });
    claimCharacterMock.mockRejectedValue(new Error("Already claimed"));
    renderDashboard();

    await user.click(screen.getByRole("button", { name: "Claim a character" }));
    const form = screen.getByRole("dialog", { name: "Claim a Character" });
    await user.click(within(form).getByText("Mock Claim"));

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith("Already claimed"));
    expect(screen.queryByText("Already claimed")).not.toBeInTheDocument();
  });

  it("auto-looks-up a code passed in the URL on mount", () => {
    const lookup = vi.fn();
    useRecoveryLookupMock.mockReturnValue({
      loading: false,
      error: null,
      data: null,
      lookup,
      reset: resetRecoveryLookupMock,
    });
    renderDashboard({}, "/?code=DH-AAAA-BBBB");

    expect(lookup).toHaveBeenCalledWith("DH-AAAA-BBBB");
    expect(screen.getByRole("dialog", { name: "Claim a Character" })).toBeVisible();
  });

  it("removes a recovery code from the URL when the form closes", async () => {
    const user = userEvent.setup();
    renderDashboard({}, "/?code=DH-AAAA-BBBB&source=qr");

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByTestId("location-search")).toHaveTextContent("?source=qr");
  });

  it("does not look up a malformed recovery code from the URL", () => {
    const lookup = vi.fn();
    useRecoveryLookupMock.mockReturnValue({
      loading: false,
      error: null,
      data: null,
      lookup,
      reset: resetRecoveryLookupMock,
    });

    renderDashboard({}, "/?code=bad-code");

    expect(lookup).not.toHaveBeenCalled();
    expect(mockToastWarning).toHaveBeenCalledWith("This recovery-code link is invalid.");
  });
});
