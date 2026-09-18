import type { settingsValueType } from "../settings"

// Navnet på det, en observation er, per diagramtype. Bruges som etiket i
// tooltippet, når brugeren ikke selv har skrevet en.
const valueNames: Record<string, string> = {
  "i": "Værdi",
  "ip": "Værdi",
  "i_m": "Værdi",
  "i_mm": "Værdi",
  "c": "Antal",
  "t": "Tid",
  "xbar": "Gruppegennemsnit",
  "s": "Gruppe-SD",
  "g": "Enheder mellem hændelser",
  "run": "Værdi",
  "mr": "Variationsbredde",
  "p": "Andel",
  "pp": "Andel",
  "u": "Rate",
  "up": "Rate"
}

export default class derivedSettingsClass {
  multiplier: number
  percentLabels: boolean
  chart_type_props: {
    name: string,
    needs_denominator: boolean,
    denominator_optional: boolean,
    numerator_non_negative: boolean,
    numerator_leq_denominator: boolean,
    has_control_limits: boolean,
    runs_analysis_applies: boolean,
    needs_sd: boolean,
    integer_num_den: boolean,
    value_name: string,
    x_axis_use_date: boolean,
    date_name: string,
    denominator_gt_one: boolean,
    denominator_positive: boolean
  }

  constructor(inputSettingsSpc: settingsValueType["spc"]) {
    const chartType: string = inputSettingsSpc.chart_type;
    const pChartType: boolean = ["p", "pp"].includes(chartType);
    const percentSettingString: string = inputSettingsSpc.perc_labels;
    let multiplier: number = inputSettingsSpc.multiplier;
    let percentLabels: boolean;

    if (percentSettingString === "Yes") {
      multiplier = 100
    }

    if (pChartType && percentSettingString !== "No") {
      multiplier = multiplier === 1 ? 100 : multiplier
    }

    if (percentSettingString === "Automatic") {
      percentLabels = pChartType && multiplier === 100;
    } else {
      percentLabels = percentSettingString === "Yes";
    }

    this.chart_type_props = {
      name: chartType,
      needs_denominator: ["p", "pp", "u", "up", "xbar", "s"].includes(chartType),
      denominator_optional: ["i", "ip", "i_m", "i_mm", "run", "mr"].includes(chartType),
      numerator_non_negative: ["p", "pp", "u", "up", "s", "c", "g", "t"].includes(chartType),
      numerator_leq_denominator: ["p", "pp"].includes(chartType),
      has_control_limits: !(["run"].includes(chartType)),
      // Moving ranges share a data point with their neighbour and are
      // autocorrelated by construction, so a runs analysis of them is not
      // meaningful. qicharts2 suppresses the runs signal for these charts.
      runs_analysis_applies: !(["mr"].includes(chartType)),
      needs_sd: ["xbar"].includes(chartType),
      integer_num_den: ["c", "p", "pp"].includes(chartType),
      value_name: valueNames[chartType],
      x_axis_use_date: !(["g", "t"].includes(chartType)),
      date_name: !(["g", "t"].includes(chartType)) ? "Dato" : "Hændelse",
      denominator_gt_one: ["xbar", "s"].includes(chartType),
      // I′ deler med √d_i, så en nævner på 0 (eller negativ/uendelig) giver
      // ingen meningsfuld grænse. Kun ip — andre typers validering er uændret.
      denominator_positive: ["ip"].includes(chartType)
    }

    this.multiplier = multiplier
    this.percentLabels = percentLabels
  }
}
