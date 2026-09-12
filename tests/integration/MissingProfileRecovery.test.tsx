import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { ToastContainer, ToastProvider } from "../../src/components/Toast";

const linkDevice = vi.fn();
vi.mock("../../src/hooks/useLinkDevice", () => ({
  useLinkDevice: () => ({ linkDevice, loading: false, error: null, reset: vi.fn() }),
}));
import MissingProfileRecovery from "../../src/pages/MissingProfileRecovery";

beforeEach(() => {
  vi.clearAllMocks();
  linkDevice.mockResolvedValue(undefined);
});

function renderPage() {
  return render(
    <ToastProvider>
      <MissingProfileRecovery />
      <ToastContainer />
    </ToastProvider>
  );
}

describe("MissingProfileRecovery", () => {
  it("connects immediately when a valid recovery code is submitted", async () => {
    const user = userEvent.setup();
    renderPage();
    const input = screen.getByPlaceholderText("DH-XXXX-YYYY");
    await user.type(input, "aaaabbbb");
    expect(input).toHaveValue("DH-AAAA-BBBB");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(linkDevice).toHaveBeenCalledWith("DH-AAAA-BBBB");
    expect(await screen.findByRole("status")).toHaveTextContent("Loading your account…");
  });

  it("submits with Enter and prevents duplicate in-flight requests", async () => {
    const user = userEvent.setup();
    let finish!: () => void;
    linkDevice.mockReturnValue(
      new Promise<void>((resolve) => {
        finish = resolve;
      })
    );
    renderPage();
    await user.type(screen.getByPlaceholderText("DH-XXXX-YYYY"), "AAAABBBB");
    await user.keyboard("{Enter}{Enter}");
    expect(linkDevice).toHaveBeenCalledOnce();
    finish();
  });
});
