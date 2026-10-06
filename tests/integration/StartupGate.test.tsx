import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";

const campaignsState = vi.hoisted(() => ({
  loading: false,
  archivedLoading: false,
  error: null as Error | null,
  archivedError: null as Error | null,
}));
const needsRecoveryCodeBackupMock = vi.hoisted(() => vi.fn());

vi.mock("../../src/context/useCampaignsContext", () => ({
  useCampaignsContext: () => campaignsState,
}));
vi.mock("../../src/services/userAccountService", () => ({
  needsRecoveryCodeBackup: (...args: unknown[]) => needsRecoveryCodeBackupMock(...args),
}));

import { StartupGate } from "../../src/components/StartupGate";
import { STARTUP_LOAD_TIMEOUT_MS } from "../../src/constants/ui";
import { useStartupStatus } from "../../src/context/useStartupStatus";

function BackupProbe() {
  const { needsRecoveryBackup } = useStartupStatus();
  return <div>{needsRecoveryBackup ? "Backup needed" : "Backup not needed"}</div>;
}

function renderGate() {
  return render(
    <StartupGate ownUid="user-1" splashLabel="Loading…">
      <div>Main app</div>
      <BackupProbe />
    </StartupGate>
  );
}

function expectLogoScreen() {
  expect(screen.getByText("Dark Heresy")).toBeInTheDocument();
  expect(screen.queryByText("Main app")).not.toBeInTheDocument();
}

function expectErrorModal() {
  expect(screen.getByRole("dialog", { name: "Unable to load your account" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Try Again" })).toBeInTheDocument();
  expect(screen.queryByText("Main app")).not.toBeInTheDocument();
}

beforeEach(() => {
  campaignsState.loading = false;
  campaignsState.archivedLoading = false;
  campaignsState.error = null;
  campaignsState.archivedError = null;
  needsRecoveryCodeBackupMock.mockReset();
  needsRecoveryCodeBackupMock.mockResolvedValue(false);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("StartupGate", () => {
  it("opens the app once the campaign lists, archived list and backup check have all arrived", async () => {
    renderGate();

    expect(await screen.findByText("Main app")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(needsRecoveryCodeBackupMock).toHaveBeenCalledWith("user-1");
  });

  it("keeps the logo screen while the active campaign lists are loading", async () => {
    campaignsState.loading = true;
    renderGate();

    await act(async () => {});
    expectLogoScreen();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps the logo screen while the archived list is loading", async () => {
    campaignsState.archivedLoading = true;
    renderGate();

    await act(async () => {});
    expectLogoScreen();
  });

  it("keeps the logo screen until the backup check has answered", async () => {
    needsRecoveryCodeBackupMock.mockReturnValue(new Promise(() => undefined));
    renderGate();

    await act(async () => {});
    expectLogoScreen();
  });

  it("hands the backup answer to the app so the banner never pops in", async () => {
    needsRecoveryCodeBackupMock.mockResolvedValue(true);
    renderGate();

    expect(await screen.findByText("Backup needed")).toBeInTheDocument();
  });

  it("shows the error modal when an active campaign list fails", async () => {
    campaignsState.error = new Error("permission-denied");
    renderGate();

    await act(async () => {});
    expectErrorModal();
  });

  it("shows the error modal when the archived list fails", async () => {
    campaignsState.archivedError = new Error("permission-denied");
    renderGate();

    await act(async () => {});
    expectErrorModal();
  });

  it("shows the error modal when the backup check fails", async () => {
    needsRecoveryCodeBackupMock.mockRejectedValue(new Error("read failed"));
    renderGate();

    await act(async () => {});
    expectErrorModal();
  });

  it("shows the error modal when startup takes longer than the timeout", async () => {
    vi.useFakeTimers();
    campaignsState.loading = true;
    renderGate();

    await act(async () => {
      vi.advanceTimersByTime(STARTUP_LOAD_TIMEOUT_MS - 1);
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expectErrorModal();
  });

  it("cannot be dismissed with Escape", async () => {
    campaignsState.error = new Error("permission-denied");
    renderGate();
    await act(async () => {});

    const dialog = screen.getByRole("dialog", { name: "Unable to load your account" });
    dialog.dispatchEvent(new Event("cancel", { cancelable: true }));

    expect(screen.getByRole("dialog", { name: "Unable to load your account" })).toBeInTheDocument();
  });

  it("never replaces the app with the error modal after it has opened", async () => {
    const view = renderGate();
    expect(await screen.findByText("Main app")).toBeInTheDocument();

    campaignsState.error = new Error("connection lost");
    campaignsState.loading = true;
    view.rerender(
      <StartupGate ownUid="user-1" splashLabel="Loading…">
        <div>Main app</div>
        <BackupProbe />
      </StartupGate>
    );

    expect(screen.getByText("Main app")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
