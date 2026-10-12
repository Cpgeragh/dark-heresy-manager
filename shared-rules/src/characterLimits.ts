// shared-rules/src/characterLimits.ts
//
// Size ceilings for a character document and for each field written to it. The
// browser's PRODUCT_LIMITS and the server's character field validators both read
// these values.

export const CHARACTER_DOCUMENT_LIMITS = {
  documentBytes: 900_000,
  arrayEntries: 200,
  objectKeys: 100,
  nestingDepth: 8,
  fieldCharacters: 4_000,
} as const;
