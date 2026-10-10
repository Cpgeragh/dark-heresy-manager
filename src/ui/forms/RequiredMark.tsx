import { colourRequiredText } from "../styles/colourTokens";

export function RequiredMark() {
  return (
    <span className={colourRequiredText} aria-hidden="true">
      *
    </span>
  );
}
