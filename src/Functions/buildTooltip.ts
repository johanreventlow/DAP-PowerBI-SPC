import type powerbi from "powerbi-visuals-api";
type VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
import type { settingsValueType } from "../settings";
import type derivedSettingsClass from "../Classes/derivedSettingsClass";
import isNullOrUndefined from "./isNullOrUndefined";
import valueFormatter from "./valueFormatter";
import type { summaryTableRowData } from "../Classes/viewModelClass";

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
                                      derivedSettings: derivedSettingsClass): VisualTooltipDataItem[] {

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
    ["95", "99"].forEach(limit => {
      if (inputSettings.lines[`ttip_show_${limit}` as LinesKeys] && inputSettings.lines[`show_${limit}` as LinesKeys]) {
        tooltip.push({
          displayName: `${inputSettings.lines[`ttip_label_${limit}_prefix_lower` as LinesKeys]}${inputSettings.lines[`ttip_label_${limit}` as LinesKeys]}`,
          value: formatValues(table_row[`ll${limit}` as keyof summaryTableRowData], "value")
        })
      }
    })
  }

  if (table_row.astpoint !== "none") {
    const patterns: string[] = new Array<string>();
    if (table_row.astpoint !== "none") {
      // Note if flagged according to non-default limit
      patterns.push("Astronomical Point")
    }
    tooltip.push({
      displayName: "Pattern(s)",
      value: patterns.join("\n")
    })
  }

  if (!isNullOrUndefined(inputTooltips) && inputTooltips.length > 0) {
    inputTooltips.forEach(customTooltip => tooltip.push(customTooltip))
  }

  return tooltip;
}
