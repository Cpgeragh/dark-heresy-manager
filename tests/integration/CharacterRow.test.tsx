// tests/integration/CharacterRow.test.tsx

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { Timestamp } from "firebase/firestore";
import "@testing-library/jest-dom";

const {
  mockUseClaimLogs,
  mockPreflightCharacterDeletion,
  mockDeleteCharacter,
  mockRevealRecoveryCode,
  mockRegisterRecoveryCode,
  mockToastError,
  mockToastSuccess,
} = vi.hoisted(() => ({
  mockUseClaimLogs: vi.fn(() => ({ logs: [], loading: false, error: null })),
  mockPreflightCharacterDeletion: vi.fn(),
  mockDeleteCharacter: vi.fn(),
  mockRevealRecoveryCode: vi.fn(),
  mockRegisterRecoveryCode: vi.fn(),
  mockToastError: vi.fn(),
  mockToastSuccess: vi.fn(),
}));

vi.mock("../../src/hooks/useClaimLogs", () => ({
  useClaimLogs: (...args: unknown[]) => mockUseClaimLogs(...args),
}));

vi.mock("../../src/services/characterService", () => ({
  preflightCharacterDeletion: mockPreflightCharacterDeletion,
  deleteCharacter: mockDeleteCharacter,
  revealRecoveryCode: mockRevealRecoveryCode,
  registerRecoveryCode: mockRegisterRecoveryCode,
}));

