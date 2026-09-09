import { describe, it, expect } from "vitest";
import { splitPanelLabel, buildSignalPanelRows, buildSignalPanelBlocks } from "../../src/Functions/signalPanelRows";
import type { groupStatsObject } from "../../src/Classes/viewModelClass";
import type { settingsValueType } from "../../src/settings";
import settingsModel from "../../src/settings";

// The panel's rows are derived without a DOM so the table logic can be
// pinned here; drawSignalPanel only positions what these functions return.

type panelSettings = settingsValueType["signal_panel"];

function panelSettingsWith(overrides: Partial<panelSettings> = {}): panelSettings {
  return { ...settingsModel.defaultValues.signal_panel, ...overrides };
}

function statsWith(overrides: Partial<groupStatsObject> = {}): groupStatsObject {
  return {
    n_useful: 18,
    longest_run: 9,
    n_crossings: 2,
    longest_run_max: 7,
    n_crossings_min: 5,
    long_run_signal: true,
    few_crossings_signal: true,
    n_beyond_limits: null,
    beyond_limits_signal: false,
    ...overrides
  };
}

describe("splitPanelLabel", () => {
  it("breaks in front of a parenthesised qualifier and upper-cases", () => {
    expect(splitPanelLabel("Serielængde (maksimum)")).toEqual(["SERIELÆNGDE", "(MAKSIMUM)"]);
    expect(splitPanelLabel("Antal kryds (minimum)")).toEqual(["ANTAL KRYDS", "(MINIMUM)"]);
  });

  it("breaks a plain label at the space nearest the middle, later on ties", () => {
    expect(splitPanelLabel("Obs. uden for kontrolgrænse")).toEqual(["OBS. UDEN FOR", "KONTROLGRÆNSE"]);
    expect(splitPanelLabel("Antal brugbare obs.")).toEqual(["ANTAL BRUGBARE", "OBS."]);
  });

  it("keeps a single word on one line and drops an empty label", () => {
    expect(splitPanelLabel("Kryds")).toEqual(["KRYDS"]);
    expect(splitPanelLabel("   ")).toEqual([]);
  });
});

describe("buildSignalPanelRows", () => {
  it("lists the two runs rules with their thresholds and signal state", () => {
    const rows = buildSignalPanelRows(statsWith(), panelSettingsWith({ panel_show_n_useful: false }));

    expect(rows.length).toBe(2);
    expect(rows[0]).toEqual({
      label: ["SERIELÆNGDE", "(MAKSIMUM)"], expected: "7", actual: "9", signal: true
    });
    expect(rows[1]).toEqual({
      label: ["ANTAL KRYDS", "(MINIMUM)"], expected: "5", actual: "2", signal: true
    });
  });

  it("adds the limits row only when the chart has control limits", () => {
    const withoutLimits = buildSignalPanelRows(statsWith(), panelSettingsWith());
    expect(withoutLimits.map(r => r.label[0])).not.toContain("OBS. UDEN FOR");

    const withLimits = buildSignalPanelRows(
      statsWith({ n_beyond_limits: 1, beyond_limits_signal: true }), panelSettingsWith()
    );
    const limitsRow = withLimits[2];
    expect(limitsRow.label).toEqual(["OBS. UDEN FOR", "KONTROLGRÆNSE"]);
    expect(limitsRow.expected).toBe("0");
    expect(limitsRow.actual).toBe("1");
    expect(limitsRow.signal).toBe(true);
  });

  it("shows the usable-observation count with a dash for the expectation", () => {
    const rows = buildSignalPanelRows(statsWith(), panelSettingsWith({ panel_show_n_useful: true }));
    const last = rows[rows.length - 1];
    expect(last.label).toEqual(["ANTAL BRUGBARE", "OBS."]);
    expect(last.expected).toBe("–");
    expect(last.actual).toBe("18");
    expect(last.signal).toBe(false);
  });

  it("prints dashes and no signal when the runs analysis is undefined", () => {
    const rows = buildSignalPanelRows(statsWith({
      n_useful: 1, longest_run: null, n_crossings: null,
      longest_run_max: null, n_crossings_min: null,
      long_run_signal: false, few_crossings_signal: false
    }), panelSettingsWith());
    expect(rows[0].expected).toBe("–");
    expect(rows[0].actual).toBe("–");
    expect(rows[0].signal).toBe(false);
    expect(rows[1].actual).toBe("–");
  });
});

describe("buildSignalPanelBlocks", () => {
  const periods: groupStatsObject[] = [
    statsWith({ n_useful: 10, longest_run: 3, long_run_signal: false, few_crossings_signal: false }),
    statsWith({ n_useful: 12, longest_run: 4, long_run_signal: false, few_crossings_signal: false }),
    statsWith({ n_useful: 18, longest_run: 9 })
  ];

  it("returns nothing without periods", () => {
    expect(buildSignalPanelBlocks([], panelSettingsWith())).toEqual([]);
  });

  it("shows only the newest period, unheaded when it is the only one", () => {
    const single = buildSignalPanelBlocks([periods[2]], panelSettingsWith({ panel_periods: "newest" }));
    expect(single.length).toBe(1);
    expect(single[0].heading).toBeNull();
    expect(single[0].rows[0].actual).toBe("9");
  });

  it("heads the newest period with its number when there are several", () => {
    const blocks = buildSignalPanelBlocks(periods, panelSettingsWith({ panel_periods: "newest" }));
    expect(blocks.length).toBe(1);
    expect(blocks[0].heading).toBe("PERIODE 3");
    expect(blocks[0].rows[0].actual).toBe("9");
    expect(blocks[0].rows[0].signal).toBe(true);
  });

  it("stacks every period, oldest first, with all", () => {
    const blocks = buildSignalPanelBlocks(periods, panelSettingsWith({ panel_periods: "all" }));
    expect(blocks.map(b => b.heading)).toEqual(["PERIODE 1", "PERIODE 2", "PERIODE 3"]);
    expect(blocks.map(b => b.rows[0].actual)).toEqual(["3", "4", "9"]);
    expect(blocks.map(b => b.rows[0].signal)).toEqual([false, false, true]);
  });

  it("uses the configured period prefix", () => {
    const blocks = buildSignalPanelBlocks(periods, panelSettingsWith({ label_period: "Period" }));
    expect(blocks[0].heading).toBe("PERIOD 3");
  });
});
