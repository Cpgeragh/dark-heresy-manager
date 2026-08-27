// tests/integration/ToastProvider.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { ToastProvider } from "../../src/components/Toast/ToastProvider";
import { useToast } from "../../src/components/Toast/ToastContext";

function Consumer() {
  const toast = useToast();
  return (
    <div>
      <button onClick={() => toast.success("Saved!")}>Success</button>
      <button onClick={() => toast.error("Failed!")}>Error</button>
      <button onClick={() => toast.info("Heads up", 0)}>InfoNoAutoDismiss</button>
      <button onClick={() => toast.warning("Careful", 1000, "copy-me")}>WarningWithCopy</button>
      <ul>
        {toast.toasts.map((t) => (
          <li key={t.id}>
            {t.type}:{t.message}
            <button onClick={() => toast.removeToast(t.id)}>Remove {t.id}</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function renderConsumer() {
  render(
    <ToastProvider>
      <Consumer />
    </ToastProvider>
  );
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("ToastProvider", () => {
  it("adds a toast via each typed helper", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderConsumer();

    await user.click(screen.getByText("Success"));
    expect(screen.getByText("success:Saved!")).toBeInTheDocument();

    await user.click(screen.getByText("Error"));
    expect(screen.getByText("error:Failed!")).toBeInTheDocument();
  });

  it("auto-removes a toast after its duration elapses", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderConsumer();

    await user.click(screen.getByText("Success"));
    expect(screen.getByText("success:Saved!")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000); // DEFAULT_TOAST_DURATION
    });

    expect(screen.queryByText("success:Saved!")).not.toBeInTheDocument();
  });

  it("never auto-removes a toast given a duration of 0", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderConsumer();

    await user.click(screen.getByText("InfoNoAutoDismiss"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });

    expect(screen.getByText("info:Heads up")).toBeInTheDocument();
  });

  it("removes a toast manually before its timer fires, without a stray later removal", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderConsumer();

    await user.click(screen.getByText("WarningWithCopy"));
    const item = screen.getByText(/warning:Careful/);
    const removeButton = item.parentElement!.querySelector("button")!;
    await user.click(removeButton);

    expect(screen.queryByText(/warning:Careful/)).not.toBeInTheDocument();

    // The timer was cleared on manual removal, so advancing past its
    // original duration must not throw or resurrect anything.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(screen.queryByText(/warning:Careful/)).not.toBeInTheDocument();
  });

  it("supports multiple simultaneous toasts", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderConsumer();

    await user.click(screen.getByText("Success"));
    await user.click(screen.getByText("Error"));

    expect(screen.getByText("success:Saved!")).toBeInTheDocument();
    expect(screen.getByText("error:Failed!")).toBeInTheDocument();
  });
});
