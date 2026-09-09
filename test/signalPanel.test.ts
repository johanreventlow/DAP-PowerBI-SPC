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
    expect(svg().querySelectorAll(".signal-panel rect").length).toBeGreaterThan(0);
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
