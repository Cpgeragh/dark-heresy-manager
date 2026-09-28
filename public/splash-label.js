// Runs before the app starts. When the previous page reloaded for an update, the static
// splash in index.html says "Updating..." from its first paint. The storage key must match
// PWA_JUST_UPGRADED_KEY in src/pwaStartup.ts.
try {
  if (window.sessionStorage.getItem("pwa-just-upgraded")) {
    var label = document.getElementById("splash-label");
    if (label) {
      label.textContent = "Updating";
      label.classList.remove("text-slate-500");
      label.classList.add("text-amber-300");

      var dots = [];
      for (var dotIndex = 0; dotIndex < 3; dotIndex += 1) {
        var dot = document.createElement("span");
        dot.textContent = ".";
        dot.classList.add("invisible");
        label.appendChild(dot);
        dots.push(dot);
      }

      var filled = 0;
      var dotTimer = window.setInterval(function () {
        if (!label.isConnected) {
          window.clearInterval(dotTimer);
          return;
        }
        filled = (filled + 1) % 4;
        dots.forEach(function (currentDot, index) {
          currentDot.classList.toggle("invisible", index >= filled);
        });
      }, 300);
    }
  }
} catch (error) {
  // Storage can be unavailable; the splash then keeps its empty label.
}
