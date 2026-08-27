// tests/integration/ErrorBoundary.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import "@testing-library/jest-dom";
import { ErrorBoundary } from "../../src/components/ErrorBoundary";

function MaybeThrows({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error("Boom");
  return <div>Recovered content</div>;
}

// Real recovery means the underlying cause is fixed first, then Try Again
// re-attempts rendering — not that the throw magically stops on retry. A
// prop-driven condition (rather than a mutable counter inside the throwing
// component) also sidesteps React 19's automatic single retry after a
// render-time error, which would otherwise silently consume a "throw once"
// counter before the fallback UI (or the test) ever observes it.
function RecoverableTree() {
  const [shouldThrow, setShouldThrow] = useState(true);
  return (
    <div>
      <button onClick={() => setShouldThrow(false)}>Fix the underlying issue</button>
      <ErrorBoundary>
        <MaybeThrows shouldThrow={shouldThrow} />
      </ErrorBoundary>
    </div>
  );
}

function AlwaysThrows(): never {
  throw new Error("Always boom");
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("ErrorBoundary", () => {
  it("renders children when nothing throws", () => {
    render(
      <ErrorBoundary>
        <div>Safe content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText("Safe content")).toBeInTheDocument();
  });

  it("renders the default fallback UI when a child throws", () => {
    render(
      <ErrorBoundary>
        <AlwaysThrows />
      </ErrorBoundary>
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try Again" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go to Home" })).toBeInTheDocument();
  });

  it("renders a custom fallback instead of the default when provided", () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <AlwaysThrows />
      </ErrorBoundary>
    );
    expect(screen.getByText("Custom fallback")).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });

  it("recovers and renders children again after Try Again, once they no longer throw", async () => {
    const user = userEvent.setup();
    render(<RecoverableTree />);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    // Fix the underlying cause first — the boundary still shows the fallback
    // until it's explicitly reset, same as real usage (Try Again is meant to
    // be clicked after whatever caused the error is actually resolved).
    await user.click(screen.getByRole("button", { name: "Fix the underlying issue" }));
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Try Again" }));

    expect(screen.getByText("Recovered content")).toBeInTheDocument();
  });
});
