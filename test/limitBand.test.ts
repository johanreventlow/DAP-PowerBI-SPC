import { defaultSettings } from "../src/settings";
import { testDom, createVisualHost } from "powerbi-visuals-utils-testutils";
import { Visual } from "../src/visual";
import buildDataView from "./helpers/buildDataView";
import { describe, it, expect } from "vitest";

// Båndet mellem 3σ-grænserne. Default fra, ét bånd per fase, og intet bånd
// hvor der ikke er kontrolgrænser at spænde det ud imellem.

const keys: string[] = ["2024-01-01","2024-02-01","2024-03-01","2024-04-01","2024-05-01",
                        "2024-06-01","2024-07-01","2024-08-01","2024-09-01","2024-10-01",
                        "2024-11-01","2024-12-01"];
const numerators: number[] = [50, 51, 49, 50, 52, 48, 80, 82, 79, 81, 80, 82];

function render(overrides: (s: any) => void = () => undefined) {
  const element = testDom("500", "500");
  const visual = new Visual({ element: element, host: createVisualHost({}) });
  const settings = JSON.parse(JSON.stringify(defaultSettings));
  settings.spc.chart_type = "i";
  overrides(settings);

  visual.update({
    dataViews: [ buildDataView({ key: keys, numerators: numerators }, settings) ],
    viewport: { width: 500, height: 500 },
    type: 2 /*powerbi.VisualUpdateType.Data*/
  });

  const paths = element.querySelectorAll(".limitbandgroup path");
  return { element, visual, paths };
}

describe("Kontrolgrænse-bånd", () => {
  it("tegnes ikke som default", () => {
    const { element, paths } = render();
    expect(paths.length).toBe(0);
    element.remove();
  });

  it("tegner ét bånd, når det slås til", () => {
    const { element, paths } = render(s => { s.lines.show_band_99 = true; });
    expect(paths.length).toBe(1);
    // En udfyldt flade, ikke en streg.
    expect(paths[0].getAttribute("stroke")).toBe("none");
    expect(paths[0].getAttribute("d")).toBeTruthy();
    element.remove();
  });

  it("bruger den valgte farve og gennemsigtighed", () => {
    const { element, paths } = render(s => {
      s.lines.show_band_99 = true;
      s.lines.band_colour_99 = "#abcdef";
      s.lines.band_opacity_99 = 0.42;
    });
    expect(paths[0].getAttribute("fill")).toBe("#abcdef");
    expect(paths[0].getAttribute("fill-opacity")).toBe("0.42");
    element.remove();
  });

  it("males bag linjer og punkter", () => {
    const { element } = render(s => { s.lines.show_band_99 = true; });
    const svg = element.querySelector("svg")!;
    const order: string[] = Array.from(svg.children).map(c => c.getAttribute("class") ?? "");
    const band: number = order.findIndex(c => c.includes("limitbandgroup"));
    const lines: number = order.findIndex(c => c.includes("linesgroup"));
    const dots: number = order.findIndex(c => c.includes("dotsgroup"));
    expect(band).toBeGreaterThanOrEqual(0);
    // SVG maler i dokumentorden, så et lavere indeks er længere bagude.
    expect(band).toBeLessThan(lines);
    expect(band).toBeLessThan(dots);
    element.remove();
  });

  it("tegner intet bånd på et run-diagram, som ikke har kontrolgrænser", () => {
    const { element, paths } = render(s => {
      s.spc.chart_type = "run";
      s.lines.show_band_99 = true;
    });
    expect(paths.length).toBe(0);
    element.remove();
  });

  it("bryder båndet ved faseskift", () => {
    // Serien har et tydeligt niveauskift ved observation 7. Med en faseopdeling
    // dér får hver fase sine egne grænser, og et sammenhængende bånd hen over
    // skiftet ville tegne en flade, der ikke svarer til nogen af dem.
    const element = testDom("500", "500");
    const visual = new Visual({ element: element, host: createVisualHost({}) });
    const settings = JSON.parse(JSON.stringify(defaultSettings));
    settings.spc.chart_type = "i";
    settings.lines.show_band_99 = true;
    settings.spc.split_on_click = false;

    visual.update({
      dataViews: [ buildDataView({
        key: keys,
        numerators: numerators,
        groupings: keys.map((_, i) => i < 6 ? "Fase 1" : "Fase 2")
      }, settings) ],
      viewport: { width: 500, height: 500 },
      type: 2 /*powerbi.VisualUpdateType.Data*/
    });

    const paths = element.querySelectorAll(".limitbandgroup path");
    expect(paths.length).toBe(2);
    // To adskilte flader, ikke den samme tegnet to gange.
    expect(paths[0].getAttribute("d")).not.toBe(paths[1].getAttribute("d"));
    element.remove();
  });
});
