import { defaultSettings } from "../src/settings";
import { testDom, createVisualHost } from "powerbi-visuals-utils-testutils";
import { Visual } from "../src/visual";
import buildDataView from "./helpers/buildDataView";
import { describe, it, expect } from "vitest";

// Plottets udseende med defaults, målt på det tegnede SVG. Farverne og
// tykkelserne er husets (jf. docs/regionh-tema.md), så de er en del af
// kontrakten og ikke bare en startværdi.

const keys: string[] = ["2024-01-01","2024-02-01","2024-03-01","2024-04-01","2024-05-01",
                        "2024-06-01","2024-07-01","2024-08-01","2024-09-01","2024-10-01",
                        "2024-11-01","2024-12-01"];
const numerators: number[] = [50, 51, 49, 50, 52, 48, 51, 49, 50, 52, 48, 51];

function render() {
  const element = testDom("500", "500");
  const visual = new Visual({ element: element, host: createVisualHost({}) });
  const settings = JSON.parse(JSON.stringify(defaultSettings));
  settings.spc.chart_type = "i";

  visual.update({
    dataViews: [ buildDataView({ key: keys, numerators: numerators }, settings) ],
    viewport: { width: 500, height: 500 },
    type: 2 /*powerbi.VisualUpdateType.Data*/
  });
  return element;
}

function line(element: HTMLElement, group: string) {
  const path = element.querySelector(`.${group}-linegroup path`);
  expect(path, group).toBeTruthy();
  return {
    width: path!.getAttribute("stroke-width"),
    colour: path!.getAttribute("stroke"),
    dash: path!.getAttribute("stroke-dasharray")
  };
}

describe("Plottets defaults", () => {
  it("tegner dataserien tyk i temafarve 1", () => {
    const element = render();
    expect(line(element, "values")).toEqual({ width: "3", colour: "#002555", dash: "10 0" });
    element.remove();
  });

  it("tegner centerlinjen i en lys tone af temafarve 1", () => {
    const element = render();
    expect(line(element, "targets")).toEqual({ width: "2", colour: "#99a8bb", dash: "10 0" });
    element.remove();
  });

  it("tegner kontrolgrænserne tynde og fuldt optrukne i temafarve 2", () => {
    const element = render();
    // "10 0" er en streg uden mellemrum, altså fuldt optrukket.
    expect(line(element, "ll99")).toEqual({ width: "1", colour: "#809bbc", dash: "10 0" });
    expect(line(element, "ul99")).toEqual({ width: "1", colour: "#809bbc", dash: "10 0" });
    element.remove();
  });

  it("udfylder kontrolgrænseområdet uigennemsigtigt", () => {
    const element = render();
    const band = element.querySelector(".limitbandgroup path");
    expect(band).toBeTruthy();
    expect(band!.getAttribute("fill")).toBe("#CCD7E4");
    expect(band!.getAttribute("fill-opacity")).toBe("1");
    element.remove();
  });

  it("tegner datapunkter med radius 5", () => {
    const element = render();
    const dot = element.querySelector(".dotsgroup path") as SVGGraphicsElement | null;
    expect(dot).toBeTruthy();
    // d3.symbol() får arealet, så radius 5 giver et punkt på 10 px på tværs.
    expect(Math.round(dot!.getBBox().width)).toBe(10);
    element.remove();
  });
});
