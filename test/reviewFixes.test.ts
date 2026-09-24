import { describe, it, expect } from "vitest";
import { testDom, createVisualHost } from "powerbi-visuals-utils-testutils";
import { Visual } from "../src/visual";
import { defaultSettings } from "../src/settings";
import buildDataView from "./helpers/buildDataView";
import { decimalsForTicks } from "../src/Functions/yAxisDecimals";

const keys: string[] = Array.from({ length: 12 }, (_, i) => String(i + 1));

function render(numerators: number[], overrides: (s: any) => void = () => undefined) {
  // testDom tager højde før bredde.
  const element = testDom("420", "760");
  const visual = new Visual({ element: element, host: createVisualHost({}) });
  const settings = JSON.parse(JSON.stringify(defaultSettings));
  settings.spc.chart_type = "i";
  overrides(settings);
  visual.update({
    dataViews: [ buildDataView({ key: keys, numerators: numerators }, settings) ],
    viewport: { width: 760, height: 420 },
    type: 2 /*powerbi.VisualUpdateType.Data*/
  });
  return { element, visual };
}

function yTicks(element: HTMLElement): string[] {
  return Array.from(element.querySelectorAll(".yaxisgroup .tick text")).map(t => t.textContent ?? "");
}

describe("Y-aksens decimaler", () => {
  it("lægger decimaler til, når mærkerne ellers ville blive ens", () => {
    // Rater omkring 0,004: med 0 decimaler blev alle mærker til "0".
    const { element } = render([0.0042, 0.0045, 0.0039, 0.0041, 0.0044, 0.0040,
                                0.0043, 0.0038, 0.0046, 0.0041, 0.0042, 0.0040]);
    const ticks: string[] = yTicks(element);
    expect(ticks.length).toBeGreaterThan(2);
    expect(new Set(ticks).size).toBe(ticks.length);
    element.remove();
  });

  it("giver centerlinjens etiket samme præcision som aksen", () => {
    const { element } = render([0.0042, 0.0045, 0.0039, 0.0041, 0.0044, 0.0040,
                                0.0043, 0.0038, 0.0046, 0.0041, 0.0042, 0.0040]);
    const label: string = Array.from(element.querySelectorAll(".linesgroup text"))
                               .map(t => t.textContent ?? "").find(t => t !== "")!;
    expect(label).not.toBe("0");
    expect(label).toMatch(/^0,00\d+$/);
    element.remove();
  });

  it("beholder 0 decimaler, når hele tal kan skelne mærkerne", () => {
    const { element } = render([50, 52, 48, 51, 49, 53, 47, 50, 52, 48, 51, 49]);
    yTicks(element).forEach(t => expect(t).not.toContain(","));
    element.remove();
  });

  it("regner decimalerne ud fra afstanden mellem mærkerne", () => {
    expect(decimalsForTicks(0, [0.002, 0.004, 0.006])).toBe(3);
    expect(decimalsForTicks(0, [0.5, 1, 1.5])).toBe(1);
    expect(decimalsForTicks(0, [40, 45, 50])).toBe(0);
    // Indstillingen er et minimum og bliver aldrig sænket.
    expect(decimalsForTicks(2, [40, 45, 50])).toBe(2);
    // Uden to mærker er der ingen afstand at gå efter.
    expect(decimalsForTicks(1, [5])).toBe(1);
  });
});

describe("Antal punkter til grænseberegning", () => {
  const values: number[] = [50, 52, 48, 51, 49, 53, 47, 50, 52, 48, 51, 49];

  it("tåler et decimaltal", () => {
    // 5,5 gav tidligere "Invalid array length" og en tom visual.
    const { element, visual } = render(values, s => { s.spc.num_points_subset = 5.5; });
    expect(element.querySelector(".errormessage")).toBeNull();
    const limits = visual.viewModel.controlLimits[0];
    expect(limits.ul99!.every(v => Number.isFinite(v))).toBe(true);
    element.remove();
  });

  it("runder ned, så 5,5 punkter regner som 5", () => {
    const five = render(values, s => { s.spc.num_points_subset = 5; });
    const fiveHalf = render(values, s => { s.spc.num_points_subset = 5.5; });
    expect(fiveHalf.visual.viewModel.controlLimits[0].targets)
      .toEqual(five.visual.viewModel.controlLimits[0].targets);
    five.element.remove();
    fiveHalf.element.remove();
  });

  it("tåler også et decimaltal, når punkterne tages fra slutningen", () => {
    const { element, visual } = render(values, s => {
      s.spc.num_points_subset = 5.5;
      s.spc.subset_points_from = "End";
    });
    expect(element.querySelector(".errormessage")).toBeNull();
    expect(visual.viewModel.controlLimits[0].targets.every(v => Number.isFinite(v))).toBe(true);
    element.remove();
  });
});
