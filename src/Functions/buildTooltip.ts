import type powerbi from "powerbi-visuals-api";
type VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
import type { settingsValueType } from "../settings";
import type derivedSettingsClass from "../Classes/derivedSettingsClass";
import isNullOrUndefined from "./isNullOrUndefined";
import valueFormatter from "./valueFormatter";
import type { summaryTableRowData, groupStatsObject } from "../Classes/viewModelClass";

type LinesKeys = keyof settingsValueType["lines"];

/**
 * Builds the tooltip data for a specific index in the chart.
 *
 * @param index - The index of the data point.
 * @param controlLimits - The control limits object.
 * @param outliers - The outliers object.
 * @param inputData - The input data object.
 * @param inputSettings - The input settings object.
 * @param derivedSettings - The derived settings object.
 * @returns An array of VisualTooltipDataItem objects representing the tooltip data.
 */
// ESLint errors due to number of lines in function, but would reduce readability to separate further

export default function buildTooltip(table_row: summaryTableRowData,
                                      inputTooltips: powerbi.extensibility.VisualTooltipDataItem[] | undefined,
                                      inputSettings: settingsValueType,
                                      derivedSettings: derivedSettingsClass,
                                      spc_stats?: groupStatsObject): VisualTooltipDataItem[] {

  const ast_limit: string = inputSettings.outliers.astronomical_limit;
  const formatValues = valueFormatter(inputSettings, derivedSettings);

  const tooltip: VisualTooltipDataItem[] = new Array<VisualTooltipDataItem>();
  if (inputSettings.spc.ttip_show_date) {
    const ttip_label_date: string = inputSettings.spc.ttip_label_date;
    tooltip.push({
      displayName: ttip_label_date === "Automatic" ? derivedSettings.chart_type_props.date_name : ttip_label_date,
      value: table_row.date
    });
  }
  if (inputSettings.spc.ttip_show_value) {
    const ttip_label_value: string = inputSettings.spc.ttip_label_value;
    tooltip.push({
      displayName: ttip_label_value === "Automatic" ? derivedSettings.chart_type_props.value_name : ttip_label_value,
      value: formatValues(table_row.value, "value")
    })
  }
  if(inputSettings.spc.ttip_show_numerator && !isNullOrUndefined(table_row.numerator)) {
    tooltip.push({
      displayName: inputSettings.spc.ttip_label_numerator,
      value: formatValues(table_row.numerator, "integer")
    })
  }
  if(inputSettings.spc.ttip_show_denominator && !isNullOrUndefined(table_row.denominator)) {
    tooltip.push({
      displayName: inputSettings.spc.ttip_label_denominator,
      value: formatValues(table_row.denominator, "integer")
    })
  }
  if (inputSettings.lines.ttip_show_trend && inputSettings.lines.show_trend) {
    tooltip.push({
      displayName: inputSettings.lines.ttip_label_trend,
      value: formatValues(table_row.trend_line, "value")
    })
  }
  if (inputSettings.lines.show_specification && inputSettings.lines.ttip_show_specification) {
    if (!isNullOrUndefined(table_row.speclimits_upper)) {
      tooltip.push({
        displayName: `Upper ${inputSettings.lines.ttip_label_specification}`,
        value: formatValues(table_row.speclimits_upper, "value")
      })
    }
    if (!isNullOrUndefined(table_row.speclimits_lower)) {
      tooltip.push({
        displayName: `Lower ${inputSettings.lines.ttip_label_specification}`,
        value: formatValues(table_row.speclimits_lower, "value")
      })
    }
  }
  if (derivedSettings.chart_type_props.has_control_limits) {
    ["99", "95", "65"].forEach(limit => {
      if (inputSettings.lines[`ttip_show_${limit}` as LinesKeys] && inputSettings.lines[`show_${limit}` as LinesKeys]) {
        tooltip.push({
          displayName: `${inputSettings.lines[`ttip_label_${limit}_prefix_upper` as LinesKeys]}${inputSettings.lines[`ttip_label_${limit}` as LinesKeys]}`,
          value: formatValues(table_row[`ul${limit}` as keyof summaryTableRowData], "value")
        })
      }
    })
  }
  if (inputSettings.lines.show_target && inputSettings.lines.ttip_show_target) {
    tooltip.push({
      displayName: inputSettings.lines.ttip_label_target,
      value: formatValues(table_row.target, "value")
    })
  }
  if (inputSettings.lines.show_alt_target && inputSettings.lines.ttip_show_alt_target && !isNullOrUndefined(table_row.alt_target)) {
    tooltip.push({
      displayName: inputSettings.lines.ttip_label_alt_target,
      value: formatValues(table_row.alt_target, "value")
    })
  }
  if (derivedSettings.chart_type_props.has_control_limits) {
    ["68", "95", "99"].forEach(limit => {
      if (inputSettings.lines[`ttip_show_${limit}` as LinesKeys] && inputSettings.lines[`show_${limit}` as LinesKeys]) {
        tooltip.push({
          displayName: `${inputSettings.lines[`ttip_label_${limit}_prefix_lower` as LinesKeys]}${inputSettings.lines[`ttip_label_${limit}` as LinesKeys]}`,
          value: formatValues(table_row[`ll${limit}` as keyof summaryTableRowData], "value")
        })
      }
    })
  }

  // Points beyond the control limits are the one per-point flag left; the
  // runs rules are series-level and appear as counts below.
  if (table_row.astpoint !== "none") {
    let flag_text: string = "Beyond control limit";
    if (ast_limit !== "3 Sigma") {
      flag_text = `${flag_text} (${ast_limit})`;
    }
    tooltip.push({
      displayName: "Pattern(s)",
      value: flag_text
    })
  }

  // The signal counts for this row's period. The panel shows the same
  // numbers, but auto-hides on a narrow tile — this is then the only way to
  // reach them. Shown whether or not a signal fired: "4 (7 forventet)" says
  // how much room is left, which the absence of a dashed line does not.
  if (inputSettings.signal_panel.ttip_show_signals && !isNullOrUndefined(spc_stats)) {
    const expected: string = inputSettings.signal_panel.ttip_label_expected;
    const withExpectation = (actual: number | null, threshold: number | null): string => {
      return isNullOrUndefined(actual) || isNullOrUndefined(threshold)
        ? "\u2013"
        : `${actual} (${threshold} ${expected})`;
    };

    tooltip.push({
      displayName: inputSettings.signal_panel.label_longest_run,
      value: withExpectation(spc_stats!.longest_run, spc_stats!.longest_run_max)
    });
    tooltip.push({
      displayName: inputSettings.signal_panel.label_crossings,
      value: withExpectation(spc_stats!.n_crossings, spc_stats!.n_crossings_min)
    });
    // Only control charts have limits; on a run chart the row is absent.
    if (!isNullOrUndefined(spc_stats!.n_beyond_limits)) {
      tooltip.push({
        displayName: inputSettings.signal_panel.label_beyond_limits,
        value: withExpectation(spc_stats!.n_beyond_limits, 0)
      });
    }
    if (inputSettings.signal_panel.panel_show_n_useful) {
      tooltip.push({
        displayName: inputSettings.signal_panel.label_n_useful,
        value: `${spc_stats!.n_useful}`
      });
    }
  }

  if (!isNullOrUndefined(inputTooltips) && inputTooltips.length > 0) {
    inputTooltips.forEach(customTooltip => tooltip.push(customTooltip))
  }

  return tooltip;
}
