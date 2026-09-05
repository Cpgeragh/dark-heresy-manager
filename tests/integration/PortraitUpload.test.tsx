// tests/integration/PortraitUpload.test.tsx
//
// Scoped to what jsdom can reliably verify: rendering, the canEdit gate, file
// validation, and opening/closing the crop modal. The actual crop-to-blob-to-
// upload pipeline (canvas 2D context, decoded <img> dimensions) needs real
// browser APIs jsdom doesn't implement and isn't polyfilled in this project —
// that pixel pipeline is better verified by hand than faked through mocks here.
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

vi.mock("react-easy-crop", () => ({
  default: () => <div>Mock Cropper</div>,
}));

const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();
vi.mock("../../src/components/Toast", () => ({
  useToast: () => ({ error: mockToastError, success: mockToastSuccess }),
}));

import { PortraitUpload } from "../../src/components/PortraitUpload";

function renderUpload(props: Partial<React.ComponentProps<typeof PortraitUpload>> = {}) {
  render(<PortraitUpload campaignId="campaign-1" characterId="char-1" canEdit={true} {...props} />);
}

describe("PortraitUpload", () => {
  it("shows a placeholder icon when there is no portrait", () => {
    renderUpload();
    expect(screen.queryByAltText("Portrait")).not.toBeInTheDocument();
  });

  it("shows the portrait image when a URL is set", () => {
    renderUpload({ currentPortraitUrl: "https://example.com/portrait.jpg" });
    expect(screen.getByAltText("Portrait")).toHaveAttribute(
      "src",
      "https://example.com/portrait.jpg"
    );
  });

  it("hides the upload trigger when not editable", () => {
    renderUpload({ canEdit: false });
    expect(screen.queryByRole("button", { name: "Upload portrait" })).not.toBeInTheDocument();
  });

  it("shows the upload trigger when editable", () => {
    renderUpload({ canEdit: true });
    expect(screen.getByRole("button", { name: "Upload portrait" })).toBeInTheDocument();
  });

  it("rejects an invalid file type with a toast and never opens the crop modal", () => {
    renderUpload();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const badFile = new File(["not an image"], "notes.txt", { type: "text/plain" });
    // userEvent.upload enforces the input's `accept` filter and silently
    // refuses a mismatched file before any change event fires — fireEvent
    // bypasses that so the component's own validation is what gets exercised.
    fireEvent.change(input, { target: { files: [badFile] } });

    expect(mockToastError).toHaveBeenCalledWith("Portrait must be a JPEG, PNG, or WebP image.");
    expect(screen.queryByText("Mock Cropper")).not.toBeInTheDocument();
  });

  it("opens the Position Portrait modal for a valid image file", async () => {
    renderUpload();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const goodFile = new File(["fake-image-bytes"], "portrait.png", { type: "image/png" });

    await userEvent.upload(input, goodFile);

    await waitFor(() =>
      expect(screen.getByRole("dialog", { name: "Position Portrait" })).toBeInTheDocument()
    );
    expect(screen.getByText("Mock Cropper")).toBeInTheDocument();
  });

  it("closes the crop modal on Cancel without uploading", async () => {
    const user = userEvent.setup();
    renderUpload();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const goodFile = new File(["fake-image-bytes"], "portrait.png", { type: "image/png" });

    await userEvent.upload(input, goodFile);
    await screen.findByRole("dialog", { name: "Position Portrait" });
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog", { name: "Position Portrait" })).not.toBeInTheDocument();
  });
});
