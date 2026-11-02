import { fireEvent, screen } from "@testing-library/react";

/** Opens the closed card of a collapsible owned entry so its chips and lines can be read. */
export function openEntryCard() {
  fireEvent.click(screen.getByRole("button", { name: /^Expand .+ details$/ }));
}

/** Opens every closed collapsible entry card on screen, including the second copy a tab draws for the other width. */
export function openAllEntryCards() {
  for (const button of screen.getAllByRole("button", { name: /^Expand .+ details$/ })) {
    fireEvent.click(button);
  }
}
