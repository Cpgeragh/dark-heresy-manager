import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { User } from "firebase/auth";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockCompleteOnboarding,
  mockCreateAccount,
  mockDiscardOnboardingSetup,
  mockGetRecoveryCode,
  mockLinkDevice,
  mockMarkRecoveryCodeBackedUp,
  mockNeedsRecoveryCodeBackup,
  mockRotateRecoveryCode,
  mockSaveFirstName,
  mockToastError,
  mockToastApi,
} = vi.hoisted(() => {
  const mockToastError = vi.fn();
  const mockToastSuccess = vi.fn();
  const mockToastWarning = vi.fn();
  return {
    mockCompleteOnboarding: vi.fn(),
    mockCreateAccount: vi.fn(),
    mockDiscardOnboardingSetup: vi.fn(),
    mockGetRecoveryCode: vi.fn(),
    mockLinkDevice: vi.fn(),
    mockMarkRecoveryCodeBackedUp: vi.fn(),
    mockNeedsRecoveryCodeBackup: vi.fn(),
    mockRotateRecoveryCode: vi.fn(),
    mockSaveFirstName: vi.fn(),
    mockToastError,
    mockToastSuccess,
    mockToastWarning,
    mockToastApi: {
      error: mockToastError,
      success: mockToastSuccess,
      warning: mockToastWarning,
    },
  };
});

vi.mock("../../src/services/identityService", () => ({
  createAccount: mockCreateAccount,
  getRecoveryCode: mockGetRecoveryCode,
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
    reset: vi.fn(),
  }),
}));

vi.mock("../../src/services/userAccountService", () => ({
  completeOnboarding: mockCompleteOnboarding,
  discardOnboardingSetup: mockDiscardOnboardingSetup,
  markRecoveryCodeBackedUp: mockMarkRecoveryCodeBackedUp,
  needsRecoveryCodeBackup: mockNeedsRecoveryCodeBackup,
}));

vi.mock("../../src/components/Toast", () => ({
  useToast: () => mockToastApi,
}));

import { RecoveryBackupBanner } from "../../src/components/RecoveryBackupBanner";
import Onboarding from "../../src/pages/Onboarding";

const user = { uid: "user-1" } as User;

