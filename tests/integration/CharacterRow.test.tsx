// tests/integration/CharacterRow.test.tsx

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Timestamp } from "firebase/firestore";
import "@testing-library/jest-dom";

const { mockUseClaimLogs, mockPreflightCharacterDeletion, mockDeleteCharacter, mockToastError } =
  vi.hoisted(() => ({
    mockUseClaimLogs: vi.fn(() => ({ logs: [], loading: false, error: null })),
    mockPreflightCharacterDeletion: vi.fn(),
    mockDeleteCharacter: vi.fn(),
    mockToastError: vi.fn(),
  }));

vi.mock("../../src/hooks/useClaimLogs", () => ({
  useClaimLogs: (...args: unknown[]) => mockUseClaimLogs(...args),
}));

vi.mock("../../src/services/characterService", () => ({
  preflightCharacterDeletion: mockPreflightCharacterDeletion,
  deleteCharacter: mockDeleteCharacter,
}));

vi.mock("../../src/components/Toast", () => ({
  useToast: () => ({ error: mockToastError, success: vi.fn() }),
}));

import { CharacterRow } from "../../src/pages/CampaignOverview/CharacterRow";
import type { ClaimLogEntry } from "../../src/utils/claimLog";

function renderRow(overrides: Partial<React.ComponentProps<typeof CharacterRow>> = {}) {
  render(
    <MemoryRouter>
      <CharacterRow
        campaignId="campaign-1"
        characterId="char-1"
        characterName="Vex"
        userId="uid-1"
        recoveryCode="DH-AAAA-BBBB"
        isDM={true}
        {...overrides}
      />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseClaimLogs.mockReturnValue({ logs: [], loading: false, error: null });
});

describe("CharacterRow display", () => {
  it("shows the character name, recovery code, and claimed status", () => {
    renderRow();
    expect(screen.getByText("Vex")).toBeInTheDocument();
    expect(screen.getByText("Recovery: DH-AAAA-BBBB")).toBeInTheDocument();
    expect(screen.getByText("Claimed")).toBeInTheDocument();
  });

  it("shows Unclaimed and a dash for recovery code when unowned", () => {
    renderRow({ userId: null, recoveryCode: undefined });
    expect(screen.getByText("Unclaimed")).toBeInTheDocument();
    expect(screen.getByText("Recovery: —")).toBeInTheDocument();
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

describe("CharacterRow delete flow", () => {
  it("checks affected documents on arm and disables confirm while loading", async () => {
    const user = userEvent.setup();
    let resolvePreflight: (value: { jobId: string; totalCount: number }) => void;
    mockPreflightCharacterDeletion.mockReturnValue(
      new Promise((resolve) => {
        resolvePreflight = resolve;
      })
    );
    renderRow();

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(screen.getByText("Checking affected documents…")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Yes" })).toBeDisabled();

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

  it("drives the delete job and shows live chunk progress on the confirm button", async () => {
    const user = userEvent.setup();
    mockPreflightCharacterDeletion.mockResolvedValue({ jobId: "job-1", totalCount: 10 });
    let resolveDelete: () => void;
    mockDeleteCharacter.mockImplementation(
      (_jobId: string, onProgress?: (p: { processedCount: number; totalCount: number }) => void) =>
        new Promise<void>((resolve) => {
          onProgress?.({ processedCount: 4, totalCount: 10 });
          resolveDelete = resolve;
        })
    );
    renderRow();

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Yes" })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: "Yes" }));

    expect(mockDeleteCharacter).toHaveBeenCalledWith("job-1", expect.any(Function));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Deleting… (4/10)" })).toBeInTheDocument()
    );

    resolveDelete!();
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: /Deleting…/ })).not.toBeInTheDocument()
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

describe("CharacterRow history modal", () => {
  it("only subscribes to claim logs once the DM opens History", async () => {
    const user = userEvent.setup();
    renderRow();

    expect(mockUseClaimLogs).toHaveBeenLastCalledWith("campaign-1", "char-1", false);

    await user.click(screen.getByRole("button", { name: "History" }));

    expect(mockUseClaimLogs).toHaveBeenLastCalledWith("campaign-1", "char-1", true);
  });

  it("shows a loading state", async () => {
    mockUseClaimLogs.mockReturnValue({ logs: [], loading: true, error: null });
    const user = userEvent.setup();
    renderRow();
    await user.click(screen.getByRole("button", { name: "History" }));
    expect(screen.getByText("Loading history…")).toBeInTheDocument();
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
