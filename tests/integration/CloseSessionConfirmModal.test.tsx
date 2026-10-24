// tests/integration/CloseSessionConfirmModal.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { CloseSessionConfirmModal } from "../../src/pages/CampaignOverview/CloseSessionConfirmModal";

function renderModal(props: Partial<React.ComponentProps<typeof CloseSessionConfirmModal>> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <CloseSessionConfirmModal
      xpAwarded={150}
      attendeeNames={["Cormac", "Libby"]}
      busy={false}
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...props}
    />
  );
  return { onConfirm, onCancel };
}

describe("CloseSessionConfirmModal", () => {
  it("asks whether the XP given to the named attendees is correct", () => {
    renderModal();

    expect(
      screen.getByText("Give 150 XP to Cormac and Libby. Is that correct?")
    ).toBeInTheDocument();
  });

  it("sorts the names alphabetically", () => {
    renderModal({ attendeeNames: ["Libby", "Cormac"] });

    expect(screen.getByText(/Cormac and Libby/)).toBeInTheDocument();
  });

  it("joins three or more names with commas and an and", () => {
    renderModal({ attendeeNames: ["Cormac", "Libby", "Vex"] });

    expect(screen.getByText(/Cormac, Libby and Vex/)).toBeInTheDocument();
  });

  it("says no XP will be given for 0 XP or no attendees", () => {
    renderModal({ xpAwarded: 0 });

    expect(screen.getByText("No XP will be given. Close the session?")).toBeInTheDocument();
  });

  it("calls the action-specific confirmation and cancellation handlers", async () => {
    const user = userEvent.setup();
    const { onConfirm, onCancel } = renderModal();

    await user.click(screen.getByRole("button", { name: "Close Session" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("disables cancellation while the session is closing", () => {
    renderModal({ busy: true });

    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });
});
