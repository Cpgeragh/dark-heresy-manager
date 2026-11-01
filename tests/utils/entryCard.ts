import { fireEvent, screen } from "@testing-library/react";

/** Opens the closed card of a collapsible owned entry so its chips and lines can be read. */
export function openEntryCard() {
  fireEvent.click(screen.getByRole("button", { name: /^Expand .+ details$/ }));
}
