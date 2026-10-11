import { colourDivideList, colourDivider, colourTextPrimary } from "./colourTokens";
import { uiTextLabel } from "./editableStyles";

/** Shared table foundation. Column widths, alignment and typefaces stay with each table. */
export const uiTable = `w-full border-collapse text-left text-sm lg:text-base ${colourTextPrimary}`;

/** Shared heading row with the standard compact label and divider. */
export const uiTableHeaderRow = `${uiTextLabel} border-b ${colourDivider}`;

/** Shared body row dividers. */
export const uiTableBody = `divide-y ${colourDivideList}`;

/** Shared vertical spacing and weight for a heading cell. */
export const uiTableHeaderCell = "py-1.5 font-medium";

/** Shared vertical spacing for a body cell. */
export const uiTableCell = "py-2";
