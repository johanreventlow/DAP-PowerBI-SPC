import { describe, it, expect } from "vitest";
import viewModelClass from "../../src/Classes/viewModelClass";
import type { settingsValueType } from "../../src/settings";
import type derivedSettingsClass from "../../src/Classes/derivedSettingsClass";
import { anhojFixtures } from "../Outlier Flagging/anhojFixtures";

// The signal panel reads outliers.per_group_stats. These lock what it will
// find there: the runs counts per period, and the count of points beyond the
// control limits — which only exists on chart types that have limits.

const baseOutlierSettings = {
  process_flag_type: "both",
  improvement_direction: "increase",
  astronomical: false,
  anhoj_long_run: true,
  anhoj_few_crossings: true
};

function settingsWith(overrides: Record<string, unknown> = {}): settingsValueType {
  return {
    outliers: { ...baseOutlierSettings, ...overrides }
  } as unknown as settingsValueType;
}

function derivedWith(hasControlLimits: boolean, chartType: string = "i"): derivedSettingsClass {
  return {
    chart_type_props: {
      has_control_limits: hasControlLimits,
      name: chartType,
      runs_analysis_applies: chartType !== "mr"
    }
  } as unknown as derivedSettingsClass;
}

describe("flagOutliers — per-group statistics", () => {
  const fx = anhojFixtures.find(f => f.name === "long_run_only")!;
  const values: number[] = fx.values;
  const targets: number[] = values.map(() => fx.centerline_median);
  const groups: number[][] = [[0, values.length]];

  it("carries the runs counts, not just the verdict", () => {
    const vm = new viewModelClass();
    const outliers = vm.flagOutliers(
      { values, targets } as never, groups, settingsWith(), derivedWith(false)
    );

    expect(outliers.per_group_stats.length).toBe(1);
    const stats = outliers.per_group_stats[0];
    expect(stats.n_useful).toBe(fx.stats.n_useful);
    expect(stats.longest_run).toBe(fx.stats.longest_run);
    expect(stats.longest_run_max).toBe(fx.stats.longest_run_max);
    expect(stats.n_crossings).toBe(fx.stats.n_crossings);
    expect(stats.n_crossings_min).toBe(fx.stats.n_crossings_min);
  });

  it("reports no limit count on a chart type without control limits", () => {
    const vm = new viewModelClass();
    const outliers = vm.flagOutliers(
      { values, targets } as never, groups, settingsWith(), derivedWith(false)
    );

    expect(outliers.per_group_stats[0].n_beyond_limits).toBeNull();
    expect(outliers.per_group_stats[0].beyond_limits_signal).toBe(false);
  });

  it("counts points beyond the control limits when the chart has them", () => {
    // Limits chosen so exactly two of the fixture's values fall outside:
    // 13 appears twice and is the series maximum.
    const ll99: number[] = values.map(() => 1);
    const ul99: number[] = values.map(() => 12);
    const vm = new viewModelClass();
    const outliers = vm.flagOutliers(
      { values, targets, ll99, ul99 } as never, groups, settingsWith(), derivedWith(true)
    );

    expect(outliers.per_group_stats[0].n_beyond_limits).toBe(2);
    expect(outliers.per_group_stats[0].beyond_limits_signal).toBe(true);
  });

  it("does not signal when every point sits inside the limits", () => {
    const ll99: number[] = values.map(() => 0);
    const ul99: number[] = values.map(() => 100);
    const vm = new viewModelClass();
    const outliers = vm.flagOutliers(
      { values, targets, ll99, ul99 } as never, groups, settingsWith(), derivedWith(true)
    );

    expect(outliers.per_group_stats[0].n_beyond_limits).toBe(0);
    expect(outliers.per_group_stats[0].beyond_limits_signal).toBe(false);
  });

  // astronomical_limit-dropdownen er væk: flagging sker altid mod 3σ, som
  // qicharts2's sigma.signal. Uden denne ville en ændring tilbage til et
  // opslag i andre grænseniveauer ikke blive fanget.
  it("flager mod 3σ-grænserne", () => {
    const ll99: number[] = values.map(() => 1);
    const ul99: number[] = values.map(() => 12);
    const vm = new viewModelClass();
    const outliers = vm.flagOutliers(
      { values, targets, ll99, ul99 } as never,
      groups, settingsWith({ astronomical: true }), derivedWith(true)
    );

    // Fixturen har 13 to gange, som er de eneste værdier over 12.
    const flagged: number[] = outliers.astpoint
      .map((flag, idx) => flag !== "none" ? values[idx] : NaN)
      .filter(v => !Number.isNaN(v));
    expect(flagged).toEqual([13, 13]);
  });

  it("counts limits independently of the astronomical toggle", () => {
    // The panel's third row is qicharts2's sigma.signal, not the legacy
    // point-flagging rule, so switching that rule off must not blank it.
    const ll99: number[] = values.map(() => 1);
    const ul99: number[] = values.map(() => 12);
    const vm = new viewModelClass();
    const outliers = vm.flagOutliers(
      { values, targets, ll99, ul99 } as never,
      groups, settingsWith({ astronomical: false }), derivedWith(true)
    );

    expect(outliers.per_group_stats[0].n_beyond_limits).toBe(2);
    expect(outliers.astpoint.every(f => f === "none")).toBe(true);
  });

  it("keeps the counts per period in a rebaselined chart", () => {
    const a = anhojFixtures.find(f => f.name === "normal_series")!;
    const b = anhojFixtures.find(f => f.name === "long_run_only")!;
    const allValues: number[] = [...a.values, ...b.values];
    const allTargets: number[] = [
      ...a.values.map(() => a.centerline_median),
      ...b.values.map(() => b.centerline_median)
    ];
    const twoGroups: number[][] = [[0, a.values.length],
                                   [a.values.length, allValues.length]];

    const vm = new viewModelClass();
    const outliers = vm.flagOutliers(
      { values: allValues, targets: allTargets } as never,
      twoGroups, settingsWith(), derivedWith(false)
    );

    expect(outliers.per_group_stats.length).toBe(2);
    expect(outliers.per_group_stats[0].longest_run).toBe(a.stats.longest_run);
    expect(outliers.per_group_stats[1].longest_run).toBe(b.stats.longest_run);
    expect(outliers.per_group_stats[0].long_run_signal).toBe(false);
    expect(outliers.per_group_stats[1].long_run_signal).toBe(true);
  });

  it("still reports the counts when both rules are switched off", () => {
    // Switching the rules off stops the dashing, not the arithmetic — the
    // panel keeps showing how close the series is to a signal.
    const vm = new viewModelClass();
    const outliers = vm.flagOutliers(
      { values, targets } as never, groups,
      settingsWith({ anhoj_long_run: false, anhoj_few_crossings: false }),
      derivedWith(false)
    );

    expect(outliers.per_group_stats[0].longest_run).toBe(fx.stats.longest_run);
    expect(outliers.per_group_signals[0]).toEqual({ long_run: false, few_crossings: false });
  });
});

