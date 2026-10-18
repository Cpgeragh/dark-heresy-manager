// tests/integration/CloseSessionConfirmModal.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { CloseSessionConfirmModal } from "../../src/pages/CampaignOverview/CloseSessionConfirmModal";

function renderModal(props: Partial<React.ComponentProps<typeof CloseSessionConfirmModal>> = {}) {
  const onYes = vi.fn();
  const onNo = vi.fn();
  render(
    <CloseSessionConfirmModal
      xpAwarded={150}
      attendeeNames={["Cormac", "Libby"]}
      busy={false}
      onYes={onYes}
      onNo={onNo}
      {...props}
    />
  );
  return { onYes, onNo };
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

  it("calls onYes for Yes and onNo for No", async () => {
    const user = userEvent.setup();
    const { onYes, onNo } = renderModal();

    await user.click(screen.getByRole("button", { name: "Yes" }));
    await user.click(screen.getByRole("button", { name: "No" }));

    expect(onYes).toHaveBeenCalledOnce();
    expect(onNo).toHaveBeenCalledOnce();
  });

  it("disables No while the session is closing", () => {
    renderModal({ busy: true });

    expect(screen.getByRole("button", { name: "No" })).toBeDisabled();
  });
});
