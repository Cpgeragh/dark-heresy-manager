// tests/integration/CharacterRow.test.tsx

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { Timestamp } from "firebase/firestore";
import "@testing-library/jest-dom";

const {
  mockUseClaimLogs,
  mockPreflightCharacterDeletion,
  mockDeleteCharacter,
  mockRevealRecoveryCode,
  mockToastError,
} = vi.hoisted(() => ({
  mockUseClaimLogs: vi.fn(() => ({ logs: [], loading: false, error: null })),
  mockPreflightCharacterDeletion: vi.fn(),
  mockDeleteCharacter: vi.fn(),
  mockRevealRecoveryCode: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock("../../src/hooks/useClaimLogs", () => ({
  useClaimLogs: (...args: unknown[]) => mockUseClaimLogs(...args),
}));

vi.mock("../../src/services/characterService", () => ({
  preflightCharacterDeletion: mockPreflightCharacterDeletion,
  deleteCharacter: mockDeleteCharacter,
  revealRecoveryCode: mockRevealRecoveryCode,
}));

vi.mock("../../src/components/Toast", () => ({
  useToast: () => ({ error: mockToastError, success: vi.fn() }),
}));

import { CharacterRow } from "../../src/pages/CampaignOverview/CharacterRow";
import { ChatInboxProvider } from "../../src/context/ChatInboxProvider";
import { useChatInbox } from "../../src/context/useChatInbox";
import type { ClaimLogEntry } from "../../src/utils/claimLog";

function InboxProbe() {
  const { view } = useChatInbox();
  const location = useLocation();
  return (
    <>
      <p data-testid="inbox-view">{JSON.stringify(view)}</p>
      <p data-testid="path">{location.pathname}</p>
    </>
  );
}

function renderRow(overrides: Partial<React.ComponentProps<typeof CharacterRow>> = {}) {
  render(
    <MemoryRouter initialEntries={["/campaign/campaign-1"]}>
      <ChatInboxProvider>
        <CharacterRow
          campaignId="campaign-1"
          characterId="char-1"
          characterName="Vex"
          userId="uid-1"
          isDM={true}
          {...overrides}
        />
        <InboxProbe />
      </ChatInboxProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseClaimLogs.mockReturnValue({ logs: [], loading: false, error: null });
});

describe("CharacterRow display", () => {
  it("shows the character name, claimed status, and a Reveal control instead of the code itself", () => {
    renderRow();
    expect(screen.getByText("Vex")).toBeInTheDocument();
    expect(screen.getByText("Claimed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reveal" })).toBeInTheDocument();
    expect(screen.queryByText(/DH-/)).not.toBeInTheDocument();
  });

  it("shows Unclaimed when unowned, still behind a Reveal control", () => {
    renderRow({ userId: null });
    expect(screen.getByText("Unclaimed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reveal" })).toBeInTheDocument();
  });

  it("hides History and Delete for non-DM viewers", () => {
    renderRow({ isDM: false });
    expect(screen.queryByRole("button", { name: "History" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });

  it("shows History and Delete for the DM", () => {
    renderRow({ isDM: true });
    expect(screen.getByRole("button", { name: "History" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });
});

describe("CharacterRow Message button", () => {
  it("shows a Message button to the DM for a claimed character", () => {
    renderRow();
    expect(screen.getByRole("button", { name: "Message" })).toBeInTheDocument();
  });

  it("hides the Message button on an unclaimed character", () => {
    renderRow({ userId: null });
    expect(screen.queryByRole("button", { name: "Message" })).not.toBeInTheDocument();
  });

  it("hides the Message button from non-DM viewers", () => {
    renderRow({ isDM: false });
    expect(screen.queryByRole("button", { name: "Message" })).not.toBeInTheDocument();
  });

  it("opens that character's chat with its player without following the card link", async () => {
    const user = userEvent.setup();
    renderRow();

    await user.click(screen.getByRole("button", { name: "Message" }));

    expect(JSON.parse(screen.getByTestId("inbox-view").textContent ?? "")).toEqual({
      kind: "chat",
      target: {
        campaignId: "campaign-1",
        characterId: "char-1",
        playerAccountId: "uid-1",
        characterName: "Vex",
      },
    });
    expect(screen.getByTestId("path")).toHaveTextContent("/campaign/campaign-1");
  });
});

describe("CharacterRow reveal flow", () => {
  it("fetches and shows the code only after Reveal is clicked", async () => {
    const user = userEvent.setup();
    let resolveReveal: (code: string) => void;
    mockRevealRecoveryCode.mockReturnValue(
      new Promise((resolve) => {
        resolveReveal = resolve;
      })
    );
    renderRow();

    expect(mockRevealRecoveryCode).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Reveal" }));

    expect(mockRevealRecoveryCode).toHaveBeenCalledWith("campaign-1", "char-1");
    expect(screen.getByRole("button", { name: "Revealing" })).toBeDisabled();

    resolveReveal!("DH-AAAA-BBBB");
    await waitFor(() => expect(screen.getByText("Recovery: DH-AAAA-BBBB")).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "Reveal" })).not.toBeInTheDocument();
  });

  it("shows an error via toast and leaves the Reveal button available again on failure", async () => {
    const user = userEvent.setup();
    mockRevealRecoveryCode.mockRejectedValue(new Error("Network unreachable"));
    renderRow();

    await user.click(screen.getByRole("button", { name: "Reveal" }));

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith("Network unreachable"));
    expect(screen.getByRole("button", { name: "Reveal" })).toBeInTheDocument();
  });
});

describe("CharacterRow delete flow", () => {
  it("keeps the confirmation closed until the affected documents have been counted", async () => {
    const user = userEvent.setup();
    let resolvePreflight: (value: { jobId: string; totalCount: number }) => void;
    mockPreflightCharacterDeletion.mockReturnValue(
      new Promise((resolve) => {
        resolvePreflight = resolve;
      })
    );
    renderRow();

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(screen.queryByText("Checking affected documents…")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Yes" })).not.toBeInTheDocument();

    resolvePreflight!({ jobId: "job-1", totalCount: 7 });
    await waitFor(() =>
      expect(screen.getByText("This permanently deletes 7 documents.")).toBeInTheDocument()
    );
    expect(screen.getByRole("button", { name: "Yes" })).toBeEnabled();
  });

  it("uses singular wording for exactly one affected document", async () => {
    const user = userEvent.setup();
    mockPreflightCharacterDeletion.mockResolvedValue({ jobId: "job-1", totalCount: 1 });
    renderRow();

    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() =>
      expect(screen.getByText("This permanently deletes 1 document.")).toBeInTheDocument()
    );
  });

  it("shows an error and keeps confirm disabled when the preflight check fails", async () => {
    const user = userEvent.setup();
    mockPreflightCharacterDeletion.mockRejectedValue(new Error("Network unreachable"));
    renderRow();

    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(screen.getByText("Network unreachable")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Yes" })).toBeDisabled();
  });

  it("drives the delete job and shows a loading confirm button without a count", async () => {
    const user = userEvent.setup();
    mockPreflightCharacterDeletion.mockResolvedValue({ jobId: "job-1", totalCount: 10 });
    let resolveDelete: () => void;
    mockDeleteCharacter.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveDelete = resolve;
        })
    );
    renderRow();

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Yes" })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: "Yes" }));

    expect(mockDeleteCharacter).toHaveBeenCalledWith("job-1");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Deleting" })).toBeInTheDocument()
    );

    resolveDelete!();
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: /Deleting/ })).not.toBeInTheDocument()
    );
  });

  it("reports the real error message via toast when the delete job fails", async () => {
    const user = userEvent.setup();
    mockPreflightCharacterDeletion.mockResolvedValue({ jobId: "job-1", totalCount: 3 });
    mockDeleteCharacter.mockRejectedValue(new Error("Chunk failed"));
    renderRow();

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Yes" })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: "Yes" }));

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith("Chunk failed"));
  });
});

