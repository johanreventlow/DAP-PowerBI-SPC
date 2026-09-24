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

import astronomical from "../src/Outlier Flagging/astronomical";
import { buildSignalPanelRows } from "../src/Functions/signalPanelRows";
import settingsClass from "../src/Classes/settingsClass";

describe("Punkter, der ikke er tal", () => {
  it("flages ikke som uden for kontrolgrænserne", () => {
    // 5/0 og 0/0 fra en nævner på 0 — tilladt for I-, run- og MR-kort.
    expect(astronomical([Infinity, NaN, -Infinity], [0, 0, 0], [10, 10, 10]))
      .toEqual(["none", "none", "none"]);
  });

  it("lader punktets farve og panelets tal være enige", () => {
    const element = testDom("420", "760");
    const visual = new Visual({ element: element, host: createVisualHost({}) });
    const settings = JSON.parse(JSON.stringify(defaultSettings));
    settings.spc.chart_type = "i";
    visual.update({
      dataViews: [ buildDataView({
        key: keys,
        numerators: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
        // Én nævner på 0 giver værdien 5/0 = Infinity.
        denominators: [1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1]
      }, settings) ],
      viewport: { width: 760, height: 420 },
      type: 2
    });
    const flagged: number = visual.viewModel.outliers[0].astpoint.filter(p => p !== "none").length;
    const counted: number | null = visual.viewModel.outliers[0].per_group_stats[0].n_beyond_limits;
    expect(flagged).toBe(counted);
    element.remove();
  });
});

describe("Panelets fremhævning af punkter uden for kontrolgrænserne", () => {
  const stats: any = {
    longest_run: 3, longest_run_max: 7, n_crossings: 8, n_crossings_min: 4,
    n_beyond_limits: 2, beyond_limits_signal: true, n_useful: 12,
    long_run_signal: false, few_crossings_signal: false
  };
  const panelSettings: any = JSON.parse(JSON.stringify(defaultSettings)).signal_panel;
  const beyondRow = (beyond_limits: boolean) =>
    buildSignalPanelRows(stats, panelSettings, { long_run: true, few_crossings: true, beyond_limits })
      .find(r => r.actual === "2")!;

  it("fremhæver, når fremhævning er slået til", () => {
    expect(beyondRow(true).signal).toBe(true);
  });

  it("fremhæver ikke, når brugeren har slået fremhævning fra", () => {
    // Tallet står der stadig — kun markeringen som signal forsvinder.
    expect(beyondRow(false).signal).toBe(false);
    expect(beyondRow(false).actual).toBe("2");
  });
});

describe("Centerlinjens stipling", () => {
  function targetDash(signal: boolean, userType: string): string {
    // En lang serie over centerlinjen udløser runs-signalet.
    const values: number[] = signal
      ? [50, 50, 50, 50, 60, 61, 62, 60, 61, 62, 60, 61]
      : [50, 52, 48, 51, 49, 53, 47, 50, 52, 48, 51, 49];
    const { element } = render(values, s => { s.lines.type_target = userType; });
    const path = element.querySelector(".targets-linegroup path, .targets-linegroup line")!;
    const dash: string = path.getAttribute("stroke-dasharray") ?? "";
    element.remove();
    return dash;
  }

  it("er fuldt optrukket uden signal, også når en stiplet linjetype er gemt", () => {
    expect(targetDash(false, "10 10")).toBe("10 0");
  });

  it("er stiplet med signal, så de to kan skelnes", () => {
    expect(targetDash(true, "10 10")).toBe("4 2");
  });

  it("tilbyder ikke centerlinjens linjetype i ruden", () => {
    const settings = new settingsClass();
    settings.update(buildDataView({ key: ["A", "B", "C"], numerators: [1, 2, 3] }), [[0, 3]]);
    const lines = settings.getFormattingModel().cards.find(c => c.uid === "lines_card_uid")!;
    const names: string[] = lines.groups.flatMap(g => (g.slices ?? []).map((s: any) =>
      s.control?.properties?.descriptor?.propertyName));
    expect(names).not.toContain("type_target");
    // De andre linjers type er uændret tilgængelig.
    expect(names).toContain("type_alt_target");
  });
});
