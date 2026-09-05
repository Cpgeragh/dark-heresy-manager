import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { User } from "firebase/auth";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockCompleteOnboarding,
  mockGetRecoveryCode,
  mockGetIdentityRecoveryMode,
  mockLinkDevice,
  mockMarkRecoveryCodeBackedUp,
  mockNeedsRecoveryCodeBackup,
  mockReclaimIdentity,
  mockRotateRecoveryCode,
  mockSaveFirstName,
  mockToastError,
  mockToastSuccess,
} = vi.hoisted(() => ({
  mockCompleteOnboarding: vi.fn(),
  mockGetRecoveryCode: vi.fn(),
  mockGetIdentityRecoveryMode: vi.fn(),
  mockLinkDevice: vi.fn(),
  mockMarkRecoveryCodeBackedUp: vi.fn(),
  mockNeedsRecoveryCodeBackup: vi.fn(),
  mockReclaimIdentity: vi.fn(),
  mockRotateRecoveryCode: vi.fn(),
  mockSaveFirstName: vi.fn(),
  mockToastError: vi.fn(),
  mockToastSuccess: vi.fn(),
}));

vi.mock("../../src/services/identityService", () => ({
  getRecoveryCode: mockGetRecoveryCode,
  getIdentityRecoveryMode: mockGetIdentityRecoveryMode,
  reclaimIdentity: mockReclaimIdentity,
  rotateRecoveryCode: mockRotateRecoveryCode,
}));

vi.mock("../../src/services/profileService", () => ({
  saveFirstName: mockSaveFirstName,
}));

vi.mock("../../src/hooks/useLinkDevice", () => ({
  useLinkDevice: () => ({
    linkDevice: mockLinkDevice,
    loading: false,
    error: null,
  }),
}));

vi.mock("../../src/services/userAccountService", () => ({
  completeOnboarding: mockCompleteOnboarding,
  markRecoveryCodeBackedUp: mockMarkRecoveryCodeBackedUp,
  needsRecoveryCodeBackup: mockNeedsRecoveryCodeBackup,
}));

vi.mock("../../src/components/Toast", () => ({
  useToast: () => ({
    error: mockToastError,
    success: mockToastSuccess,
  }),
}));

import { RecoveryBackupBanner } from "../../src/components/RecoveryBackupBanner";
import Onboarding from "../../src/pages/Onboarding";

const user = { uid: "user-1" } as User;

beforeEach(() => {
  vi.clearAllMocks();
  mockCompleteOnboarding.mockResolvedValue(undefined);
  mockGetRecoveryCode.mockResolvedValue("RECOVERY-CODE");
  mockGetIdentityRecoveryMode.mockResolvedValue("link");
  mockLinkDevice.mockResolvedValue(undefined);
  mockMarkRecoveryCodeBackedUp.mockResolvedValue(undefined);
  mockNeedsRecoveryCodeBackup.mockResolvedValue(false);
  mockReclaimIdentity.mockResolvedValue({ role: "player", profileTransferred: true });
  mockRotateRecoveryCode.mockResolvedValue("NEW-CODE");
  mockSaveFirstName.mockResolvedValue(undefined);
});

function renderCodeStep(onComplete = vi.fn()) {
  render(
    <MemoryRouter initialEntries={["/?step=show-code"]}>
      <Onboarding user={user} effectiveUserId="user-1" firstName={null} onComplete={onComplete} />
    </MemoryRouter>
  );
  return onComplete;
}

function renderLinkStep(
  effectiveUserId = "user-1",
  firstName: string | null = null,
  onComplete = vi.fn()
) {
  const view = render(
    <MemoryRouter initialEntries={["/?step=link"]}>
      <Onboarding
        user={user}
        effectiveUserId={effectiveUserId}
        firstName={firstName}
        onComplete={onComplete}
      />
    </MemoryRouter>
  );
  return { ...view, onComplete };
}

async function confirmSavedCode() {
  await screen.findByText("RECOVERY-CODE");
  fireEvent.click(screen.getByRole("button", { name: "Copy code" }));
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "I've saved my code" }));
}

describe("onboarding error propagation", () => {
  it("does not complete locally when the completion write fails", async () => {
    const error = new Error("write failed");
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockCompleteOnboarding.mockRejectedValue(error);
    const onComplete = renderCodeStep();

    await confirmSavedCode();

    expect(
      await screen.findByText("Couldn't complete onboarding. Please try again.")
    ).toBeVisible();
    expect(onComplete).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith("Failed to complete onboarding:", error);
    consoleError.mockRestore();
  });

  it("completes locally only after the completion write succeeds", async () => {
    const onComplete = renderCodeStep();

    await confirmSavedCode();

    await waitFor(() => expect(onComplete).toHaveBeenCalledOnce());
  });

  it("shows a recoverable message when recovery-code rehydration fails", async () => {
    mockGetRecoveryCode.mockRejectedValue(new Error("read failed"));
    renderCodeStep();

    expect(
      await screen.findByText("Couldn't load your recovery code. Please try again.")
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: "Welcome" })).toBeVisible();
  });
});

describe("new-device linking", () => {
  it("links without reclaiming and waits for the shared profile before completing", async () => {
    const { rerender, onComplete } = renderLinkStep();

    fireEvent.change(screen.getByLabelText("Recovery code"), {
      target: { value: "DH-C0DE-0001" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await screen.findByRole("button", { name: "Link This Device" });
    fireEvent.click(screen.getByRole("button", { name: "Link This Device" }));

    expect(mockLinkDevice).toHaveBeenCalledWith("DH-C0DE-0001");
    expect(await screen.findByRole("button", { name: "Opening account…" })).toBeDisabled();
    expect(onComplete).not.toHaveBeenCalled();

    rerender(
      <MemoryRouter initialEntries={["/?step=link"]}>
        <Onboarding
          user={user}
          effectiveUserId="primary-user"
          firstName="ExistingUser"
          onComplete={onComplete}
        />
      </MemoryRouter>
    );

    await waitFor(() => expect(mockCompleteOnboarding).toHaveBeenCalledWith("user-1"));
    await waitFor(() => expect(onComplete).toHaveBeenCalledOnce());
  });

  it("presents linking as the normal returning-user action", () => {
    render(
      <MemoryRouter>
        <Onboarding user={user} effectiveUserId="user-1" firstName={null} onComplete={vi.fn()} />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("button", { name: "Already have an account? Connect this device" })
    ).toBeVisible();
    expect(screen.queryByRole("button", { name: "Reclaim Identity" })).not.toBeInTheDocument();
  });

  it("shows only reclaim when the server reports no linked devices", async () => {
    mockGetIdentityRecoveryMode.mockResolvedValue("reclaim");
    renderLinkStep();

    fireEvent.change(screen.getByLabelText("Recovery code"), {
      target: { value: "DH-C0DE-0001" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByRole("button", { name: "Reclaim Identity" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Link This Device" })).not.toBeInTheDocument();
  });
});

describe("recovery backup error propagation", () => {
  it("reports a failed backup-status check instead of discarding it", async () => {
    mockNeedsRecoveryCodeBackup.mockRejectedValue(new Error("read failed"));

    render(<RecoveryBackupBanner ownUid="user-1" effectiveUserId="user-1" />);

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith("Couldn't check your recovery backup status.")
    );
  });
});
