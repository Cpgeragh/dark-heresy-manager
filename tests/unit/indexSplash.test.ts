// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { PWA_JUST_UPGRADED_KEY } from "../../src/pwaStartup";
import {
  colourAmberPlain,
  colourPageBackground,
  colourSpinnerAccent,
  colourSplashTitle,
} from "../../src/ui/styles/colourTokens";

const indexHtml = readFileSync(resolve(process.cwd(), "index.html"), "utf8");
const stylesheet = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");
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

  it("uses the React splash page background, title and spinner colours", () => {
    const root = indexHtml.slice(
      indexHtml.indexOf('<div id="root">'),
      indexHtml.indexOf("</body>")
    );
    expect(root).toContain(colourPageBackground);
    expect(root).toContain(colourSplashTitle);
    expect(root).not.toContain("text-red-600");
    expect(root).toContain(colourSpinnerAccent);
    expect(root).not.toContain("border-t-red-600");
  });

  it("uses one startup background in the browser theme and the stylesheet root", () => {
    expect(indexHtml).toContain('<meta name="theme-color" content="#020617" />');
    expect(stylesheet).toMatch(/:root\s*{[^}]*background-color:\s*#020617;/);
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
