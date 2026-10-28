import type { ReactNode } from "react";
import { uiFormLabel, uiFormLabelHint } from "../styles/editableStyles";
import { RequiredMark } from "./RequiredMark";

interface SharedFormLabelProps {
  children: ReactNode;
  className?: string;
  required?: boolean;
  supportingText?: ReactNode;
}

type FormLabelProps = SharedFormLabelProps &
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

function FormLabelContent({
  children,
  required,
  supportingText,
}: Pick<SharedFormLabelProps, "children" | "required" | "supportingText">) {
  return (
    <>
      {children}
      {required && (
        <>
          {" "}
          <RequiredMark />
        </>
      )}
      {supportingText && <span className={uiFormLabelHint}>{supportingText}</span>}
    </>
  );
}

/**
 * The one label for a form control.
 *
 * Use the default label with htmlFor for one control. Use as="legend" when
 * naming a group of controls inside a fieldset. Set required for a required
 * control, which adds the star after the text and before any hint; the control
 * itself must also use the native required attribute or aria-required.
 */
export function FormLabel(props: FormLabelProps) {
  const className = `${uiFormLabel} ${props.className ?? ""}`.trim();
  const content = (
    <FormLabelContent required={props.required} supportingText={props.supportingText}>
      {props.children}
    </FormLabelContent>
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
