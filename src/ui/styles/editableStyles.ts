// src/ui/styles/editableStyles.ts

import { chipClassName } from "./chipStyles";
import {
  chipColours,
  colourAccentBar,
  colourAmberPlain,
  colourFillInset,
  colourErrorText,
  colourHeadingAccent,
  colourMetadataLabelText,
  colourTextBody,
  colourTextGMNote,
  colourTextMuted,
  colourTextPlaceholder,
  colourTextPrimary,
} from "./colourTokens";
import { fieldColourClass, fieldControlClass, type FieldResize } from "./fieldStyles";

/**
 * Shared UI styles and tokens.
 *
 * - editableInputClass / editableTextareaClass / readOnlyBadgeClass:
 *   reflect an editable/read-only decision already made elsewhere.
 * - uiSection / uiCell / uiCellLabel etc.:
 *   shared layout tokens used across tab components.
 *
 * IMPORTANT: These helpers do NOT decide permissions.
 * They only reflect a decision already made elsewhere.
 */

export function editableInputClass(isEditable: boolean) {
  return fieldControlClass({ editable: isEditable });
}

/** Fill, border and selected border of a text box, for boxes that set their own size. */
export function editableInputColour(isEditable: boolean, invalid = false) {
  return fieldColourClass({ editable: isEditable, invalid });
}

export function editableTextareaClass(isEditable: boolean, resize: FieldResize = "vertical") {
  return fieldControlClass({ editable: isEditable, resize });
}

// ─── Shared UI tokens ─────────────────────────────────────────────────────────
// Use these instead of hardcoding the same Tailwind strings across components.

/** Section header label: amber left-border accent, sits outside or at the top of its box. */
export const uiSectionHeader = `border-l-2 ${colourAccentBar} pl-2 text-xs lg:text-sm font-cinzel font-semibold uppercase tracking-widest ${colourHeadingAccent}`;

/** Standard card shell: bright border and semi-transparent background, without padding. */
export const uiSectionShell = "rounded-lg border border-slate-500 bg-slate-900/60";

/** Standard padded section card. */
export const uiSection = `${uiSectionShell} p-3 lg:p-4`;

export const uiCell = "rounded border border-slate-500 bg-slate-900/60";

/** Wrapping row of compact chips or chip-shaped controls. */
export const uiChipRow = "flex flex-wrap gap-1.5";

/** Inline row whose contents are vertically centred. */
export const uiInlineRow = "flex items-center gap-2";

/** Inline row with its contents split between the two ends. */
export const uiSplitRow = "flex items-center justify-between gap-2";

/** Two-column form field grid which collapses to one column on a phone. */
export const uiFieldGrid = "grid grid-cols-1 gap-3 sm:grid-cols-2";

/** Tinted card shape without a colour: pair with a colourNotice token. */
export const uiNoticeBox = "rounded-lg border";

/** Recovery code display box: the standard cell, padded and centred. */
export const uiCodeBox = `${uiCell} p-3 text-center`;

/** Recovery code text: code font, wide tracking, selectable in one tap. */
export const uiCodeText = `font-code [font-feature-settings:'zero'] text-lg lg:text-xl ${colourTextPrimary} tracking-widest break-all select-all`;

/** Label inside a compact stat cell (tight column grids: Quick View, bonuses, movement). */
export const uiCellLabel = `text-[10px] lg:text-xs ${colourTextBody} leading-tight`;

/** Value inside a compact stat cell (tight column grids, keeps text-base to fit). */
export const uiCellValueSm = `text-base lg:text-lg font-semibold font-code ${colourTextPrimary} leading-tight`;

/** Value inside a standard-width display cell: matches the Stepper value size. */
export const uiCellValue = `text-xl lg:text-2xl font-semibold font-code ${colourTextPrimary}`;

// ─── Shared text tone tokens ─────────────────────────────────────────────────
// Use these to keep real content readable and reserve the dimmest grey for
// placeholders, empty states, and low-priority metadata.

/** Primary readable body text for rules, notes, descriptions, and explanations. */
export const uiTextBody = colourTextBody;