describe("CharacterRow after a delete", () => {
  async function confirmDelete(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Yes" })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: "Yes" }));
  }

  it("tells the page which character was deleted once the delete job has finished", async () => {
    const user = userEvent.setup();
    const onDeleted = vi.fn();
    mockPreflightCharacterDeletion.mockResolvedValue({ jobId: "job-1", totalCount: 3 });
    mockDeleteCharacter.mockResolvedValue(undefined);
    renderRow({ onDeleted });

    await confirmDelete(user);

    await waitFor(() => expect(onDeleted).toHaveBeenCalledWith("char-1"));
  });

  it("does not tell the page anything when the delete job fails", async () => {
    const user = userEvent.setup();
    const onDeleted = vi.fn();
    mockPreflightCharacterDeletion.mockResolvedValue({ jobId: "job-1", totalCount: 3 });
    mockDeleteCharacter.mockRejectedValue(new Error("Chunk failed"));
    renderRow({ onDeleted });

    await confirmDelete(user);

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith("Chunk failed"));
    expect(onDeleted).not.toHaveBeenCalled();
  });

  it("still deletes when the page gives no callback", async () => {
    const user = userEvent.setup();
    mockPreflightCharacterDeletion.mockResolvedValue({ jobId: "job-1", totalCount: 3 });
    mockDeleteCharacter.mockResolvedValue(undefined);
    renderRow();

    await confirmDelete(user);

    await waitFor(() => expect(mockDeleteCharacter).toHaveBeenCalledWith("job-1"));
    expect(mockToastError).not.toHaveBeenCalled();
  });
});

