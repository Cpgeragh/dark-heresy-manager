// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { PWA_JUST_UPGRADED_KEY } from "../../src/pwaStartup";
import { colourAmberPlain } from "../../src/ui/styles/colourTokens";

const indexHtml = readFileSync(resolve(process.cwd(), "index.html"), "utf8");
const labelScript = readFileSync(resolve(process.cwd(), "public/splash-label.js"), "utf8");

function runLabelScript() {
  new Function(labelScript)();
}

describe("static splash in index.html", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    sessionStorage.clear();
  });

  it("carries the splash inside the root element before the app starts", () => {
    const root = indexHtml.slice(
      indexHtml.indexOf('<div id="root">'),
      indexHtml.indexOf("</body>")
    );
    expect(root).toContain("splash-inquisition-emblem.webp");
    expect(root).toContain("splash-aquila-divider.webp");
    expect(root).toContain('id="splash-label"');
  });

  it("loads the label script before the application module", () => {
    const script = indexHtml.indexOf('src="/splash-label.js"');
    expect(script).toBeGreaterThan(-1);
    expect(script).toBeLessThan(indexHtml.indexOf('src="/src/main.tsx"'));
  });

  it("shows amber Updating text with three moving dots when the just-upgraded note is present", () => {
    document.body.innerHTML = '<span id="splash-label"></span>';
    sessionStorage.setItem(PWA_JUST_UPGRADED_KEY, "1");

    runLabelScript();

    const label = document.getElementById("splash-label");
    expect(label).toHaveTextContent("Updating...");
    expect(label).toHaveClass(colourAmberPlain);
    expect(label?.querySelectorAll("span")).toHaveLength(3);
  });

  it("leaves the label empty on a normal open", () => {
    document.body.innerHTML = '<span id="splash-label"></span>';

    runLabelScript();

    expect(document.getElementById("splash-label")?.textContent).toBe("");
  });
});
