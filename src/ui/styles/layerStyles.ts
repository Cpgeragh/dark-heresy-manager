// Shared application layers. Native dialogs and supported popovers use the browser top layer.
export const uiLayerLocal = "z-10";
export const uiLayerBackdrop = "z-40";
export const uiLayerForeground = "z-50";

/**
 * The blur behind a backdrop. `page` is for a backdrop the app draws, and `dialog` and `dialogNone`
 * are for the browser's own pop-up backdrop, which only accepts the `backdrop:` spelling.
 */
export const uiBackdropBlur = {
  page: "backdrop-blur-sm",
  dialog: "backdrop:backdrop-blur-sm",
  dialogNone: "backdrop:backdrop-blur-none",
} as const;

/** How long the section drawer, its inner panels and its backdrop take to slide or fade. */
export const uiDrawerDuration = "duration-300";
