import { defaultSettings } from "../../src/settings";
import spcSettings from "../../src/Settings Model/spcSettings";
import { testDom, createVisualHost } from "powerbi-visuals-utils-testutils";
import { Visual } from "../../src/visual";
import buildDataView from "../helpers/buildDataView";
import { type controlLimitsObject } from "../../src/Classes/viewModelClass";
import { describe, it, expect } from "vitest";

// i_m og i_mm er fjernet fra Chart Type-dropdownen, men beregningerne bliver i
// pakken. En rapport, hvor chart_type allerede er gemt som en af dem, skal
// stadig rendere. De to ting trækker i hver sin retning, så begge låses her:
// listen må ikke tilbyde dem, og motoren skal stadig kunne køre dem.

const keys: string[] = ["2010-01-01","2010-02-01","2010-03-01","2010-04-01","2010-05-01",
                        "2010-06-01","2010-07-01","2010-08-01","2010-09-01","2010-10-01","2010-11-01"];
// Skæv serie: den ene høje værdi trækker gennemsnittet væk fra medianen, så en
// centerlinje beregnet med mean ikke kan bestå testen nedenfor ved et tilfælde.
const numerators: number[] = [10, 11, 10, 12, 11, 10, 11, 12, 10, 11, 40];

function median(values: number[]): number {
  const s: number[] = [...values].sort((a, b) => a - b);
  const mid: number = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
}

describe("Skjulte chart-typer", () => {
  it("tilbyder hverken i_m eller i_mm i dropdownen", () => {
    const items: string[] = spcSettings.settingsGroups.all.chart_type.items.map(d => d.value);
    expect(items).not.toContain("i_m");
    expect(items).not.toContain("i_mm");
  });

  // De skal blive i `valid`, ellers erstatter extractConditionalFormatting en
  // gemt værdi med default og viser brugeren en fejlbesked. At skjule en type
  // uden dette ville altså ødelægge rapporter, der allerede bruger den.
  it("holder dem gyldige, så gemte rapporter ikke afvises", () => {
    const values: string[] = spcSettings.settingsGroups.all.chart_type.valid;
    expect(values).toContain("i_m");
    expect(values).toContain("i_mm");
  });

  it("tilbyder stadig de typer, der skal kunne vælges", () => {
    const values: string[] = spcSettings.settingsGroups.all.chart_type.valid;
    ["run", "i", "mr", "p", "pp", "u", "up", "c", "xbar", "s", "g", "t"]
      .forEach(t => expect(values).toContain(t));
  });

  // Testdata er valgt så de to adskiller sig; ellers ville assertionen nedenfor
  // bestå uanset hvilken centerlinje implementationen brugte.
  it("har testdata hvor median og gennemsnit faktisk er forskellige", () => {
    const mean: number = numerators.reduce((a, b) => a + b, 0) / numerators.length;
    expect(median(numerators)).not.toBeCloseTo(mean, 2);
  });

  ["i_m", "i_mm"].forEach(chartType => {
    it(`renderer stadig en gemt chart_type: "${chartType}" med median-centerlinje`, () => {
      const element = testDom("500", "500");
      const visual = new Visual({ element: element, host: createVisualHost({}) });
      const settings = JSON.parse(JSON.stringify(defaultSettings));
      settings.spc.chart_type = chartType;

      visual.update({
        dataViews: [ buildDataView({ key: keys, numerators: numerators }, settings) ],
        viewport: { width: 500, height: 500 },
        type: 2 /*powerbi.VisualUpdateType.Data*/
      });

      const limits: controlLimitsObject = visual.viewModel.controlLimits[0];
      expect(limits.keys.length).toBe(keys.length);
      limits.targets.forEach(t => expect(t as number).toBeCloseTo(median(numerators), 6));
      expect(limits.ul99).toBeDefined();
      expect(limits.ll99).toBeDefined();

      element.remove();
    });
  });
});
