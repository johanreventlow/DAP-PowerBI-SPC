import type { groupStatsObject } from "../Classes/viewModelClass";
import type { settingsValueType } from "../settings";
import isNullOrUndefined from "../Functions/isNullOrUndefined";

/**
 * One line of the signal panel table: a (multi-line) label, the expected
 * threshold, the observed count, and whether the observed count breached
 * the threshold and should be drawn highlighted.
 */
export type signalPanelRow = {
  label: string[];
  expected: string;
  actual: string;
  signal: boolean;
};

/**
 * Which runs rules the user has left switched on. The statistics are computed
 * regardless — the panel shows the counts either way — but a highlight is a
 * flag, and a user who switched a rule off asked not to be flagged. The
 * centerline dashing is gated on the same toggles, so gating here keeps the
 * two surfaces from contradicting each other.
 */
export type runsRulesEnabled = {
  long_run: boolean;
  few_crossings: boolean;
};

/**
 * The rows for one period, with an optional period heading above them.
 */
export type signalPanelBlock = {
  heading: string | null;
  rows: signalPanelRow[];
};

// R's NA is displayed as an en dash, as the tooltip already does.
const DASH: string = "–";

function formatCount(value: number | null): string {
  return isNullOrUndefined(value) ? DASH : `${value}`;
}

/**
 * Split a row label into the lines the panel prints it on, upper-cased.
 *
 * The default labels carry a qualifier in parentheses ("Serielængde
 * (maksimum)"), and the layout puts the qualifier on its own line so the
 * column of labels reads as name-over-qualifier. Labels without a qualifier
 * are broken at the space closest to the middle instead, so every row
 * occupies the same two-line height and the numbers line up. Single words
 * stay on one line.
 *
 * @param label - Row label as entered in the formatting pane
 */
export function splitPanelLabel(label: string): string[] {
  const trimmed: string = label.trim().toUpperCase();
  if (trimmed === "") {
    return [];
  }
  const parenIdx: number = trimmed.indexOf("(");
  if (parenIdx > 0) {
    const head: string = trimmed.slice(0, parenIdx).trim();
    const tail: string = trimmed.slice(parenIdx).trim();
    return head === "" ? [tail] : [head, tail];
  }

  const midpoint: number = trimmed.length / 2;
  let bestIdx: number = -1;
  let bestDist: number = Infinity;
  for (let i: number = 0; i < trimmed.length; i++) {
    if (trimmed[i] !== " ") {
      continue;
    }
    // On a tie prefer the later space, so "Antal brugbare obs." breaks as
    // "ANTAL BRUGBARE / OBS." rather than "ANTAL / BRUGBARE OBS."
    const dist: number = Math.abs(i - midpoint);
    if (dist <= bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }
  if (bestIdx < 0) {
    return [trimmed];
  }
  return [trimmed.slice(0, bestIdx).trim(), trimmed.slice(bestIdx + 1).trim()];
}

/**
 * The rows for one period's statistics, in display order.
 *
 * @param stats - Per-period counts and thresholds from flagOutliers
 * @param settings - The signal_panel settings group
 */
export function buildSignalPanelRows(stats: groupStatsObject,
                                     settings: settingsValueType["signal_panel"],
                                     enabled: runsRulesEnabled): signalPanelRow[] {
  const rows: signalPanelRow[] = [
    {
      label: splitPanelLabel(settings.label_longest_run),
      expected: formatCount(stats.longest_run_max),
      actual: formatCount(stats.longest_run),
      signal: stats.long_run_signal && enabled.long_run
    },
    {
      label: splitPanelLabel(settings.label_crossings),
      expected: formatCount(stats.n_crossings_min),
      actual: formatCount(stats.n_crossings),
      signal: stats.few_crossings_signal && enabled.few_crossings
    }
  ];
  // Only control charts have limits; on a run chart the row is absent
  // rather than showing a dash, matching the tooltip.
  if (!isNullOrUndefined(stats.n_beyond_limits)) {
    rows.push({
      label: splitPanelLabel(settings.label_beyond_limits),
      expected: "0",
      actual: formatCount(stats.n_beyond_limits),
      signal: stats.beyond_limits_signal
    });
  }
  // The usable-observation count has no threshold: the expected cell is a
  // dash so the column stays visually complete.
  if (settings.panel_show_n_useful) {
    rows.push({
      label: splitPanelLabel(settings.label_n_useful),
      expected: DASH,
      actual: formatCount(stats.n_useful),
      signal: false
    });
  }
  return rows;
}

/**
 * The blocks the panel draws, one per period shown. With panel_periods set
 * to "newest" only the last period is shown, and it gets a heading only
 * when there is more than one period — a heading on a single-period chart
 * would say nothing. With "all", every period is shown with its heading.
 *
 * @param perGroupStats - One entry per period, oldest first
 * @param settings - The signal_panel settings group
 */
export function buildSignalPanelBlocks(perGroupStats: readonly groupStatsObject[],
                                       settings: settingsValueType["signal_panel"],
                                       enabled: runsRulesEnabled): signalPanelBlock[] {
  const nPeriods: number = perGroupStats.length;
  if (nPeriods === 0) {
    return [];
  }
  const periodHeading = (idx: number): string => {
    return `${settings.label_period} ${idx + 1}`.trim().toUpperCase();
  };

  if (settings.panel_periods === "all") {
    return perGroupStats.map((stats: groupStatsObject, idx: number) => {
      return { heading: periodHeading(idx), rows: buildSignalPanelRows(stats, settings, enabled) };
    });
  }

  const lastIdx: number = nPeriods - 1;
  return [{
    heading: nPeriods > 1 ? periodHeading(lastIdx) : null,
    rows: buildSignalPanelRows(perGroupStats[lastIdx], settings, enabled)
  }];
}
