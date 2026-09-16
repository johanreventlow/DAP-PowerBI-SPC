import { describe, it, expect, vi } from "vitest";
import { testDom, createVisualHost } from "powerbi-visuals-utils-testutils";
import { Visual } from "../../src/visual";
import { defaultSettings } from "../../src/settings";
import buildDataView from "../helpers/buildDataView";
import ipLimits from "../../src/Limit Calculations/ip";
import derivedSettingsClass from "../../src/Classes/derivedSettingsClass";
import validateInputData from "../../src/Functions/validateInputData";
import spcSettings from "../../src/Settings Model/spcSettings";
import type { controlLimitsObject, plotData } from "../../src/Classes/viewModelClass";
import fixturesJson from "./ip-fixtures.json";

// Integrationstests for I′ gennem Visual.update(): settings, validering,
// faser, signaler, rendering. Selve aritmetikken er dækket i ip.test.ts.

type fixture = {
  name: string;
  numerators: number[];
  denominators: number[] | null;
  variants: { outliers_in_limits: boolean; cl: number[]; lcl: number[]; ucl: number[];
              sigma_signal: boolean[]; runs_signal: boolean[]; part: number[] }[];
};
const fixtures: fixture[] = (fixturesJson as { fixtures: fixture[] }).fixtures;
const fixtureNamed = (name: string): fixture => fixtures.find(f => f.name === name)!;

function render(input: { numerators: any[], denominators?: any[], groupings?: string[] },
                spc: Record<string, unknown> = {}, updateType: number = 2,
                outliers: Record<string, unknown> = {}) {
  const element = testDom("500", "500");
  const host = createVisualHost({});
  const failed = vi.spyOn(host.eventService, "renderingFailed");
  const visual = new Visual({ element, host });
  const settings = JSON.parse(JSON.stringify(defaultSettings));
  settings.spc = { ...settings.spc, chart_type: "ip", ...spc };
  settings.outliers = { ...settings.outliers, ...outliers };
  const keys: string[] = input.numerators.map((_, i) => String(i + 1));
  visual.update({
    dataViews: [buildDataView({ key: keys, ...input }, settings)],
    viewport: { width: 500, height: 500 },
    type: updateType
  } as any);
  expect(failed).not.toHaveBeenCalled();
  failed.mockRestore();
  return { element, visual, limits: visual.viewModel.controlLimits[0] as controlLimitsObject };
}

function expectNoNaN(element: HTMLElement, visual: Visual): void {
  expect(element.querySelector("svg")!.outerHTML).not.toMatch(/NaN|Infinity/);
  const points = visual.viewModel.plotPoints[0] as plotData[];
  points.forEach(p => {
    const text: string = JSON.stringify([p.tooltip, p.table_row]);
    expect(text).not.toMatch(/NaN|Infinity/);
  });
}

describe("I′ i brugerfladen", () => {
  it("kan vælges i dropdownen med dansk tekst", () => {
    const item = spcSettings.settingsGroups.all.chart_type.items.find(d => d.value === "ip");
    expect(item?.displayName).toBe("i' - Normaliseret individkort (varierende nævner)");
  });

  it("har de forventede chart-egenskaber", () => {
    const props = new derivedSettingsClass({ ...defaultSettings.spc, chart_type: "ip" }).chart_type_props;
    expect(props).toMatchObject({
      needs_denominator: false, denominator_optional: true, numerator_non_negative: false,
      numerator_leq_denominator: false, has_control_limits: true, runs_analysis_applies: true,
      needs_sd: false, integer_num_den: false, x_axis_use_date: true, denominator_gt_one: false,
      denominator_positive: true, value_name: "Observation"
    });
  });

  it("viser ikke procent automatisk, men respekterer manuelt valg og multiplikator", () => {
    const auto = new derivedSettingsClass({ ...defaultSettings.spc, chart_type: "ip", perc_labels: "Automatic" });
    expect(auto.percentLabels).toBe(false);
    expect(auto.multiplier).toBe(1);
    const yes = new derivedSettingsClass({ ...defaultSettings.spc, chart_type: "ip", perc_labels: "Yes" });
    expect(yes.percentLabels).toBe(true);
    expect(yes.multiplier).toBe(100);
    const mult = new derivedSettingsClass({ ...defaultSettings.spc, chart_type: "ip", multiplier: 1000 });
    expect(mult.multiplier).toBe(1000);
  });
});