beforeEach(() => {
  vi.clearAllMocks();
  mockCompleteOnboarding.mockResolvedValue(undefined);
  mockCreateAccount.mockResolvedValue({ accountId: "account-new", code: "NEW-CODE" });
  mockDiscardOnboardingSetup.mockResolvedValue(undefined);
  mockGetRecoveryCode.mockResolvedValue("RECOVERY-CODE");
  mockLinkDevice.mockResolvedValue(undefined);
  mockMarkRecoveryCodeBackedUp.mockResolvedValue(undefined);
  mockNeedsRecoveryCodeBackup.mockResolvedValue(false);
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
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Continue to dashboard" }));
}

function BrowserBackControl() {
  const navigate = useNavigate();
  return <button onClick={() => navigate(-1)}>Browser back</button>;
}

describe("onboarding error propagation", () => {
  it("creates an account when the first-name form is submitted with Enter", async () => {
    const browserUser = userEvent.setup();
    render(
      <MemoryRouter>
        <Onboarding user={user} effectiveUserId="user-1" firstName={null} onComplete={vi.fn()} />
      </MemoryRouter>
    );

    await browserUser.type(screen.getByLabelText("First Name"), "david");
    await browserUser.type(screen.getByPlaceholderText("e.g. My phone"), "My laptop{Enter}");

    await waitFor(() => expect(mockSaveFirstName).toHaveBeenCalledWith("account-new", "David"));
    expect(mockCreateAccount).toHaveBeenCalledOnce();
    expect(mockCreateAccount).toHaveBeenCalledWith("My laptop");
  });

  it("lets the server resume the same unfinished account instead of creating another", async () => {
    mockCreateAccount.mockResolvedValueOnce({
      accountId: "account-existing",
      code: "RECOVERY-CODE",
    });
    const browserUser = userEvent.setup();
    render(
      <MemoryRouter>
        <Onboarding user={user} effectiveUserId="user-1" firstName={null} onComplete={vi.fn()} />
      </MemoryRouter>
    );

    await browserUser.type(screen.getByLabelText("First Name"), "david");
    await browserUser.type(screen.getByPlaceholderText("e.g. My phone"), "My laptop{Enter}");

    expect(await screen.findByText("RECOVERY-CODE")).toBeVisible();
    expect(mockCreateAccount).toHaveBeenCalledOnce();
    expect(mockSaveFirstName).toHaveBeenCalledWith("account-existing", "David");
    expect(mockRotateRecoveryCode).not.toHaveBeenCalled();
  });

  it("allows a manually saved code to be confirmed without clipboard access", async () => {
    renderCodeStep();

    await screen.findByText("RECOVERY-CODE");
    expect(screen.getByRole("checkbox")).toBeEnabled();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Continue to dashboard" }));

    await waitFor(() => expect(mockCompleteOnboarding).toHaveBeenCalledWith());
  });

  it("marks the recovery code as copied only after the clipboard write succeeds", async () => {
    const browserUser = userEvent.setup();
    const clipboardWrite = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
    renderCodeStep();

    await browserUser.click(await screen.findByRole("button", { name: "Copy recovery code" }));

    expect(clipboardWrite).toHaveBeenCalledWith("RECOVERY-CODE");
    expect(screen.getByRole("button", { name: "Copied" })).toBeDisabled();
  });

  it("keeps manual confirmation available when clipboard copying fails", async () => {
    const error = new Error("clipboard blocked");
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const browserUser = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(error);
    renderCodeStep();

    await browserUser.click(await screen.findByRole("button", { name: "Copy recovery code" }));

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        "Couldn't copy the recovery code. Select it and copy it manually."
      )
    );
    expect(screen.getByRole("button", { name: "Copy recovery code" })).toBeEnabled();
    expect(screen.getByRole("checkbox")).toBeEnabled();
    consoleError.mockRestore();
  });

  it("keeps the page visible while a recovery code is rehydrated", async () => {
    let resolveCode!: (value: string) => void;
    mockGetRecoveryCode.mockReturnValueOnce(
      new Promise<string>((resolve) => {
        resolveCode = resolve;
      })
    );
    renderCodeStep();

    expect(screen.getByRole("heading", { name: "Save Your Recovery Code" })).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("Loading recovery code…");

    resolveCode("RECOVERY-CODE");
    expect(await screen.findByText("RECOVERY-CODE")).toBeVisible();
    expect(screen.getByRole("button", { name: "Back" })).toBeEnabled();
  });

  it("keeps Back available after copying and confirming a restored code", async () => {
    const browserUser = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
    renderCodeStep();

    await browserUser.click(await screen.findByRole("button", { name: "Copy recovery code" }));
    await browserUser.click(screen.getByRole("checkbox"));

    expect(screen.getByRole("button", { name: "Back" })).toBeEnabled();
    await browserUser.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("dialog", { name: "Cancel New Account Setup" })).toBeVisible();
  });

  it("confirms and safely discards setup when the page Back button is used", async () => {
    const browserUser = userEvent.setup();
    renderCodeStep();
    await screen.findByText("RECOVERY-CODE");

    await browserUser.click(screen.getByRole("button", { name: "Back" }));

    const dialog = screen.getByRole("dialog", { name: "Cancel New Account Setup" });
    expect(dialog).toHaveTextContent(
      "Cancel new account setup? This recovery code will no longer work."
    );
    expect(screen.getByRole("button", { name: "Keep setting up" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Cancel account setup" })).toBeVisible();

    await browserUser.click(screen.getByRole("button", { name: "Cancel account setup" }));

    await waitFor(() => expect(mockDiscardOnboardingSetup).toHaveBeenCalledOnce());
    expect(await screen.findByRole("heading", { name: "Create Your Account" })).toBeVisible();
  });

  it("keeps Back enabled after cancelling setup and creating an account again", async () => {
    const browserUser = userEvent.setup();
    renderCodeStep();
    await screen.findByText("RECOVERY-CODE");

    await browserUser.click(screen.getByRole("button", { name: "Back" }));
    await browserUser.click(screen.getByRole("button", { name: "Cancel account setup" }));
    await screen.findByRole("heading", { name: "Create Your Account" });

    await browserUser.type(screen.getByLabelText("First Name"), "david");
    await browserUser.type(screen.getByPlaceholderText("e.g. My phone"), "My laptop");
    await browserUser.click(screen.getByRole("button", { name: "Create new account" }));

    expect(await screen.findByText("NEW-CODE")).toBeVisible();
    expect(screen.getByRole("button", { name: "Back" })).toBeEnabled();
  });

  it("uses the same confirmation when browser Back leaves the code step", async () => {
    const browserUser = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/", "/?step=show-code"]} initialIndex={1}>
        <BrowserBackControl />
        <Onboarding user={user} effectiveUserId="user-1" firstName={null} onComplete={vi.fn()} />
      </MemoryRouter>
    );
    await screen.findByText("RECOVERY-CODE");

    await browserUser.click(screen.getByRole("button", { name: "Browser back" }));

    expect(await screen.findByRole("dialog", { name: "Cancel New Account Setup" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Save Your Recovery Code" })).toBeVisible();
  });

  it("stays on the code page when cancelling setup fails", async () => {
    const error = new Error("cleanup failed");
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockDiscardOnboardingSetup.mockRejectedValue(error);
    const browserUser = userEvent.setup();
    renderCodeStep();
    await screen.findByText("RECOVERY-CODE");

    await browserUser.click(screen.getByRole("button", { name: "Back" }));
    await browserUser.click(screen.getByRole("button", { name: "Cancel account setup" }));

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        "Couldn't cancel account setup. Please try again."
      )
    );
    expect(screen.getByRole("dialog", { name: "Cancel New Account Setup" })).toBeVisible();
    expect(screen.getByText("RECOVERY-CODE")).toBeVisible();
    consoleError.mockRestore();
  });

  it("does not allow browser Back to abandon setup while completion is pending", async () => {
    let resolveCompletion!: () => void;
    mockCompleteOnboarding.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveCompletion = resolve;
      })
    );
    const browserUser = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/", "/?step=show-code"]} initialIndex={1}>
        <BrowserBackControl />
        <Onboarding user={user} effectiveUserId="user-1" firstName={null} onComplete={vi.fn()} />
      </MemoryRouter>
    );
    await screen.findByText("RECOVERY-CODE");
    await browserUser.click(screen.getByRole("checkbox"));
    await browserUser.click(screen.getByRole("button", { name: "Continue to dashboard" }));

    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
    await browserUser.click(screen.getByRole("button", { name: "Browser back" }));
    expect(
      screen.queryByRole("dialog", { name: "Cancel New Account Setup" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Save Your Recovery Code" })).toBeVisible();

    resolveCompletion();
  });

  it("does not complete locally when the completion write fails", async () => {
    const error = new Error("write failed");
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockCompleteOnboarding.mockRejectedValue(error);
    const onComplete = renderCodeStep();

    await confirmSavedCode();

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith("Couldn't complete onboarding. Please try again.")
    );
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

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        "Couldn't load your recovery code. Please try again."
      )
    );
    expect(await screen.findByRole("heading", { name: "Create Your Account" })).toBeVisible();
  });
});

