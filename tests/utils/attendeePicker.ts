import { screen, within } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";

/** Adds a character through the attendee picker: open the list, choose the name, press Add. */
export async function addAttendee(user: UserEvent, name: string) {
  await user.click(screen.getByRole("button", { name: "Attendees" }));
  const list = within(screen.getByRole("dialog", { name: "Attendees" }));
  await user.click(list.getByRole("button", { name }));
  await user.click(screen.getByRole("button", { name: "Add" }));
}
