// src/ui/styles/tableStyles.ts

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

/** The wrapper that lets a wide table scroll sideways on a narrow screen. */
export const uiTableScroll = "overflow-x-auto";

/** The gap after a table's first column. */
export const uiTableFirstCell = "pr-4";

/** A heading cell above a column of numbers. */
export const uiTableNumberHeaderCell = `${uiTableHeaderCell} px-3 text-center`;

/** A body cell holding a number in the code typeface. */
export const uiTableNumberCell = `${uiTableCell} px-3 text-center font-code`;
