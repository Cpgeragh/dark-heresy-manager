import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { ToastContainer, ToastProvider } from "../../src/components/Toast";

const linkDeviceMock = vi.fn();
const useLinkDeviceMock = vi.fn();
const getIdentityRecoveryModeMock = vi.fn();
const reclaimIdentityMock = vi.fn();

vi.mock("../../src/hooks/useLinkDevice", () => ({
  useLinkDevice: () => useLinkDeviceMock(),
}));

vi.mock("../../src/services/identityService", () => ({
  getIdentityRecoveryMode: (...args: unknown[]) => getIdentityRecoveryModeMock(...args),
  reclaimIdentity: (...args: unknown[]) => reclaimIdentityMock(...args),
}));

import MissingProfileRecovery from "../../src/pages/MissingProfileRecovery";

function renderPage() {
  return render(
    <ToastProvider>
      <MissingProfileRecovery />
      <ToastContainer />
    </ToastProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useLinkDeviceMock.mockReturnValue({
    linkDevice: linkDeviceMock,
    loading: false,
    error: null,
    reset: vi.fn(),
  });
  getIdentityRecoveryModeMock.mockResolvedValue("link");
  reclaimIdentityMock.mockResolvedValue({ role: "player", profileTransferred: true });
});

describe("MissingProfileRecovery", () => {
  it("checks the code before offering either recovery action", () => {
    const { container } = renderPage();

    expect(screen.getByRole("heading", { name: "Reconnect This Browser" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Link This Browser" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reclaim Identity" })).not.toBeInTheDocument();
    expect(container.querySelector(".animate-spin")).not.toBeInTheDocument();
  });

  it("formats the recovery code and links the browser", async () => {
    const user = userEvent.setup();
    linkDeviceMock.mockResolvedValue(undefined);
    renderPage();

    const input = screen.getByPlaceholderText("DH-XXXX-YYYY");
    await user.type(input, "aaaabbbb");
    expect(input).toHaveValue("DH-AAAA-BBBB");

    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(getIdentityRecoveryModeMock).toHaveBeenCalledWith("DH-AAAA-BBBB");
    expect(await screen.findByText(/A linked device remains connected/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Link This Browser" }));

    expect(linkDeviceMock).toHaveBeenCalledWith("DH-AAAA-BBBB");
    expect(await screen.findByRole("status")).toHaveTextContent("Loading your account…");
    expect(reclaimIdentityMock).not.toHaveBeenCalled();
  });

  it("submits a complete recovery code with Enter", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText("DH-XXXX-YYYY"), "AAAABBBB");
    await user.keyboard("{Enter}");

    expect(getIdentityRecoveryModeMock).toHaveBeenCalledWith("DH-AAAA-BBBB");
    expect(await screen.findByRole("button", { name: "Link This Browser" })).toBeVisible();
  });

  it("offers only reclaim when no linked devices remain", async () => {
    const user = userEvent.setup();
    getIdentityRecoveryModeMock.mockResolvedValue("reclaim");
    renderPage();

    await user.type(screen.getByPlaceholderText("DH-XXXX-YYYY"), "AAAABBBB");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByText(/No linked devices remain/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Link This Browser" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reclaim Identity" }));

    expect(reclaimIdentityMock).toHaveBeenCalledWith("DH-AAAA-BBBB", expect.any(Function));
    expect(linkDeviceMock).not.toHaveBeenCalled();
  });

  it("shows a failed lookup through the global error toast", async () => {
    useLinkDeviceMock.mockReturnValue({
      linkDevice: linkDeviceMock,
      loading: false,
      error: "Recovery code not found.",
    });

    renderPage();

    expect(await screen.findByText("No account found for that recovery code.")).toBeInTheDocument();
  });

  it("does not submit the same link twice while the first call is pending", async () => {
    const user = userEvent.setup();
    let finish: (() => void) | undefined;
    linkDeviceMock.mockReturnValue(
      new Promise<void>((resolve) => {
        finish = resolve;
      })
    );
    renderPage();

    await user.type(screen.getByPlaceholderText("DH-XXXX-YYYY"), "DH-AAAA-BBBB");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    const button = screen.getByRole("button", { name: "Link This Browser" });
    await user.click(button);
    await user.click(button);

    expect(linkDeviceMock).toHaveBeenCalledOnce();
    finish?.();
    await waitFor(() => expect(screen.getByRole("status")).toBeInTheDocument());
  });
});