describe("I′ gennem Visual.update()", () => {
  it("renderer uden nævner med konstante grænser og uden NaN", () => {
    const fx = fixtureNamed("continuous_no_denominator");
    const { element, visual, limits } = render({ numerators: fx.numerators }, { outliers_in_limits: true });
    const v = fx.variants.find(d => d.outliers_in_limits)!;
    for (let i = 0; i < fx.numerators.length; i++) {
      expect(limits.targets[i]).toBeCloseTo(v.cl[i], 10);
      expect(limits.ll99![i]).toBeCloseTo(v.lcl[i], 10);
      expect(limits.ul99![i]).toBeCloseTo(v.ucl[i], 10);
    }
    expect(limits.denominators).toBeUndefined();
    expect(limits.ll99![0]).toBeLessThan(0); // ingen afskæring ved 0
    expectNoNaN(element, visual);
    element.remove();
  });

  it("renderer med varierende nævner: mindre nævner giver bredere grænser", () => {
    const fx = fixtureNamed("proportion_varying_denominator");
    const { element, visual, limits } = render({ numerators: fx.numerators, denominators: fx.denominators! });
    const v = fx.variants.find(d => !d.outliers_in_limits)!; // default: screening til
    const width = (i: number) => (limits.ul99![i] as number) - (limits.targets[i] as number);
    for (let i = 0; i < fx.numerators.length; i++) {
      expect(limits.ul99![i]).toBeCloseTo(v.ucl[i], 10);
      expect(limits.ll99![i]).toBeCloseTo(v.lcl[i], 10);
    }
    // d[6] = 93 er mindst, d[8] = 182 er størst
    expect(width(6)).toBeGreaterThan(width(8));
    expect(width(6) / width(8)).toBeCloseTo(Math.sqrt(182 / 93), 10);
    expectNoNaN(element, visual);
    const table = visual.viewModel.tableColumns[0].map(c => c.name);
    expect(table).toContain("denominator");
    element.remove();
  });

  it("tæller punkter uden for grænserne (sigma.signal) og runs-signal fra fixture", () => {
    const fx = fixtureNamed("extreme_difference");
    [true, false].forEach(keep => {
      // astronomical (punktfarvning) er default fra; tallet i panelet tælles uanset.
      const { element, visual } = render({ numerators: fx.numerators }, { outliers_in_limits: keep }, 2, { astronomical: true });
      const v = fx.variants.find(d => d.outliers_in_limits === keep)!;
      const stats = visual.viewModel.outliers[0].per_group_stats[0];
      expect(stats.n_beyond_limits).toBe(v.sigma_signal.filter(Boolean).length);
      expect(stats.beyond_limits_signal).toBe(true);
      expect(stats.long_run_signal || stats.few_crossings_signal).toBe(v.runs_signal[0]);
      expect(visual.viewModel.outliers[0].astpoint.filter(d => d !== "none").length)
        .toBe(v.sigma_signal.filter(Boolean).length);
      element.remove();
    });
  });

  it("beregner hver fase selvstændigt", () => {
    const fx = fixtureNamed("two_phases");
    const v = fx.variants.find(d => d.outliers_in_limits)!;
    const groupings: string[] = v.part.map(p => `Fase ${p}`);
    const { element, visual, limits } = render(
      { numerators: fx.numerators, denominators: fx.denominators!, groupings },
      { outliers_in_limits: true });
    for (let i = 0; i < fx.numerators.length; i++) {
      expect(limits.targets[i], `cl[${i}]`).toBeCloseTo(v.cl[i], 10);
      expect(limits.ll99![i], `lcl[${i}]`).toBeCloseTo(v.lcl[i], 10);
      expect(limits.ul99![i], `ucl[${i}]`).toBeCloseTo(v.ucl[i], 10);
    }
    expect(limits.targets[0]).not.toBeCloseTo(limits.targets[15] as number, 3);
    expect(visual.viewModel.outliers[0].per_group_stats).toHaveLength(2);
    expectNoNaN(element, visual);
    element.remove();
  });

  it("fryser baseline (fra start og fra slut) og lader senere nævnere styre bredden", () => {
    const numerators: number[] = [10, 12, 11, 13, 12, 14, 30, 9];
    const denominators: number[] = [2, 3, 2, 4, 3, 2, 1, 9];
    (["Start", "End"] as const).forEach(from => {
      const { element, limits } = render({ numerators, denominators },
        { num_points_subset: 4, subset_points_from: from, outliers_in_limits: true });
      const subset: number[] = from === "Start" ? [0, 1, 2, 3] : [4, 5, 6, 7];
      const expected = ipLimits({
        keys: numerators.map((_, i) => ({ x: i, id: i, label: String(i) })),
        numerators, denominators, subset_points: subset, outliers_in_limits: true
      });
      for (let i = 0; i < numerators.length; i++) {
        expect(limits.targets[i]).toBeCloseTo(expected.targets[i] as number, 10);
        expect(limits.ul99![i]).toBeCloseTo(expected.ul99![i] as number, 10);
      }
      element.remove();
    });
  });

  it("skalerer med multiplikator og manuel procent, og respekterer ll_truncate", () => {
    const fx = fixtureNamed("proportion_varying_denominator");
    const v = fx.variants.find(d => !d.outliers_in_limits)!;
    const pct = render({ numerators: fx.numerators, denominators: fx.denominators! }, { perc_labels: "Yes" });
    expect(pct.limits.ul99![0]).toBeCloseTo(v.ucl[0] * 100, 8);
    expect(pct.limits.values[0]).toBeCloseTo(fx.numerators[0] / fx.denominators![0] * 100, 8);
    pct.element.remove();

    const mult = render({ numerators: fx.numerators, denominators: fx.denominators! }, { multiplier: 1000 });
    expect(mult.limits.targets[0]).toBeCloseTo(v.cl[0] * 1000, 8);
    mult.element.remove();

    const cont = fixtureNamed("continuous_no_denominator");
    const trunc = render({ numerators: cont.numerators }, { ll_truncate: 0, outliers_in_limits: true });
    expect(trunc.limits.ll99!.every(d => (d as number) >= 0)).toBe(true);
    expect(trunc.limits.ll99![0]).toBe(0);
    trunc.element.remove();
  });

  it("tegner kontrolgrænsebånd og grænselinjer", () => {
    const fx = fixtureNamed("aggregated_means");
    const { element, visual } = render({ numerators: fx.numerators, denominators: fx.denominators! });
    const lineNames: string[] = (visual.viewModel.groupedLines ?? []).map((d: any) => d[0]);
    expect(lineNames).toContain("ul99");
    expect(lineNames).toContain("ll99");
    element.remove();

    const settings = JSON.parse(JSON.stringify(defaultSettings));
    settings.spc.chart_type = "ip";
    settings.lines.show_band_99 = true;
    const el2 = testDom("500", "500");
    const visual2 = new Visual({ element: el2, host: createVisualHost({}) });
    visual2.update({
      dataViews: [buildDataView({ key: fx.numerators.map((_, i) => String(i)), numerators: fx.numerators, denominators: fx.denominators! }, settings)],
      viewport: { width: 500, height: 500 }, type: 2
    } as any);
    const band = el2.querySelectorAll(".limitbandgroup path");
    expect(band.length).toBe(1);
    expect(band[0].getAttribute("d")).not.toMatch(/NaN/);
    el2.remove();
  });

  it("overlever skift i → ip → run → ip", () => {
    const fx = fixtureNamed("aggregated_means");
    const element = testDom("500", "500");
    const visual = new Visual({ element, host: createVisualHost({}) });
    const show = (chart_type: string, type: number) => {
      const settings = JSON.parse(JSON.stringify(defaultSettings));
      settings.spc.chart_type = chart_type;
      visual.update({
        dataViews: [buildDataView({ key: fx.numerators.map((_, i) => String(i)), numerators: fx.numerators, denominators: fx.denominators! }, settings)],
        viewport: { width: 500, height: 500 }, type
      } as any);
      return visual.viewModel.controlLimits[0];
    };
    const asI = show("i", 2);
    const asIp = show("ip", 62);
    expect(asIp.ul99).toBeDefined();
    expect(asIp.ul99![0]).not.toBeCloseTo(asI.ul99![0] as number, 6); // varierende vs. konstante grænser
    expect(show("run", 2).ul99).toBeUndefined();
    const back = show("ip", 62);
    expect(back.ul99).toBeDefined();
    for (let i = 0; i < fx.numerators.length; i++) {
      expect(back.ul99![i]).toBeCloseTo(asIp.ul99![i] as number, 10);
    }
    expect((visual.viewModel.groupedLines ?? []).map((d: any) => d[0])).toContain("ul99");
    expect(visual.viewModel.inputSettings.settings[0].spc.chart_type).toBe("ip");
    element.remove();
  });
});

