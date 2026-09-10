import { defaultSettings } from "../../src/settings";
import { testDom, createVisualHost } from "powerbi-visuals-utils-testutils";
import { Visual } from "../../src/visual";
import buildDataView from "../helpers/buildDataView";
import { type controlLimitsObject } from "../../src/Classes/viewModelClass";
import { describe, it, expect } from "vitest";

// Johan rapporterede 2026-09-10: kontrolgrænser vises på et i-chart, forsvinder
// (korrekt) når man skifter til run, og kommer IKKE tilbage, når man skifter
// tilbage til i. Denne test kører præcis den sekvens.

const keys: string[] = ["2010-01-01","2010-02-01","2010-03-01","2010-04-01","2010-05-01",
                        "2010-06-01","2010-07-01","2010-08-01","2010-09-01","2010-10-01","2010-11-01"];
const numerators: number[] = [10, 11, 10, 12, 11, 10, 11, 12, 10, 11, 14];

function settingsWithChartType(chartType: string) {
  const settings = JSON.parse(JSON.stringify(defaultSettings));
  settings.spc.chart_type = chartType;
  return settings;
}

function render(visual: Visual, chartType: string, updateType: number): void {
  visual.update({
    dataViews: [ buildDataView({ key: keys, numerators: numerators }, settingsWithChartType(chartType)) ],
    viewport: { width: 500, height: 500 },
    type: updateType
  } as any);
}

function limitLineNames(visual: Visual): string[] {
  return (visual.viewModel.groupedLines ?? []).map((d: any) => d[0]);
}

describe("Skift af chart-type frem og tilbage", () => {
  // Power BI sender ikke altid VisualUpdateType.Data (2) alene. All (62) har
  // Data-bitten sat og betyder også "data kan være ændret". En sammenligning
  // med === 2 rammer kun det ene af dem.
  [2 /* Data */, 62 /* All */, 6 /* Data | Resize */].forEach(updateType => {
    it(`genskaber kontrolgrænser ved i → run → i (update-type ${updateType})`, () => {
      const element = testDom("500", "500");
      const visual = new Visual({ element: element, host: createVisualHost({}) } as any);

      render(visual, "i", 2);
      const first: controlLimitsObject = visual.viewModel.controlLimits[0];
      expect(first.ul99, "kontrolgrænser mangler allerede ved første render").toBeDefined();
      expect(limitLineNames(visual)).toContain("ul99");

      render(visual, "run", updateType);
      const asRun: controlLimitsObject = visual.viewModel.controlLimits[0];
      expect(asRun.ul99, "run-chart burde ikke have kontrolgrænser").toBeUndefined();

      render(visual, "i", updateType);
      const back: controlLimitsObject = visual.viewModel.controlLimits[0];
      expect(back.ul99, "kontrolgrænser kom ikke tilbage i beregningen").toBeDefined();
      expect(limitLineNames(visual), "kontrolgrænser blev ikke tegnet igen").toContain("ul99");

      element.remove();
    });
  });

  // Johans præcise sekvens: skiftet TIL run gik igennem (chart ændrede sig),
  // skiftet TILBAGE gik ikke. Det sker, når de to opdateringer har hver sin
  // update-type — visualen viser så et i-chart tegnet af run-beregningen.
  it("genskaber kontrolgrænser, når skiftet tilbage kommer som All (62)", () => {
    const element = testDom("500", "500");
    const visual = new Visual({ element: element, host: createVisualHost({}) } as any);

    render(visual, "i", 2);
    render(visual, "run", 2);
    expect(visual.viewModel.controlLimits[0].ul99).toBeUndefined();

    render(visual, "i", 62);
    expect(visual.viewModel.controlLimits[0].ul99,
           "chart_type er i, men grænserne mangler stadig").toBeDefined();
    expect(limitLineNames(visual)).toContain("ul99");

    element.remove();
  });
});
