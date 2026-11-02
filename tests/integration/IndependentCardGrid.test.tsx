import { useEffect, useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IndependentCardGrid } from "../../src/ui/layout/IndependentCardGrid";

const originalMatchMedia = window.matchMedia;
afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

function mediaAt(initialWidth: number) {
  let width = initialWidth;
  const subscriptions = new Set<() => void>();
  window.matchMedia = vi.fn(
    (query: string) =>
      ({
        media: query,
        get matches() {
          return width >= (query.includes("1024") ? 1024 : 640);
        },
        addEventListener: (_event: string, listener: () => void) => subscriptions.add(listener),
        removeEventListener: (_event: string, listener: () => void) =>
          subscriptions.delete(listener),
      }) as MediaQueryList
  );
  return (nextWidth: number) =>
    act(() => {
      width = nextWidth;
      subscriptions.forEach((listener) => listener());
    });
}

describe("IndependentCardGrid", () => {
  it.each([
    ["sm", 639],
    ["sm", 640],
    ["lg", 1023],
    ["lg", 1024],
  ] as const)("mounts each card once at the %s boundary (%i px)", (breakpoint, width) => {
    mediaAt(width);
    let activeEffects = 0;
    function Card({ id }: { id: number }) {
      useEffect(() => {
        activeEffects++;
        return () => {
          activeEffects--;
        };
      }, []);
      return <button>Card {id}</button>;
    }
    const { unmount } = render(
      <IndependentCardGrid
        breakpoint={breakpoint}
        items={[1, 2, 3, 4].map((id) => (
          <Card key={id} id={id} />
        ))}
      />
    );
    expect(screen.getAllByRole("button")).toHaveLength(4);
    expect(activeEffects).toBe(4);
    unmount();
    expect(activeEffects).toBe(0);
  });

  it("keeps the same focused draft and expanded card across layout changes", () => {
    const resize = mediaAt(1200);
    function Card() {
      const [value, setValue] = useState("");
      const [expanded, setExpanded] = useState(false);
      return (
        <>
          <button onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>
            Expand
          </button>
          <input aria-label="Draft" value={value} onChange={(e) => setValue(e.target.value)} />
        </>
      );
    }
    const items = [<Card key="draft" />];
    const { rerender } = render(<IndependentCardGrid items={items} />);
    fireEvent.click(screen.getByRole("button", { name: "Expand" }));
    const input = screen.getByLabelText("Draft");
    input.focus();
    fireEvent.change(screen.getByLabelText("Draft"), { target: { value: "Working draft" } });
    rerender(<IndependentCardGrid items={items} />);
    expect(screen.getByLabelText("Draft")).toHaveValue("Working draft");
    resize(1100);
    expect(screen.getByLabelText("Draft")).toHaveValue("Working draft");
    resize(500);
    expect(screen.getByLabelText("Draft")).toBe(input);
    expect(input).toHaveFocus();
    expect(input).toHaveValue("Working draft");
    expect(screen.getByRole("button", { name: "Expand" })).toHaveAttribute("aria-expanded", "true");
    resize(1200);
    expect(screen.getByLabelText("Draft")).toBe(input);
    expect(input).toHaveFocus();
    expect(input).toHaveValue("Working draft");
    expect(screen.getByRole("button", { name: "Expand" })).toHaveAttribute("aria-expanded", "true");
  });

  it("moves only the expanded card's column and reserves the full grid height", () => {
    mediaAt(1200);
    let onResize = (_entries: ResizeObserverEntry[]) => {};
    const disconnect = vi.fn();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: (entries: ResizeObserverEntry[]) => void) {
          onResize = callback;
        }
        observe() {}
        disconnect = disconnect;
      }
    );
    const heights = [100, 50, 40, 60];
    const measured = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect");
    const computed = vi
      .spyOn(window, "getComputedStyle")
      .mockReturnValue({ columnGap: "8px" } as CSSStyleDeclaration);
    try {
      const { container, unmount } = render(
        <IndependentCardGrid
          items={heights.map((_, index) => (
            <div key={index} data-index={index}>
              Card {index}
            </div>
          ))}
        />
      );
      const root = container.firstElementChild as HTMLElement;
      const cards = Array.from(root.children) as HTMLElement[];
      const entry = (index: number) =>
        ({
          target: cards[index],
          borderBoxSize: [{ blockSize: heights[index] }],
        }) as unknown as ResizeObserverEntry;
      act(() => onResize(cards.map((_, index) => entry(index))));
      expect(cards.map((card) => card.style.top)).toEqual(["0px", "0px", "108px", "58px"]);
      expect(root.style.height).toBe("148px");
      heights[0] = 200;
      act(() => onResize([entry(0)]));
      expect(cards.map((card) => card.style.top)).toEqual(["0px", "0px", "208px", "58px"]);
      expect(root.style.height).toBe("248px");
      expect(measured).not.toHaveBeenCalled();
      unmount();
      expect(disconnect).toHaveBeenCalled();
    } finally {
      measured.mockRestore();
      computed.mockRestore();
      vi.unstubAllGlobals();
    }
  });
});
