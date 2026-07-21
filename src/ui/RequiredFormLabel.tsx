import type { ReactNode } from "react";
import { uiFormLabel } from "./editableStyles";

interface SharedRequiredFormLabelProps {
  children: ReactNode;
  className?: string;
  supportingText?: ReactNode;
}

type RequiredFormLabelProps = SharedRequiredFormLabelProps &
  (
    | {
        as?: "label";
        htmlFor: string;
      }
    | {
        as: "legend";
        htmlFor?: never;
      }
  );

function RequiredLabelContent({
  children,
  supportingText,
}: Pick<SharedRequiredFormLabelProps, "children" | "supportingText">) {
  return (
    <>
      {children} <span className="text-red-500" aria-hidden="true">*</span>
      {supportingText && (
        <span className="ml-1 normal-case tracking-normal text-slate-500">
          {supportingText}
        </span>
      )}
    </>
  );
}

/**
 * Label for required controls in custom-item forms.
 *
 * Use the default label with htmlFor for one control. Use as="legend" when
 * naming a group of controls inside a fieldset. The control itself must also
 * use the native required attribute or aria-required as appropriate.
 */
export function RequiredFormLabel(props: RequiredFormLabelProps) {
  const className = `${uiFormLabel} ${props.className ?? ""}`.trim();
  const content = (
    <RequiredLabelContent supportingText={props.supportingText}>
      {props.children}
    </RequiredLabelContent>
  );

  if (props.as === "legend") {
    return <legend className={className}>{content}</legend>;
  }

  return (
    <label htmlFor={props.htmlFor} className={className}>
      {content}
    </label>
  );
}
