// tests/integration/useHasBeenVisible.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useHasBeenVisible } from "../../src/hooks/useHasBeenVisible";

function Probe({ root, rootMargin }: { root?: Element | null; rootMargin?: string }) {
  const { ref, visible } = useHasBeenVisible<HTMLDivElement>({ root, rootMargin });
  return <div ref={ref}>{visible ? "visible" : "hidden"}</div>;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubObserver() {
  const observe = vi.fn();
  const disconnect = vi.fn();
  let callback: IntersectionObserverCallback = () => undefined;
  let options: IntersectionObserverInit | undefined;

  class FakeObserver {
    constructor(next: IntersectionObserverCallback, init?: IntersectionObserverInit) {
      callback = next;
      options = init;
    }
    observe = observe;
    disconnect = disconnect;
  }

  vi.stubGlobal("IntersectionObserver", FakeObserver);
  return {
    observe,
    disconnect,
    options: () => options,
    report: (isIntersecting: boolean) =>
      act(() =>
        callback([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver)
      ),
  };
}

describe("useHasBeenVisible", () => {
  it("reports visible straight away when the browser has no visibility watcher", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    render(<Probe />);

    expect(screen.getByText("visible")).toBeInTheDocument();
  });

  it("starts hidden and watches the element", () => {
    const observer = stubObserver();
    render(<Probe />);

    expect(screen.getByText("hidden")).toBeInTheDocument();
    expect(observer.observe).toHaveBeenCalledOnce();
  });

  it("watches the page by default", () => {
    const observer = stubObserver();
    render(<Probe />);

    expect(observer.options()).toMatchObject({ root: null });
  });

  it("watches inside the given scroll area with the given margin", () => {
    const scrollArea = document.createElement("div");
    const observer = stubObserver();
    render(<Probe root={scrollArea} rootMargin="0px 0px 150px 0px" />);

    expect(observer.options()).toMatchObject({
      root: scrollArea,
      rootMargin: "0px 0px 150px 0px",
    });
  });

  it("stays hidden while the element is off screen", () => {
    const observer = stubObserver();
    render(<Probe />);

    observer.report(false);

    expect(screen.getByText("hidden")).toBeInTheDocument();
  });

  it("becomes visible when the element appears and stops watching", () => {
    const observer = stubObserver();
    render(<Probe />);

    observer.report(true);

    expect(screen.getByText("visible")).toBeInTheDocument();
    expect(observer.disconnect).toHaveBeenCalled();
  });

  it("stops watching when it unmounts", () => {
    const observer = stubObserver();
    const { unmount } = render(<Probe />);

    unmount();

    expect(observer.disconnect).toHaveBeenCalled();
  });
});
