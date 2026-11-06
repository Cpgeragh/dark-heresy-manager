import { within } from "@testing-library/react";

/** The row button of a picker list whose own text starts with the name, ignoring prerequisite lines that repeat it. */
export function findPickerRow(container: HTMLElement, name: string): HTMLElement | undefined {
  return within(container)
    .queryAllByText(name)
    .map((element) => element.closest("button"))
    .find(
      (button): button is HTMLButtonElement => button?.textContent?.trim().startsWith(name) === true
    );
}

/** The row button of a picker list, or an error that names it. */
export function getPickerRow(container: HTMLElement, name: string): HTMLElement {
  const row = findPickerRow(container, name);
  if (!row) throw new Error(`No picker row starts with "${name}"`);
  return row;
}
