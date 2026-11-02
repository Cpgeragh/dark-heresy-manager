import type { ReactNode } from "react";
import { uiTextGMNote } from "../styles/editableStyles";

/** The small note on a picker card for a cost or availability that is assigned when the item is added. */
export function AssignedOnAddNote({ children }: { children: ReactNode }) {
  return <span className={uiTextGMNote}>{children}</span>;
}
