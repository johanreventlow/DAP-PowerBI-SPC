import { defaultSettings } from "../../src/settings";
import { testDom, createVisualHost } from "powerbi-visuals-utils-testutils";
import { Visual } from "../../src/visual";
import buildDataView from "../helpers/buildDataView";
import { type plotData } from "../../src/Classes/viewModelClass";
import { describe, it, expect } from "vitest";

// Retningsfortolkningen er væk: et punkt uden for kontrolgrænsen markeres ens,
// uanset om det ligger over eller under. Tidligere blev "upper"/"lower" oversat
// til forbedring/forværring ud fra improvement_direction og farvelagt derefter.
//
// Serien har ét punkt langt over og ét langt under, så begge sider rammes i
// samme kørsel. Uden begge ville testen ikke kunne se forskel på "én farve" og
// "to farver, hvor kun den ene blev ramt".
const keys: string[] = ["2024-01-01","2024-02-01","2024-03-01","2024-04-01","2024-05-01",
                        "2024-06-01","2024-07-01","2024-08-01","2024-09-01","2024-10-01",
                        "2024-11-01","2024-12-01"];
const numerators: number[] = [50, 51, 49, 50, 52, 48, 51, 49, 50, 51, 120, 2];

function run(overrides: Record<string, unknown> = {}) {
  const element = testDom("500", "500");
  const visual = new Visual({ element: element, host: createVisualHost({}) });
  const settings = JSON.parse(JSON.stringify(defaultSettings));
  settings.spc.chart_type = "i";
  settings.outliers.astronomical = true;
  Object.assign(settings.outliers, overrides);

  visual.update({
    dataViews: [ buildDataView({ key: keys, numerators: numerators }, settings) ],
    viewport: { width: 500, height: 500 },
    type: 2 /*powerbi.VisualUpdateType.Data*/
  });

  const points = visual.viewModel.plotPoints[0] as plotData[];
  const flagged = points.filter(p => p.table_row.astpoint !== "none");
  element.remove();
  return { points, flagged };
}

describe("Observationer uden for kontrolgrænsen", () => {
  it("rammer både et punkt over og et under, så testen kan se forskel", () => {
    const { flagged } = run();
    expect(flagged.map(p => p.table_row.astpoint).sort()).toEqual(["lower", "upper"]);
  });

  it("giver punkt over og punkt under samme farve", () => {
    const { flagged } = run();
    const colours = new Set(flagged.map(p => p.aesthetics.colour));
    expect(colours.size).toBe(1);
    const outlines = new Set(flagged.map(p => p.aesthetics.colour_outline));
    expect(outlines.size).toBe(1);
  });

  it("bruger den farve, brugeren har valgt", () => {
    const { flagged } = run({ ast_colour: "#123456" });
    flagged.forEach(p => {
      expect(p.aesthetics.colour).toBe("#123456");
      expect(p.aesthetics.colour_outline).toBe("#123456");
    });
  });

  it("lader punkter inden for grænserne beholde deres egen farve", () => {
    const { points, flagged } = run({ ast_colour: "#123456" });
    const inside = points.filter(p => p.table_row.astpoint === "none");
    expect(inside.length).toBe(points.length - flagged.length);
    inside.forEach(p => expect(p.aesthetics.colour).not.toBe("#123456"));
  });
});
