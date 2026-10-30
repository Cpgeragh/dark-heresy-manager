// src/ui/styles/iconStyles.ts

const px18 = "h-[18px] w-[18px]";

/**
 * The named sizes of an icon. An icon given no size follows the text around it (`inline`).
 * Each other name is a fixed pixel size, and `closeCross` is the 18px then 20px pair of a close cross.
 */
export const uiIconSize = {
  inline: "h-[1em] w-[1em]",
  px10: "h-2.5 w-2.5",
  px12: "h-3 w-3",
  px16: "h-4 w-4",
  px18,
  px24: "h-6 w-6",
  px32: "h-8 w-8",
  closeCross: `${px18} lg:h-5 lg:w-5`,
} as const;