vi.mock("../../src/components/Toast", () => ({
  useToast: () => ({ error: mockToastError, success: mockToastSuccess }),
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

async function openManage(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Manage Vex" }));
  return screen.findByRole("dialog", { name: "Manage Vex" });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseClaimLogs.mockReturnValue({ logs: [], loading: false, error: null });
});

describe("CharacterRow display", () => {
  it("shows the character name and claimed status, with the actions behind a Manage button", () => {
    renderRow();
    expect(screen.getByText("Vex")).toBeInTheDocument();
    expect(screen.getByText("Claimed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Manage Vex" })).toBeInTheDocument();
    expect(screen.queryByText(/DH-/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "View History" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete Character" })).not.toBeInTheDocument();
  });

  it("shows Unclaimed when unowned", () => {
    renderRow({ userId: null });
    expect(screen.getByText("Unclaimed")).toBeInTheDocument();
  });

  it("hides the Manage button for non-DM viewers", () => {
    renderRow({ isDM: false });
    expect(screen.queryByRole("button", { name: "Manage Vex" })).not.toBeInTheDocument();
  });

  it("opens a Manage Character window with Recovery Code, History and Delete Character rows", async () => {
    const user = userEvent.setup();
    renderRow();

    const dialog = await openManage(user);

    expect(within(dialog).getByText("Manage Character")).toBeInTheDocument();
    expect(within(dialog).getByText("Recovery Code")).toBeInTheDocument();
    expect(within(dialog).getByText("History")).toBeInTheDocument();
    expect(within(dialog).getByText("Delete Character")).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "Reveal Recovery Code" })
    ).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "View History" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Delete Character" })).toBeInTheDocument();
  });

  it("does not follow the card link when the Manage button is pressed", async () => {
    const user = userEvent.setup();
    renderRow();

    await openManage(user);

    expect(screen.getByTestId("path")).toHaveTextContent("/campaign/campaign-1");
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
  async function revealCode(user: ReturnType<typeof userEvent.setup>) {
    const dialog = await openManage(user);
    await user.click(within(dialog).getByRole("button", { name: "Reveal Recovery Code" }));
    return screen.findByRole("dialog", { name: "Reveal Code" });
  }

  it("fetches the code only after Reveal is pressed and shows it in the Reveal Code window", async () => {
    const user = userEvent.setup();
    let resolveReveal: (code: string) => void;
    mockRevealRecoveryCode.mockReturnValue(
      new Promise((resolve) => {
        resolveReveal = resolve;
      })
    );
    renderRow();
    const manage = await openManage(user);

    expect(mockRevealRecoveryCode).not.toHaveBeenCalled();
    await user.click(within(manage).getByRole("button", { name: "Reveal Recovery Code" }));

    expect(mockRevealRecoveryCode).toHaveBeenCalledWith("campaign-1", "char-1");
    expect(within(manage).getByRole("button", { name: "Reveal Recovery Code" })).toBeDisabled();

    resolveReveal!("DH-AAAA-BBBB");
    const reveal = await screen.findByRole("dialog", { name: "Reveal Code" });
    expect(within(reveal).getByText("DH-AAAA-BBBB")).toBeInTheDocument();
    expect(within(reveal).getByRole("button", { name: "Copy code" })).toBeInTheDocument();
    expect(within(reveal).getByRole("button", { name: "Rotate Code" })).toBeInTheDocument();
    expect(
      within(reveal).getByText(
        "If anyone else may have seen this code, rotate it now to invalidate it."
      )
    ).toBeInTheDocument();
  });

  it("shows an error via toast and opens no window on failure", async () => {
    const user = userEvent.setup();
    mockRevealRecoveryCode.mockRejectedValue(new Error("Network unreachable"));
    renderRow();
    const manage = await openManage(user);

    await user.click(within(manage).getByRole("button", { name: "Reveal Recovery Code" }));

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith("Network unreachable"));
    expect(screen.queryByRole("dialog", { name: "Reveal Code" })).not.toBeInTheDocument();
    expect(within(manage).getByRole("button", { name: "Reveal Recovery Code" })).toBeEnabled();
  });

  it("hides the code again when the window is closed", async () => {
    const user = userEvent.setup();
    mockRevealRecoveryCode.mockResolvedValue("DH-AAAA-BBBB");
    renderRow();
    const reveal = await revealCode(user);

    await user.click(within(reveal).getByRole("button", { name: "Close" }));

    expect(screen.queryByText("DH-AAAA-BBBB")).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Manage Vex" })).toBeInTheDocument();
  });

  it("copies the code to the clipboard", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    mockRevealRecoveryCode.mockResolvedValue("DH-AAAA-BBBB");
    renderRow();
    const reveal = await revealCode(user);

    await user.click(within(reveal).getByRole("button", { name: "Copy code" }));

    expect(writeText).toHaveBeenCalledWith("DH-AAAA-BBBB");
    await waitFor(() => expect(mockToastSuccess).toHaveBeenCalledWith("Recovery code copied."));
  });

  it("rotates the code after a confirmation and shows the new one", async () => {
    const user = userEvent.setup();
    mockRevealRecoveryCode.mockResolvedValue("DH-AAAA-BBBB");
    mockRegisterRecoveryCode.mockResolvedValue("DH-CCCC-DDDD");
    renderRow();
    const reveal = await revealCode(user);

    await user.click(within(reveal).getByRole("button", { name: "Rotate Code" }));
    const confirm = await screen.findByRole("dialog", { name: "Rotate Code" });
    expect(
      within(confirm).getByText(
        "Rotate code? A new one is generated and the old one stops working immediately."
      )
    ).toBeInTheDocument();
    expect(mockRegisterRecoveryCode).not.toHaveBeenCalled();

    await user.click(within(confirm).getByRole("button", { name: "Rotate" }));

    expect(mockRegisterRecoveryCode).toHaveBeenCalledWith("campaign-1", "char-1");
    await waitFor(() => expect(screen.getByText("DH-CCCC-DDDD")).toBeInTheDocument());
    expect(screen.queryByText("DH-AAAA-BBBB")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Rotate Code" })).not.toBeInTheDocument();
  });

  it("keeps the confirmation open and reports the error when rotating fails", async () => {
    const user = userEvent.setup();
    mockRevealRecoveryCode.mockResolvedValue("DH-AAAA-BBBB");
    mockRegisterRecoveryCode.mockRejectedValue(new Error("Rotate failed"));
    renderRow();
    const reveal = await revealCode(user);
    await user.click(within(reveal).getByRole("button", { name: "Rotate Code" }));
    const confirm = await screen.findByRole("dialog", { name: "Rotate Code" });

    await user.click(within(confirm).getByRole("button", { name: "Rotate" }));

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith("Rotate failed"));
    expect(screen.getByRole("dialog", { name: "Rotate Code" })).toBeInTheDocument();
    expect(screen.getByText("DH-AAAA-BBBB")).toBeInTheDocument();
  });
});

async function startDelete(user: ReturnType<typeof userEvent.setup>) {
  const dialog = await openManage(user);
  await user.click(within(dialog).getByRole("button", { name: "Delete Character" }));
  return screen.findByRole("dialog", { name: "Delete Character" });
}