describe("flagOutliers — degenerate limits", () => {
  // A constant series on an I-chart with the default outliers_in_limits=false
  // screens every moving range out of its own average: all MR are 0, the
  // screening bound is 0, nothing is below it, and the average becomes 0/0.
  // The limits are then NaN, and `between` reports NaN-bounded values as
  // outside — so a series with no variation at all was counted as entirely
  // out of control, in 25px digits.
  const values: number[] = new Array<number>(10).fill(42);
  const targets: number[] = new Array<number>(10).fill(42);
  const groups: number[][] = [[0, 10]];
  const nan: number[] = new Array<number>(10).fill(NaN);

  it("counts nothing beyond limits that are not real numbers", () => {
    const vm = new viewModelClass();
    const outliers = vm.flagOutliers(
      { values, targets, ll99: nan, ul99: nan } as never,
      groups, settingsWith(), derivedWith(true)
    );

    expect(outliers.per_group_stats[0].n_beyond_limits).toBe(0);
    expect(outliers.per_group_stats[0].beyond_limits_signal).toBe(false);
  });

  it("still counts against limits that are real", () => {
    const mixed: number[] = [...new Array<number>(5).fill(NaN), ...new Array<number>(5).fill(41)];
    const vm = new viewModelClass();
    const outliers = vm.flagOutliers(
      { values, targets, ll99: new Array<number>(10).fill(0), ul99: mixed } as never,
      groups, settingsWith(), derivedWith(true)
    );

    // Only the five points with a real upper limit of 41 can breach it.
    expect(outliers.per_group_stats[0].n_beyond_limits).toBe(5);
  });
});

describe("flagOutliers — moving-range charts", () => {
  // qicharts2 forces runs.signal FALSE for chart == 'mr'. Consecutive moving
  // ranges share a data point, so they are autocorrelated by construction and
  // the runs analysis assumption of independence does not hold. The counts are
  // still computed and shown; only the verdict is withheld.
  const fx = anhojFixtures.find(f => f.name === "long_run_only")!;
  const targets: number[] = fx.values.map(() => fx.centerline_median);
  const groups: number[][] = [[0, fx.values.length]];

  it("withholds the runs signals", () => {
    const vm = new viewModelClass();
    const outliers = vm.flagOutliers(
      { values: fx.values, targets } as never,
      groups, settingsWith(), derivedWith(false, "mr")
    );

    expect(outliers.per_group_signals[0]).toEqual({ long_run: false, few_crossings: false });
    expect(outliers.per_group_stats[0].long_run_signal).toBe(false);
    expect(outliers.per_group_stats[0].few_crossings_signal).toBe(false);
  });

  it("still reports the counts, so the panel can show them", () => {
    const vm = new viewModelClass();
    const outliers = vm.flagOutliers(
      { values: fx.values, targets } as never,
      groups, settingsWith(), derivedWith(false, "mr")
    );

    expect(outliers.per_group_stats[0].longest_run).toBe(fx.stats.longest_run);
    expect(outliers.per_group_stats[0].n_crossings).toBe(fx.stats.n_crossings);
  });

  it("does not withhold them on other chart types", () => {
    const vm = new viewModelClass();
    const outliers = vm.flagOutliers(
      { values: fx.values, targets } as never,
      groups, settingsWith(), derivedWith(false, "i")
    );

    expect(outliers.per_group_signals[0].long_run).toBe(true);
  });
});
