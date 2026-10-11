import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DrawerBackdrop } from "../../src/ui/DrawerBackdrop";
import { colourDrawerBackdrop } from "../../src/ui/styles/colourTokens";
import { uiLayerBackdrop } from "../../src/ui/styles/layerStyles";

describe("DrawerBackdrop", () => {
  it("shows the shared dimmed, blurred backdrop and closes from it", () => {
    const onClose = vi.fn();
    const { container } = render(<DrawerBackdrop isOpen onClose={onClose} />);
    const backdrop = container.firstElementChild;

    expect(backdrop).toHaveAttribute("aria-hidden", "true");
    expect(backdrop).toHaveClass(
      uiLayerBackdrop,
      colourDrawerBackdrop,
      "backdrop-blur-sm",
      "transition-opacity",
      "duration-300",
      "pointer-events-auto",
      "opacity-100"
    );

    fireEvent.click(backdrop as Element);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("stays mounted but cannot be pressed while closed", () => {
    const { container } = render(<DrawerBackdrop isOpen={false} onClose={vi.fn()} />);

    expect(container.firstElementChild).toHaveClass("pointer-events-none", "opacity-0");
  });
});
