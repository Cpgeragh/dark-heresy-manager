import type { ReactNode } from "react";
import { SectionHeader } from "../SectionHeader";
import { uiSection } from "../styles/editableStyles";

interface CustomFormSectionProps {
  title: ReactNode;
  children: ReactNode;
  contentClassName?: string;
}

/**
 * Standard titled section used inside custom-item forms.
 *
 * The fragment preserves PickerBody's existing spacing between the heading,
 * section shell, and neighbouring sections without introducing another
 * layout wrapper.
 */
export function CustomFormSection({
  title,
  children,
  contentClassName = "",
}: CustomFormSectionProps) {
  return (
    <>
      <SectionHeader as="h3">{title}</SectionHeader>
      <div className={`${uiSection} space-y-3 ${contentClassName}`.trim()}>
        {children}
      </div>
    </>
  );
}
