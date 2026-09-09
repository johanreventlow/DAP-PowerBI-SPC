import { defaultSettings } from "../src/settings";
import { testDom, createVisualHost } from "powerbi-visuals-utils-testutils";
import { Visual } from "../src/visual";
import buildDataView from "./helpers/buildDataView";
import { describe, it, expect, afterAll } from "vitest";

// Two periods; the second is a monotone drop, so it crosses the median once
// and the few-crossings rule fires there.
const keys: string[] = Array.from({ length: 24 }, (_, i) => `2024-${String(i + 1).padStart(2, "0")}`);
const numerators: number[] = [17, 12, 27, 20, 20, 18, 22, 19, 19, 24, 17, 16,
                              24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13];
const groupings: number[] = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
                             2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2];

function settingsWith(panelOverrides: Record<string, unknown> = {}) {
  const settings = JSON.parse(JSON.stringify(defaultSettings));
  settings.spc.chart_type = "c";
  Object.assign(settings.signal_panel, panelOverrides);
  return settings;
}

function render(visual: Visual, width: number, height: number, panelOverrides: Record<string, unknown> = {}): void {
  visual.update({
    dataViews: [ buildDataView({ key: keys, numerators: numerators, groupings: groupings },
                               settingsWith(panelOverrides)) ],
    viewport: { width: width, height: height },
    type: 2 /*powerbi.VisualUpdateType.Data*/
  });
}