async function typeDelete(user: ReturnType<typeof userEvent.setup>, confirm: HTMLElement) {
  await user.type(within(confirm).getByPlaceholderText("DELETE"), "DELETE");
}

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
    const dialog = await openManage(user);

    await user.click(within(dialog).getByRole("button", { name: "Delete Character" }));

    expect(screen.queryByText("Checking affected documents…")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Delete Character" })).not.toBeInTheDocument();

    resolvePreflight!({ jobId: "job-1", totalCount: 7 });
    const confirm = await screen.findByRole("dialog", { name: "Delete Character" });
    expect(
      within(confirm).getByText(
        "This permanently deletes this character: Vex. This cannot be undone."
      )
    ).toBeInTheDocument();
  });

  it("asks for DELETE to be typed before Delete Permanently is available", async () => {
    const user = userEvent.setup();
    mockPreflightCharacterDeletion.mockResolvedValue({ jobId: "job-1", totalCount: 3 });
    renderRow();

    const confirm = await startDelete(user);
    const button = within(confirm).getByRole("button", { name: "Delete Permanently" });
    expect(
      within(confirm).getByText("Type DELETE to permanently delete this character")
    ).toBeInTheDocument();
    expect(button).toBeDisabled();

    await typeDelete(user, confirm);

    expect(button).toBeEnabled();
  });

  it("shows an error and never enables Delete Permanently when the preflight check fails", async () => {
    const user = userEvent.setup();
    mockPreflightCharacterDeletion.mockRejectedValue(new Error("Network unreachable"));
    renderRow();

    const confirm = await startDelete(user);
    await typeDelete(user, confirm);

    expect(within(confirm).getByText("Network unreachable")).toBeInTheDocument();
    expect(within(confirm).getByRole("button", { name: "Delete Permanently" })).toBeDisabled();
  });

  it("closes the confirmation again when Cancel is pressed", async () => {
    const user = userEvent.setup();
    mockPreflightCharacterDeletion.mockResolvedValue({ jobId: "job-1", totalCount: 4 });
    renderRow();
    const confirm = await startDelete(user);

    await user.click(within(confirm).getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog", { name: "Delete Character" })).not.toBeInTheDocument();
    expect(mockDeleteCharacter).not.toHaveBeenCalled();
  });

  it("drives the delete job and shows a loading confirm button", async () => {
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
    const confirm = await startDelete(user);
    await typeDelete(user, confirm);

    await user.click(within(confirm).getByRole("button", { name: "Delete Permanently" }));

    expect(mockDeleteCharacter).toHaveBeenCalledWith("job-1");
    await waitFor(() =>
      expect(within(confirm).getByRole("button", { name: /Deleting/ })).toBeInTheDocument()
    );

    resolveDelete!();
    await waitFor(() =>
      expect(within(confirm).queryByRole("button", { name: /Deleting/ })).not.toBeInTheDocument()
    );
  });

  it("reports the real error message via toast when the delete job fails", async () => {
    const user = userEvent.setup();
    mockPreflightCharacterDeletion.mockResolvedValue({ jobId: "job-1", totalCount: 3 });
    mockDeleteCharacter.mockRejectedValue(new Error("Chunk failed"));
    renderRow();
    const confirm = await startDelete(user);
    await typeDelete(user, confirm);

    await user.click(within(confirm).getByRole("button", { name: "Delete Permanently" }));

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith("Chunk failed"));
  });
});

describe("CharacterRow after a delete", () => {
  async function confirmDelete(user: ReturnType<typeof userEvent.setup>) {
    const confirm = await startDelete(user);
    await typeDelete(user, confirm);
    await user.click(within(confirm).getByRole("button", { name: "Delete Permanently" }));
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
  async function openHistory(user: ReturnType<typeof userEvent.setup>) {
    const dialog = await openManage(user);
    await user.click(within(dialog).getByRole("button", { name: "View History" }));
  }

  it("only subscribes to claim logs once the DM opens History", async () => {
    const user = userEvent.setup();
    renderRow();

    expect(mockUseClaimLogs).toHaveBeenLastCalledWith("campaign-1", "char-1", false);

    await openHistory(user);

    expect(mockUseClaimLogs).toHaveBeenLastCalledWith("campaign-1", "char-1", true);
  });

  it("keeps the History pop-up closed and shows no loading text while the history loads", async () => {
    mockUseClaimLogs.mockReturnValue({ logs: [], loading: true, error: null });
    const user = userEvent.setup();
    renderRow();
    await openHistory(user);
    expect(screen.queryByRole("dialog", { name: "Character history" })).not.toBeInTheDocument();
    expect(screen.queryByText("Loading history…")).not.toBeInTheDocument();
  });

  it("shows an error state", async () => {
    mockUseClaimLogs.mockReturnValue({ logs: [], loading: false, error: new Error("boom") });
    const user = userEvent.setup();
    renderRow();
    await openHistory(user);
    expect(screen.getByText("Unable to load character history.")).toBeInTheDocument();
  });

  it("shows an empty state", async () => {
    const user = userEvent.setup();
    renderRow();
    await openHistory(user);
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

    await openHistory(user);

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

    await openHistory(user);

    expect(screen.getByText("2 Jan 2026", { exact: false })).toBeInTheDocument();
    // log-2 has no timestamp at all, so its line must not render the " · " separator.
    expect(screen.getByText("Force assigned")).toBeInTheDocument();
    expect(screen.queryByText("Force assigned", { exact: false })?.textContent).toBe(
      "Force assigned"
    );
  });

  it("closes the history modal and returns to the Manage window", async () => {
    const user = userEvent.setup();
    renderRow();
    await openHistory(user);
    const history = screen.getByRole("dialog", { name: "Character history" });
    expect(within(history).getByText("No history yet.")).toBeInTheDocument();

    await user.click(within(history).getByRole("button", { name: "Close" }));

    expect(screen.queryByText("No history yet.")).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Manage Vex" })).toBeInTheDocument();
  });
});