describe("CharacterRow history modal", () => {
  it("only subscribes to claim logs once the DM opens History", async () => {
    const user = userEvent.setup();
    renderRow();

    expect(mockUseClaimLogs).toHaveBeenLastCalledWith("campaign-1", "char-1", false);

    await user.click(screen.getByRole("button", { name: "History" }));

    expect(mockUseClaimLogs).toHaveBeenLastCalledWith("campaign-1", "char-1", true);
  });

  it("keeps the History pop-up closed and shows no loading text while the history loads", async () => {
    mockUseClaimLogs.mockReturnValue({ logs: [], loading: true, error: null });
    const user = userEvent.setup();
    renderRow();
    await user.click(screen.getByRole("button", { name: "History" }));
    expect(screen.queryByRole("dialog", { name: "Character history" })).not.toBeInTheDocument();
    expect(screen.queryByText("Loading history…")).not.toBeInTheDocument();
  });

  it("shows an error state", async () => {
    mockUseClaimLogs.mockReturnValue({ logs: [], loading: false, error: new Error("boom") });
    const user = userEvent.setup();
    renderRow();
    await user.click(screen.getByRole("button", { name: "History" }));
    expect(screen.getByText("Unable to load character history.")).toBeInTheDocument();
  });

  it("shows an empty state", async () => {
    const user = userEvent.setup();
    renderRow();
    await user.click(screen.getByRole("button", { name: "History" }));
    expect(screen.getByText("No history yet.")).toBeInTheDocument();
  });

  it("formats every claim-log action and a Firestore Timestamp", async () => {
    const logs: ClaimLogEntry[] = [
      {
        id: "log-1",
        action: "claim",
        actorUid: "uid-1",
        previousOwnerUid: null,
        newOwnerUid: "uid-1",
        timestamp: Timestamp.fromDate(new Date("2026-03-04T12:00:00Z")),
      },
      {
        id: "log-2",
        action: "release",
        actorUid: "uid-1",
        previousOwnerUid: "uid-1",
        newOwnerUid: null,
      },
      {
        id: "log-3",
        action: "force-assign",
        actorUid: "dm-1",
        previousOwnerUid: null,
        newOwnerUid: "uid-2",
      },
      {
        id: "log-4",
        action: "force-release",
        actorUid: "dm-1",
        previousOwnerUid: "uid-2",
        newOwnerUid: null,
      },
    ];
    mockUseClaimLogs.mockReturnValue({ logs, loading: false, error: null });
    const user = userEvent.setup();
    // Unclaimed so the row's own status text doesn't collide with the "Claimed" log entry below.
    renderRow({ userId: null });

    await user.click(screen.getByRole("button", { name: "History" }));

    expect(screen.getByText("Claimed")).toBeInTheDocument();
    expect(screen.getByText("4 Mar 2026", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("Released")).toBeInTheDocument();
    expect(screen.getByText("Force assigned")).toBeInTheDocument();
    expect(screen.getByText("Force released")).toBeInTheDocument();
  });

  it("formats a plain Date timestamp and omits the separator when there's no timestamp at all", async () => {
    const logs: ClaimLogEntry[] = [
      {
        id: "log-1",
        action: "release",
        actorUid: "uid-1",
        previousOwnerUid: "uid-1",
        newOwnerUid: null,
        // A plain Date is the other real shape formatTimestamp handles, alongside Firestore's Timestamp.
        timestamp: new Date("2026-01-02T12:00:00Z") as unknown as ClaimLogEntry["timestamp"],
      },
      {
        id: "log-2",
        action: "force-assign",
        actorUid: "dm-1",
        previousOwnerUid: null,
        newOwnerUid: "uid-2",
      },
    ];
    mockUseClaimLogs.mockReturnValue({ logs, loading: false, error: null });
    const user = userEvent.setup();
    renderRow();

    await user.click(screen.getByRole("button", { name: "History" }));

    expect(screen.getByText("2 Jan 2026", { exact: false })).toBeInTheDocument();
    // log-2 has no timestamp at all, so its line must not render the " · " separator.
    expect(screen.getByText("Force assigned")).toBeInTheDocument();
    expect(screen.queryByText("Force assigned", { exact: false })?.textContent).toBe(
      "Force assigned"
    );
  });

  it("closes the history modal", async () => {
    const user = userEvent.setup();
    renderRow();
    await user.click(screen.getByRole("button", { name: "History" }));
    expect(screen.getByText("No history yet.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByText("No history yet.")).not.toBeInTheDocument();
  });
});