describe("Signal panel", () => {
  const element = testDom("500", "800");
  const visual = new Visual({
    element: element,
    host: createVisualHost({})
  });
  const svg = (): SVGSVGElement => element.querySelector("svg") as SVGSVGElement;

  it("reserves its width to the right of the plot and draws inside it", () => {
    render(visual, 800, 500);
    const settings = visual.viewModel.inputSettings.settings[0];
    const reserved: number = settings.canvas.right_padding + settings.signal_panel.panel_width;

    expect(visual.plotProperties.showSignalPanel).toBe(true);
    // Equality, not >=: the panel must not itself trip the overflow check,
    // which would double the padding it lives in.
    expect(visual.plotProperties.xAxis.end_padding).toBe(reserved);

    const panel = svg().querySelector(".signal-panel") as SVGGElement;
    expect(panel).toBeTruthy();
    const bbox = panel.getBBox();
    expect(bbox.x).toBeGreaterThanOrEqual(800 - reserved);
    expect(bbox.x + bbox.width).toBeLessThanOrEqual(800);
    expect(bbox.y + bbox.height).toBeLessThanOrEqual(500);
  });

  it("shows the newest period with a heading and a signal box", () => {
    render(visual, 800, 500);
    const texts: string[] = Array.from(svg().querySelectorAll(".signal-panel text"))
                                 .map(t => t.textContent ?? "");
    expect(texts).toContain("STATISTISK PROCESKONTROL (SPC)");
    expect(texts).toContain("PERIODE 2");
    expect(texts).not.toContain("PERIODE 1");
    expect(texts).toContain("FORVENTET");
    expect(texts).toContain("(MAKSIMUM)");

    const stats = visual.viewModel.outliers[0].per_group_stats[1];
    expect(stats.few_crossings_signal).toBe(true);
    expect(svg().querySelectorAll(".signal-panel .signal-box").length).toBeGreaterThan(0);
  });

  it("stacks every period when asked for all", () => {
    render(visual, 800, 500, { panel_periods: "all" });
    const texts: string[] = Array.from(svg().querySelectorAll(".signal-panel text"))
                                 .map(t => t.textContent ?? "");
    expect(texts).toContain("PERIODE 1");
    expect(texts).toContain("PERIODE 2");
  });

  it("auto-hides below the width threshold and releases the space", () => {
    render(visual, 400, 500);
    const settings = visual.viewModel.inputSettings.settings[0];

    expect(visual.plotProperties.showSignalPanel).toBe(false);
    expect(visual.plotProperties.xAxis.end_padding).toBe(settings.canvas.right_padding);
    expect(svg().querySelector(".signal-panel")).toBeNull();
  });

  it("keeps wide counts inside the reserved strip", () => {
    // A long daily series pushes the usable-observation count to four
    // digits. The number columns are sized from the settings, so a wide
    // count can only stay inside the panel if the actual digits are taken
    // into account — otherwise it spills past the SVG edge and the overflow
    // check in visual.ts doubles the padding, squashing the plot.
    const longKeys: string[] = Array.from({ length: 1200 }, (_, i) => `d${i}`);
    const longValues: number[] = Array.from({ length: 1200 }, (_, i) => (i % 7) + 10);
    const wideVisual = new Visual({
      element: testDom("500", "800"),
      host: createVisualHost({})
    });
    wideVisual.update({
      dataViews: [ buildDataView({ key: longKeys, numerators: longValues }, settingsWith()) ],
      viewport: { width: 800, height: 500 },
      type: 2 /*powerbi.VisualUpdateType.Data*/
    });

    const stats = wideVisual.viewModel.outliers[0].per_group_stats[0];
    expect(stats.n_useful).toBeGreaterThan(999);

    const settings = wideVisual.viewModel.inputSettings.settings[0];
    const reserved: number = settings.canvas.right_padding + settings.signal_panel.panel_width;
    expect(wideVisual.plotProperties.xAxis.end_padding).toBe(reserved);

    const wideSvg = wideVisual.svg.node() as SVGSVGElement;
    const panel = wideSvg.querySelector(".signal-panel") as SVGGElement;
    const bbox = panel.getBBox();
    expect(bbox.x + bbox.width).toBeLessThanOrEqual(800);
  });

  it("dashes the centerline, and only in the period that signalled", () => {
    // The dashed centerline is the visual's whole point, and nothing else
    // asserted it: it could be removed, or drawn for the wrong period, with
    // every other test still green.
    render(visual, 800, 500);

    const stats = visual.viewModel.outliers[0].per_group_stats;
    const signalling: boolean[] = stats.map(s => s.long_run_signal || s.few_crossings_signal);
    // The fixture is built so exactly one of the two periods signals.
    expect(signalling.filter(Boolean).length).toBe(1);
    const signallingPeriod: number = signalling.indexOf(true);

    // Every centerline segment carries the flag of the period it belongs to.
    // This is what drawLines reads, and an off-by-one in the period cursor
    // would dash the first point of the wrong period without changing counts.
    const bounds = visual.viewModel.groupStartEndIndexes[0];
    const targets = visual.viewModel.groupedLines.find(g => g[0] === "targets")![1];
    expect(targets.length).toBeGreaterThan(0);

    const keyToPeriod = (x: number): number => {
      const idx: number = visual.viewModel.controlLimits[0].keys.findIndex(k => k.x === x);
      return bounds.findIndex(b => idx >= b[0] && idx < b[1]);
    };
    targets.forEach(segment => {
      const period: number = keyToPeriod(segment.x);
      if (period < 0) return;
      expect(segment.group_signal_dashed).toBe(period === signallingPeriod);
    });

    // ... and it reaches the DOM as an actual dashed stroke.
    const dashed = svg().querySelectorAll(".targets-linegroup [stroke-dasharray='4 2']");
    expect(dashed.length).toBeGreaterThan(0);
  });

  it("stops highlighting a signal when its rule is switched off", () => {
    // The centerline stops dashing when a rule is disabled, because the
    // dashing reads the toggle-gated per_group_signals. The panel must agree:
    // a highlighted box is a flag, and a user who switched the rule off asked
    // not to be flagged. Disagreeing surfaces are worse than either choice.
    const off = JSON.parse(JSON.stringify(defaultSettings));
    off.spc.chart_type = "c";
    off.outliers.anhoj_long_run = false;
    off.outliers.anhoj_few_crossings = false;

    const offVisual = new Visual({
      element: testDom("500", "800"),
      host: createVisualHost({})
    });
    offVisual.update({
      dataViews: [ buildDataView({ key: keys, numerators: numerators, groupings: groupings }, off) ],
      viewport: { width: 800, height: 500 },
      type: 2 /*powerbi.VisualUpdateType.Data*/
    });

    // The underlying statistics still say a rule breached — that is the point
    // of showing the counts even with the rules off.
    const stats = offVisual.viewModel.outliers[0].per_group_stats;
    expect(stats.some(s => s.long_run_signal || s.few_crossings_signal)).toBe(true);

    // ... but nothing on screen may claim a signal.
    const offSvg = offVisual.svg.node() as SVGSVGElement;
    const panel = offSvg.querySelector(".signal-panel") as SVGGElement;
    expect(panel).toBeTruthy();
    expect(panel.querySelectorAll(".signal-box").length).toBe(0);

    const dashed = offSvg.querySelectorAll(".targets-linegroup [stroke-dasharray='4 2']");
    expect(dashed.length).toBe(0);
  });

  it("sizes the number columns from the digits, not only from the settings", () => {
    // The column width was derived from the header text and the font size
    // alone, so a large number size overflowed the reserved strip. The
    // overflow check in visual.ts then doubles end_padding and redraws —
    // and at tile widths just above the hide threshold that leaves the plot
    // with an inverted x-range. An earlier version of this test used the
    // default font size, where four digits happen to fit, and so proved
    // nothing.
    const longKeys: string[] = Array.from({ length: 1200 }, (_, i) => `d${i}`);
    const longValues: number[] = Array.from({ length: 1200 }, (_, i) => (i % 7) + 10);
    const bigVisual = new Visual({
      element: testDom("500", "800"),
      host: createVisualHost({})
    });
    const big = settingsWith({ panel_font_size: 40 });
    bigVisual.update({
      dataViews: [ buildDataView({ key: longKeys, numerators: longValues }, big) ],
      viewport: { width: 800, height: 500 },
      type: 2 /*powerbi.VisualUpdateType.Data*/
    });

    expect(bigVisual.viewModel.outliers[0].per_group_stats[0].n_useful).toBeGreaterThan(999);

    const settings = bigVisual.viewModel.inputSettings.settings[0];
    const reserved: number = settings.canvas.right_padding + settings.signal_panel.panel_width;
    // Equality: a doubled padding is exactly the failure this guards.
    expect(bigVisual.plotProperties.xAxis.end_padding).toBe(reserved);

    const bigSvg = bigVisual.svg.node() as SVGSVGElement;
    const panel = bigSvg.querySelector(".signal-panel") as SVGGElement;
    const bbox = panel.getBBox();
    expect(bbox.x + bbox.width).toBeLessThanOrEqual(800);
  });

  it("is removed when switched off", () => {
    render(visual, 800, 500);
    expect(svg().querySelector(".signal-panel")).toBeTruthy();
    render(visual, 800, 500, { show_panel: false });
    expect(svg().querySelector(".signal-panel")).toBeNull();
    expect(visual.plotProperties.xAxis.end_padding)
      .toBe(visual.viewModel.inputSettings.settings[0].canvas.right_padding);
  });

  // afterAll, not inline: a removal in the describe body runs at collection
  // time and the bounding-box checks above need the SVG attached.
  afterAll(() => element.remove());
});
