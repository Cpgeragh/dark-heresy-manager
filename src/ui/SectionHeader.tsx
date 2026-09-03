// src/ui/SectionHeader.tsx
// The standard red-accented section label. Renders an <h2> by default (these
// usually sit under the page/tab title) and applies the shared uiSectionHeader
// styling. Use as="h3" for a section nested beneath another section heading.
//
// For form-field labels that happen to reuse this style, keep a <span> inside
// the <label> instead — those are not document sections.

import type { ReactNode } from "react";
import { uiSectionHeader } from "./styles/editableStyles";

export function SectionHeader({
  as: Heading = "h2",
  className = "",
  children,
}: {
  as?: "h2" | "h3";
  className?: string;
  children: ReactNode;
}) {
  return <Heading className={`${uiSectionHeader} ${className}`.trim()}>{children}</Heading>;
}
