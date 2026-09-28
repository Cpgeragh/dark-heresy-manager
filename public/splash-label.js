// Runs before the app starts. When the previous page reloaded for an update, the static
// splash in index.html says "Updating…" from its first paint. The storage key must match
// PWA_JUST_UPGRADED_KEY in src/pwaStartup.ts.
try {
  if (window.sessionStorage.getItem("pwa-just-upgraded")) {
    var label = document.getElementById("splash-label");
    if (label) label.textContent = "Updating…";
  }
} catch (error) {
  // Storage can be unavailable; the splash then keeps its empty label.
}
