import { describe, it, expect } from "vitest";
import { testDom, createVisualHost } from "powerbi-visuals-utils-testutils";
import chartTypeWarning from "../src/Functions/chartTypeWarning";
import derivedSettingsClass from "../src/Classes/derivedSettingsClass";
import { defaultSettings } from "../src/settings";
import { Visual } from "../src/visual";
import buildDataView from "./helpers/buildDataView";

// Advarslen fanger det, der kan afgøres af, hvad brugeren har bundet: en
// nævner, som diagramtypen slet ikke læser. Den vurderer ikke tallene.

function props(chart_type: string) {
  return new derivedSettingsClass({ ...defaultSettings.spc, chart_type }).chart_type_props;
}

describe("Regel om diagramtype og data", () => {
  it("advarer, når en nævner er bundet til en type, der ikke læser den", () => {
    expect(chartTypeWarning(true, props("c"))).toContain("Nævneren bruges ikke");
    expect(chartTypeWarning(true, props("g"))).toContain("Nævneren bruges ikke");
    expect(chartTypeWarning(true, props("t"))).toContain("Nævneren bruges ikke");
  });

  it("peger på de to typer, der modellerer en nævner", () => {
    expect(chartTypeWarning(true, props("c"))).toContain("Rate (U')");
    expect(chartTypeWarning(true, props("c"))).toContain("Procent (P')");
  });

  it("tier, når typen bruger nævneren", () => {
    // i, run og mr regner værdien som forholdet tæller/nævner. At tegne et
    // forhold som enkeltmålinger er et valg, ikke en fejl.
    ["p", "pp", "u", "up", "i", "ip", "run", "mr"].forEach(t => {
      expect(chartTypeWarning(true, props(t)), t).toBe("");
    });
  });

  it("tier, når der ikke er nogen nævner", () => {
    ["c", "g", "t", "i", "run"].forEach(t => {
      expect(chartTypeWarning(false, props(t)), t).toBe("");
    });
  });
});

const keys: string[] = ["1", "2", "3", "4", "5", "6", "7", "8"];
const numerators: number[] = [5, 7, 4, 6, 8, 5, 6, 7];
const denominators: number[] = [50, 60, 55, 52, 58, 51, 57, 54];

function render(chart_type: string, withDenominator: boolean, overrides: (s: any) => void = () => undefined) {
  const element = testDom("500", "500");
  const visual = new Visual({ element: element, host: createVisualHost({}) });
  const settings = JSON.parse(JSON.stringify(defaultSettings));
  settings.spc.chart_type = chart_type;
  overrides(settings);

  visual.update({
    dataViews: [ buildDataView(
      withDenominator ? { key: keys, numerators: numerators, denominators: denominators }
                      : { key: keys, numerators: numerators }, settings) ],
    viewport: { width: 500, height: 500 },
    type: 2 /*powerbi.VisualUpdateType.Data*/
  });
  return { element, visual };
}

function warningText(element: HTMLElement): string {
  return element.querySelector(".warninggroup text")?.textContent ?? "";
}

function warningLines(element: HTMLElement): string[] {
  return Array.from(element.querySelectorAll(".warninggroup tspan")).map(t => t.textContent ?? "");
}

describe("Advarslen på lærredet", () => {
  it("skrives på diagrammet, når nævneren ikke bruges", () => {
    const { element } = render("c", true);
    expect(warningText(element)).toContain("Nævneren bruges ikke");
    // Diagrammet tegnes stadig: valget er sandsynligvis forkert, ikke ugyldigt.
    expect(element.querySelectorAll(".dotsgroup path").length).toBe(keys.length);
    expect(element.querySelector(".errormessage")).toBeNull();
    element.remove();
  });

  it("sættes over to linjer, så den ikke løber ind i signalpanelet", () => {
    const { element } = render("c", true);
    const lines: string[] = warningLines(element);
    expect(lines.length).toBe(2);
    // Hver linje er en hel sætning: konstateringen, så rådet.
    expect(lines[0]).toBe("Nævneren bruges ikke af den valgte diagramtype.");
    expect(lines[1]).toContain("Overvej");
    element.remove();
  });

  it("har en baggrund, så den kan læses oven på en linje", () => {
    const { element } = render("c", true);
    const rect = element.querySelector(".warninggroup rect");
    expect(rect).toBeTruthy();
    expect(Number(rect!.getAttribute("width"))).toBeGreaterThan(0);
    element.remove();
  });

  it("skrives ikke, når valget passer til data", () => {
    const { element } = render("up", true);
    expect(warningText(element)).toBe("");
    element.remove();
  });

  it("kan slås fra", () => {
    const { element } = render("c", true, s => { s.canvas.show_chart_type_warning = false; });
    expect(warningText(element)).toBe("");
    element.remove();
  });

  it("forsvinder igen, når diagramtypen rettes", () => {
    // Samme visual, ny optegning: advarslen må ikke blive hængende.
    const element = testDom("500", "500");
    const visual = new Visual({ element: element, host: createVisualHost({}) });
    const settings = JSON.parse(JSON.stringify(defaultSettings));
    settings.spc.chart_type = "c";
    const update = () => visual.update({
      dataViews: [ buildDataView({ key: keys, numerators: numerators, denominators: denominators }, settings) ],
      viewport: { width: 500, height: 500 },
      type: 2
    });

    update();
    expect(warningText(element)).not.toBe("");

    settings.spc.chart_type = "up";
    update();
    expect(warningText(element)).toBe("");
    element.remove();
  });
});
