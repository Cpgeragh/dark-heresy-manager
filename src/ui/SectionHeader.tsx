// src/ui/SectionHeader.tsx
// The standard amber-accented section label. Renders a real <h2> (these sit
// under the page/tab title) and applies the shared uiSectionHeader styling.
//
// For form-field labels that happen to reuse this style, keep a <span> inside
// the <label> instead — those are not document sections.

import type { ReactNode } from "react";
import { uiSectionHeader } from "./editableStyles";

export function SectionHeader({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <h2 className={`${uiSectionHeader} ${className}`.trim()}>{children}</h2>;
}