describe("I′ nævnervalidering", () => {
  const ipProps = new derivedSettingsClass({ ...defaultSettings.spc, chart_type: "ip" }).chart_type_props;
  const iProps = new derivedSettingsClass({ ...defaultSettings.spc, chart_type: "i" }).chart_type_props;
  const keys: string[] = ["1", "2", "3", "4", "5", "6"];
  const numerators: number[] = [1, 2, 3, 4, 5, 6];

  it("udelader punkter med manglende, ikke-numerisk, nul, negativ eller uendelig nævner", () => {
    const denominators: any[] = [2, undefined, NaN, 0, -1, Infinity];
    const result = validateInputData(keys, numerators, denominators, undefined, ipProps, [0, 1, 2, 3, 4, 5]);
    expect(result.status).toBe(0);
    expect(result.messages).toEqual([
      "", "Nævner mangler", "Nævner er ikke et tal",
      "Nævner skal være større end 0", "Nævner er negativ", "Nævner skal være større end 0"
    ]);
  });

  it("afviser hele serien, når alle nævnere er 0", () => {
    const result = validateInputData(keys, numerators, [0, 0, 0, 0, 0, 0], undefined, ipProps, [0, 1, 2, 3, 4, 5]);
    expect(result.status).toBe(1);
    expect(result.error).toBe("Alle nævnere skal være større end 0.");
  });

  it("ændrer ikke valideringen for i-kortet", () => {
    const result = validateInputData(keys, numerators, [2, 0, 3, Infinity, -1, 4], undefined, iProps, [0, 1, 2, 3, 4, 5]);
    expect(result.messages).toEqual(["", "", "", "", "Nævner er negativ", ""]);
  });

  it("udelader punktet i visualen og viser en dansk advarsel", () => {
    const { element, visual, limits } = render({ numerators: [10, 12, 11, 13, 12], denominators: [2, 0, 2, 3, 2] });
    expect(limits.keys).toHaveLength(4);
    expect(visual.viewModel.inputData[0].warningMessage).toContain("udeladt: Nævner skal være større end 0.");
    expectNoNaN(element, visual);
    element.remove();
  });

  it("viser en samlet fejl, når alle nævnere er ugyldige", () => {
    const element = testDom("500", "500");
    const visual = new Visual({ element, host: createVisualHost({}) });
    const settings = JSON.parse(JSON.stringify(defaultSettings));
    settings.spc.chart_type = "ip";
    visual.update({
      dataViews: [buildDataView({ key: ["1", "2", "3"], numerators: [1, 2, 3], denominators: [0, -2, 0] }, settings)],
      viewport: { width: 500, height: 500 }, type: 2
    } as any);
    const err = element.querySelector(".errormessage text");
    expect(err?.textContent).toBe("Ingen gyldige data fundet.");
    element.remove();
  });
});