/** Empty-state or placeholder-like text. */
export const uiTextPlaceholder = colourTextPlaceholder;

/** Tiny uppercase label text used beside values. */
export const uiTextLabel = `text-[10px] lg:text-xs ${colourMetadataLabelText} uppercase tracking-wide`;

/** Shared error colour. Components retain the size appropriate to their layout. */
export const uiTextError = colourErrorText;
export const uiTextGMNote = colourTextGMNote;

/** Description paragraph inside an info modal, picker detail screen or card body. */
export const uiTextDescription = `text-sm lg:text-base ${uiTextBody} leading-relaxed`;

/** Filled box that holds the description on an item detail screen. */
export const uiDescriptionBox = `text-xs lg:text-sm ${uiTextBody} ${colourFillInset} rounded p-3 lg:p-4 leading-relaxed`;

/** Small supporting line, such as a date, a creator, a count or a helper sentence. */
export const uiTextMeta = `text-xs lg:text-sm ${colourMetadataLabelText}`;

/** Bold highlighted number inside a sentence, such as the points left before a test. */
export const uiThresholdValue = `font-code text-sm lg:text-base font-bold ${colourAmberPlain}`;

/**
 * Specialist visual styles stay with the component or token that owns them.
 * Controls need hover, focus, disabled and selected states. Chips and badges
 * use a linked border, fill and text treatment. Mechanical values and warnings
 * use colour to communicate a game state, threshold, reward or danger.
 * Do not replace those styles with a shared text-tone token.
 */

// ─── Shared heading tokens ───────────────────────────────────────────────────

/** Main title shown above a full page of content. */
export const uiPageTitle = `text-center font-cinzel text-lg font-bold ${colourTextPrimary} lg:text-xl`;

/** Compact red title used in the character-sheet toolbar. */
export const uiToolbarTitle = `px-2 text-center font-cinzel text-sm font-bold leading-tight ${colourHeadingAccent} sm:text-base lg:text-lg`;

/** Centred Cinzel title used by modal headers. Size and colour are supplied by the header. */
export const uiModalTitle = "text-center font-cinzel font-bold";
export const uiModalTitleAccent = colourHeadingAccent;

/** Plain title used in a side drawer header. */
export const uiDrawerTitle = `font-semibold ${colourTextPrimary}`;

/** Cinzel label used for an action row inside a settings-style panel. */
export const uiActionRowLabel = `font-cinzel text-sm font-semibold uppercase tracking-wider ${colourTextPrimary} lg:text-base`;

// ─── Form tokens ──────────────────────────────────────────────────────────────

export const uiFormLabel = `text-xs lg:text-sm font-medium uppercase tracking-wide ${colourTextPrimary}`;
export const uiFormLabelBlue = `text-xs lg:text-sm font-medium uppercase tracking-wide ${colourMetadataLabelText}`;
export const uiFormLabelSecondary = `block text-xs lg:text-sm ${colourTextMuted} mb-1`;
/** The small hint beside a form label, such as "(optional)". */
export const uiFormLabelHint = `ml-1 normal-case tracking-normal ${colourMetadataLabelText}`;
export const uiInfoModalWrapper = "inline-flex items-center -translate-y-[1.4px]";

/** Small circular loading spinner. Set its size with width and height classes where it is used. */
export const uiSpinner = "rounded-full border-2 border-slate-800 border-t-red-600 animate-spin";
export const uiSubheading = `text-xs lg:text-sm font-semibold ${colourTextPrimary} uppercase tracking-wide`;
export const uiItemName = `text-sm lg:text-base font-medium ${colourTextPrimary}`;
export const uiItemNameHover = `${uiItemName} group-hover:text-white`;
export const uiCardTitle = `text-sm lg:text-base font-semibold ${colourTextPrimary}`;
export const uiCardTitleHover = `${uiCardTitle} group-hover:text-white`;
/** Rule or ability name above its description inside an info modal. */
export const uiRuleName = `text-sm lg:text-base font-semibold ${colourMetadataLabelText}`;

// ──────────────────────────────────────────────────────────────────────────────

export const readOnlyBadgeClass = chipClassName({ className: chipColours.slate });