describe("new-device linking", () => {
  it("links without reclaiming and waits for the shared profile before completing", async () => {
    const { rerender, onComplete } = renderLinkStep();

    fireEvent.change(screen.getByLabelText("Recovery code"), {
      target: { value: "DH-C0DE-0001" },
    });
    fireEvent.change(screen.getByPlaceholderText("e.g. My phone"), {
      target: { value: "My laptop" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Find account" }));

    expect(mockLinkDevice).toHaveBeenCalledWith("DH-C0DE-0001", "My laptop");
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

    await waitFor(() => expect(mockCompleteOnboarding).toHaveBeenCalledWith());
    await waitFor(() => expect(onComplete).toHaveBeenCalledOnce());
  });

  it("presents linking as the normal returning-user action", () => {
    render(
      <MemoryRouter>
        <Onboarding user={user} effectiveUserId="user-1" firstName={null} onComplete={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: "Connect existing account" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Reclaim Identity" })).not.toBeInTheDocument();
  });

  it("clears any partial new-account data before opening account connection", async () => {
    const browserUser = userEvent.setup();
    render(
      <MemoryRouter>
        <Onboarding user={user} effectiveUserId="user-1" firstName={null} onComplete={vi.fn()} />
      </MemoryRouter>
    );

    await browserUser.click(screen.getByRole("button", { name: "Connect existing account" }));

    await waitFor(() => expect(mockDiscardOnboardingSetup).toHaveBeenCalledOnce());
    expect(await screen.findByRole("heading", { name: "Connect Existing Account" })).toBeVisible();
  });

  it("uses one direct connection action without a reclaim branch", async () => {
    renderLinkStep();

    fireEvent.change(screen.getByLabelText("Recovery code"), {
      target: { value: "DH-C0DE-0001" },
    });
    fireEvent.change(screen.getByPlaceholderText("e.g. My phone"), {
      target: { value: "My laptop" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Find account" }));

    expect(mockLinkDevice).toHaveBeenCalledWith("DH-C0DE-0001", "My laptop");
    expect(screen.queryByRole("button", { name: "Reclaim Identity" })).not.toBeInTheDocument();
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
