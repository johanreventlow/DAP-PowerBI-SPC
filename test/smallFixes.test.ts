import { describe, it, expect } from "vitest";
import { testDom, createVisualHost } from "powerbi-visuals-utils-testutils";
import { Visual } from "../src/visual";
import { defaultSettings } from "../src/settings";
import buildDataView from "./helpers/buildDataView";
import buildTooltip from "../src/Functions/buildTooltip";
import derivedSettingsClass from "../src/Classes/derivedSettingsClass";
import targetOperator from "../src/Functions/targetOperator";

const keys: string[] = Array.from({ length: 20 }, (_, i) => String(i + 1));
const numerators: number[] = [50, 52, 48, 51, 49, 53, 47, 50, 52, 48,
                              51, 49, 68, 50, 52, 48, 51, 49, 53, 47];

function render(overrides: (s: any) => void = () => undefined, width = 760, height = 420) {
  // testDom tager højde før bredde.
  const element = testDom(String(height), String(width));
  const visual = new Visual({ element: element, host: createVisualHost({}) });
  const settings = JSON.parse(JSON.stringify(defaultSettings));
  settings.spc.chart_type = "i";
  overrides(settings);

  visual.update({
    dataViews: [ buildDataView({ key: keys, numerators: numerators }, settings) ],
    viewport: { width: width, height: height },
    type: 2 /*powerbi.VisualUpdateType.Data*/
  });
  return { element, visual };
}

function lineLabels(element: HTMLElement): string[] {
  return Array.from(element.querySelectorAll(".linesgroup text"))
              .map(t => t.textContent ?? "")
              .filter(t => t !== "");
}

describe("Punkter uden for kontrolgrænser", () => {
  it("fremhæves som default i designguidens signalfarve", () => {
    const { element } = render();
    const fills: string[] = Array.from(element.querySelectorAll<SVGPathElement>(".dotsgroup path"))
                                 .map(p => p.style.fill);
    // Observation 13 (68) ligger over den øvre grænse.
    expect(fills[12]).toBe("rgb(196, 123, 0)");
    expect(new Set(fills.filter((_, i) => i !== 12)).size).toBe(1);
    element.remove();
  });
});

describe("Centerlinjens værdi", () => {
  it("vises som default på diagrammet", () => {
    const { element } = render();
    expect(lineLabels(element).length).toBe(1);
    expect(lineLabels(element)[0]).toMatch(/^5\d,\d\d$/);
    element.remove();
  });

  it("har plads mellem plottet og signalpanelet", () => {
    const { element, visual } = render();
    // Første .linesgroup text er en tom etiket for en linje uden værdi, så
    // den med tekst skal findes frem — ellers måler vi en boks med bredde 0.
    const label = Array.from(element.querySelectorAll<SVGGraphicsElement>(".linesgroup text"))
                       .find(t => (t.textContent ?? "") !== "")!;
    expect(label.getBBox().width).toBeGreaterThan(0);
    const panelStart: number = 760 - visual.viewModel.inputSettings.settings[0].signal_panel.panel_width;
    const labelEnd: number = label.getBBox().x + label.getBBox().width;
    expect(labelEnd).toBeLessThan(panelStart);
    element.remove();
  });
});

describe("Mållinjen", () => {
  const withTarget = (s: any) => {
    s.lines.show_alt_target = true;
    s.lines.alt_target = 55;
  };

  it("er stiplet som default og viser sin værdi", () => {
    const { element } = render(withTarget);
    const path = element.querySelector(".alt_targets-linegroup path")!;
    expect(path.getAttribute("stroke-dasharray")).toBe("10 10");
    expect(lineLabels(element).some(t => t.includes("55,00"))).toBe(true);
    element.remove();
  });

  it("sætter retningen foran værdien, når den er valgt", () => {
    const { element } = render(s => { withTarget(s); s.lines.operator_alt_target = ">="; });
    expect(lineLabels(element).some(t => t === "≥ 55,00")).toBe(true);
    element.remove();
  });

  it("oversætter hver retning til sit symbol", () => {
    expect(targetOperator(">=")).toBe("≥ ");
    expect(targetOperator("<=")).toBe("≤ ");
    expect(targetOperator(">")).toBe("> ");
    expect(targetOperator("<")).toBe("< ");
    // Ingen retning: intet foran værdien.
    expect(targetOperator("none")).toBe("");
  });

  it("tager retningen med i tooltippet", () => {
    const settings = JSON.parse(JSON.stringify(defaultSettings));
    settings.lines.show_alt_target = true;
    settings.lines.operator_alt_target = "<=";
    const row: any = { date: "1", value: 1, target: 1, alt_target: 55, ll99: 0, ul99: 2, astpoint: "none" };
    const tooltip = buildTooltip(row, undefined, settings, new derivedSettingsClass(settings.spc));
    expect(tooltip.some(t => t.value === "≤ 55,00")).toBe(true);
  });
});

describe("Antal brugbare observationer", () => {
  it("står ikke i panelet som default", () => {
    const { element } = render();
    const texts: string[] = Array.from(element.querySelectorAll(".signal-panel text"))
                                 .map(t => t.textContent ?? "");
    expect(texts.some(t => t.toUpperCase().includes("BRUGBARE"))).toBe(false);
    element.remove();
  });

  it("står stadig i tooltippet", () => {
    const settings = JSON.parse(JSON.stringify(defaultSettings));
    const row: any = { date: "1", value: 1, target: 1, ll99: 0, ul99: 2, astpoint: "none" };
    const stats: any = { longest_run: 4, longest_run_max: 7, n_crossings: 9,
                         n_crossings_min: 6, n_beyond_limits: 0, n_useful: 19 };
    const tooltip = buildTooltip(row, undefined, settings, new derivedSettingsClass(settings.spc), stats);
    expect(tooltip.some(t => t.displayName === settings.signal_panel.label_n_useful
                             && t.value === "19")).toBe(true);
  });
});

describe("Sigtelinjerne ved musemarkøren", () => {
  it("tegnes foran kontrolgrænse-fladen", () => {
    const { element } = render();
    const svg = element.querySelector("svg")!;
    const order: string[] = Array.from(svg.children).map(c => c.getAttribute("class") ?? "");
    const band: number = order.findIndex(c => c.includes("limitbandgroup"));
    const ttip: number = order.findIndex(c => c.includes("ttip-line-x"));
    const lines: number = order.findIndex(c => c.includes("linesgroup"));
    // SVG maler i dokumentorden: efter båndet, men før linjer og punkter.
    expect(band).toBeLessThan(ttip);
    expect(ttip).toBeLessThan(lines);
    element.remove();
  });
});
