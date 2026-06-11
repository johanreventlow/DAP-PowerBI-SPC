import type powerbi from "powerbi-visuals-api";
type IVisualHost = powerbi.extensibility.visual.IVisualHost;
type VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
type VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
type ISelectionId = powerbi.visuals.ISelectionId;
import * as limitFunctions from "../Limit Calculations"
import settingsClass from "./settingsClass";
import { type settingsValueType } from "../settings";
import type derivedSettingsClass from "./derivedSettingsClass";
import buildTooltip from "../Functions/buildTooltip";
import rep from "../Functions/rep";
import type { dataObject } from "../Functions/extractInputData";
import extractInputData from "../Functions/extractInputData";
import isNullOrUndefined from "../Functions/isNullOrUndefined";
import validateDataViewColumns from "../Functions/validateDataViewColumns";
import valueFormatter from "../Functions/valueFormatter";
import calculateTrendLine from "../Functions/calculateTrendLine";
import groupBy from "../Functions/groupBy";
import astronomical from "../Outlier Flagging/astronomical";
import anhojLongRun from "../Outlier Flagging/anhojLongRun";
import anhojFewCrossings from "../Outlier Flagging/anhojFewCrossings";
import { lineNameMap } from "../Functions/getAesthetic";
import isValidNumber from "../Functions/isValidNumber";
import { default as updateOptionsUndefined, UpdateOptionsValidTypes } from "../Functions/updateOptionsUndefined";

type LineSettingsKeys = keyof settingsValueType["lines"];

export type viewModelValidationT = {
  status: boolean,
  error?: string,
  warning?: string,
  type?: string
}

export type lineData = {
  x: number;
  line_value: number | undefined;
  group: string;
  aesthetics: settingsValueType["lines"];
  // Per-segment Anhøj signal flag. When true and group === "targets", the
  // centerline segment is rendered dashed to indicate non-random variation
  // in this segment's data group.
  group_signal_dashed?: boolean;
}

export type summaryTableRowData = {
  date: string;
  numerator: number | undefined;
  denominator: number | undefined;
  value: number;
  target: number | undefined;
  alt_target: number | undefined;
  ll99: number | undefined;
  ll95: number | undefined;
  ul95: number | undefined;
  ul99: number | undefined;
  trend_line: number | undefined;
  astpoint: string;
}

export type summaryTableRowDataGrouped = {
  [key: string]: any;

  latest_date: string;
  value: number;
  target: number;
  alt_target: number;
  ucl99: number;
  ucl95: number;
  lcl95: number;
  lcl99: number;
}

export type plotData = {
  x: number;
  value: number;
  aesthetics: settingsValueType["scatter"];
  table_row: summaryTableRowData;
  // ISelectionId allows the visual to report the selection choice to PowerBI
  identity: ISelectionId;
  // Flag for whether dot should be highlighted by selections in other charts
  highlighted: boolean;
  // Tooltip data to print
  tooltip: VisualTooltipDataItem[];
  label: {
    text_value: string | undefined,
    aesthetics: settingsValueType["labels"],
    angle: number | undefined,
    distance: number | undefined,
    line_offset: number | undefined,
    marker_offset: number | undefined
  };
}

export type plotDataGrouped = {
  table_row: summaryTableRowDataGrouped;
  identity: ISelectionId[];
  aesthetics: settingsValueType["summary_table"];
  highlighted: boolean;
}

export type controlLimitsObject = {
  keys: { x: number, id: number, label: string }[];
  values: number[];
  numerators?: (number | undefined)[];
  denominators?: (number | undefined)[];
  targets: (number | undefined)[];
  ll99?: (number | undefined)[];
  ll95?: (number | undefined)[];
  ul95?: (number | undefined)[];
  ul99?: (number | undefined)[];
  count?: (number | undefined)[];
  alt_targets?: (number | undefined)[];
  trend_line?: (number | undefined)[];
};

export type controlLimitsArgs = {
  keys: { x: number, id: number, label: string }[];
  numerators: number[];
  denominators?: number[];
  xbar_sds?: number[];
  outliers_in_limits?: boolean;
  subset_points: number[];
}

export type outliersObject = {
  astpoint: string[];
  // One entry per data-group (baseline-split). Order matches
  // groupStartEndIndexes for the same indicator.
  per_group_signals: { long_run: boolean; few_crossings: boolean }[];
}

export type colourPaletteType = {
  isHighContrast: boolean,
  foregroundColour: string,
  backgroundColour: string,
  foregroundSelectedColour: string,
  hyperlinkColour: string
};

export default class viewModelClass {
  inputData: dataObject[];
  inputSettings: settingsClass;
  controlLimits: controlLimitsObject[];
  outliers: outliersObject[];
  plotPoints: (plotData[] | plotDataGrouped[])[];
  groupedLines: [string, lineData[]][];
  tickLabels: { x: number; label: string; }[];
  splitIndexes: number[];
  groupStartEndIndexes: number[][][];
  firstRun: boolean;
  colourPalette: colourPaletteType;
  tableColumns: { name: string; label: string; }[][];
  svgWidth: number;
  svgHeight: number;
  headless: boolean;
  frontend: boolean;

  indicatorVarNames: string[];
  groupNames: string[][];
  identities: ISelectionId[][];

  get showGrouped(): boolean {
    return this.inputData && this.inputData.length > 1;
  }

  constructor() {
    this.inputData = new Array<dataObject>();
    this.inputSettings = new settingsClass();
    this.controlLimits = new Array<controlLimitsObject>();
    this.outliers = new Array<outliersObject>();
    this.plotPoints = new Array<plotData[] | plotDataGrouped[]>();
    this.groupedLines = new Array<[string, lineData[]]>();
    this.firstRun = true
    this.splitIndexes = new Array<number>();
    this.groupStartEndIndexes = new Array<number[][]>();
    this.identities = new Array<ISelectionId[]>();
    this.tableColumns = new Array<{ name: string; label: string; }[]>();
    this.colourPalette = {} as colourPaletteType;
    this.headless = false;
    this.frontend = false;
    this.tickLabels = [];
    this.svgWidth = 0;
    this.svgHeight = 0;
    this.indicatorVarNames = [];
    this.groupNames = [];
  }

  update(options: VisualUpdateOptions, host: IVisualHost): viewModelValidationT {
    const updateOptionsStatus: UpdateOptionsValidTypes = updateOptionsUndefined(options);
    if (updateOptionsStatus === UpdateOptionsValidTypes.Undefined) {
      return { status: false, error: "" }
    } else if (updateOptionsStatus === UpdateOptionsValidTypes.MissingNumerators) {
      return { status: false, error: "No Numerators passed!" }
    }
    if (isNullOrUndefined(this.colourPalette)) {
      this.colourPalette = {
        isHighContrast: host.colorPalette.isHighContrast,
        foregroundColour: host.colorPalette.foreground.value,
        backgroundColour: host.colorPalette.background.value,
        foregroundSelectedColour: host.colorPalette.foregroundSelected.value,
        hyperlinkColour: host.colorPalette.hyperlink.value
      }
    }

    this.svgWidth = options.viewport.width;
    this.svgHeight = options.viewport.height;
    this.headless = (options as VisualUpdateOptions & { headless?: boolean })?.headless ?? false;
    this.frontend = (options as VisualUpdateOptions & { frontend?: boolean })?.frontend ?? false;

    const indicator_cols: powerbi.DataViewCategoryColumn[] = options.dataViews[0]?.categorical?.categories?.filter(d => d.source.roles!.indicator) ?? [];
    this.indicatorVarNames = indicator_cols?.map(d => d.source.displayName) ?? [];

    const n_indicators: number = indicator_cols?.length;
    const n_values: number = options.dataViews[0]?.categorical?.categories?.[0]?.values?.length ?? 1;
    const res: viewModelValidationT = { status: true };
    const idx_per_indicator = new Array<number[]>();
    idx_per_indicator.push([0]);
    this.groupNames = new Array<string[]>();
    this.groupNames.push(indicator_cols?.map(d => <string>d.values[0]) ?? []);
    let curr_grp: number = 0;

    for (let i = 1; i < n_values; i++) {
      let same_indicator: boolean = true;
      for (let j = 0; j < n_indicators; j++) {
        same_indicator = same_indicator && (indicator_cols?.[j].values[i] === indicator_cols?.[j].values[i-1]);
      }

      if (same_indicator) {
        idx_per_indicator[curr_grp].push(i);
      } else {
        idx_per_indicator.push([i]);
        this.groupNames.push(indicator_cols?.map(d => <string>d.values[i]) ?? []);
        curr_grp += 1;
      }
    }

    if (options.type === 2 || this.firstRun) {
      this.inputSettings.update(options.dataViews[0], idx_per_indicator);
    }
    if (this.inputSettings.validationStatus.error !== "") {
      res.status = false;
      res.error = this.inputSettings.validationStatus.error;
      res.type = "settings";
      return res;
    }
    const checkDV: string = validateDataViewColumns(options.dataViews, this.inputSettings);
    if (checkDV !== "valid") {
      res.status = false;
      res.error = checkDV;
      return res;
    }

    let invalidData: boolean = false;

    // Only re-construct data and re-calculate limits if they have changed
    if (options.type === 2 || this.firstRun) {
      // Handle split indexes (only for first indicator in single mode)
      const hasIndicator: boolean = options.dataViews[0].categorical!.categories!.some(d => d.source.roles!.indicator);
      const split_indexes_str: string = <string>(options.dataViews[0]?.metadata?.objects?.split_indexes_storage?.split_indexes) ?? "[]";
      const split_indexes: number[] = JSON.parse(split_indexes_str);
      this.splitIndexes = hasIndicator ? [] : split_indexes;

      // Initialize arrays
      this.inputData = new Array<dataObject>();
      this.groupStartEndIndexes = new Array<number[][]>();
      this.controlLimits = new Array<controlLimitsObject>();
      this.outliers = new Array<outliersObject>();
      this.identities = new Array<ISelectionId[]>();
      this.tableColumns = new Array<{ name: string; label: string; }[]>();

      // Loop through each indicator group
      idx_per_indicator.forEach((group_idxs, idx) => {
        // Determine which settings to use
        const settings = this.inputSettings.settings[idx];
        const derivedSettings = this.inputSettings.derivedSettings[idx];

        // Extract data for this indicator
        const inpData: dataObject = extractInputData(
          options.dataViews[0].categorical!,
          settings,
          derivedSettings,
          this.inputSettings.validationStatus.messages,
          group_idxs
        );
        this.inputData.push(inpData);

        if (inpData.validationStatus.status !== 0) {
          invalidData = true;
          return;
        }

        const groupStartEnd: number[][] = this.getGroupingIndexes(inpData, idx === 0 ? this.splitIndexes : undefined);
        const limits: controlLimitsObject = this.calculateLimits(inpData, groupStartEnd, settings);
        const outliers: outliersObject = this.flagOutliers(limits, groupStartEnd, settings, derivedSettings);
        this.scaleAndTruncateLimits(limits, settings, derivedSettings);

        // Create selection identities
        const identities = group_idxs.map(i => {
          return host.createSelectionIdBuilder()
            .withCategory(options.dataViews[0].categorical!.categories![0], i)
            .createSelectionId();
        });

        // Push to arrays
        this.groupStartEndIndexes.push(groupStartEnd);
        this.controlLimits.push(limits);
        this.outliers.push(outliers);
        this.identities.push(identities);
      });

      if (!invalidData) {
        // Initialize plot data based on mode
        if (this.showGrouped) {
          this.initialisePlotDataGrouped();
        } else {
          this.initialisePlotData(host);
          this.initialiseGroupedLines();
        }
      }
    }

    this.firstRun = false;

    // Validation (unified for all indicators)
    if (invalidData) {
      res.status = false;
      res.error = this.inputData
        .filter(d => d.validationStatus.status !== 0)
        .map(d => d.validationStatus.error)
        .join("\n");
      return res;
    }

    if (this.inputData.some(d => d.warningMessage !== "")) {
      res.warning = this.inputData
        .filter(d => d.warningMessage !== "")
        .map(d => d.warningMessage)
        .join("\n");
    }

    return res;
  }

  getGroupingIndexes(inputData: dataObject, splitIndexes?: number[]): number[][] {
    const allIndexes: number[] = (splitIndexes ?? [])
                                    .concat([-1])
                                    .concat(inputData.groupingIndexes ?? [])
                                    .concat([inputData.limitInputArgs.keys.length - 1])
                                    .filter((d, idx, arr) => arr.indexOf(d) === idx)
                                    .sort((a,b) => a - b);

    const groupStartEndIndexes = new Array<number[]>();
    for (let i: number = 0; i < allIndexes.length - 1; i++) {
      groupStartEndIndexes.push([allIndexes[i] + 1, allIndexes[i + 1] + 1])
    }
    return groupStartEndIndexes;
  }

  calculateLimits(inputData: dataObject, groupStartEndIndexes: number[][], inputSettings: settingsValueType): controlLimitsObject {
    const limitFunction: (args: controlLimitsArgs) => controlLimitsObject
      = limitFunctions[inputSettings.spc.chart_type as keyof typeof limitFunctions];

    inputData.limitInputArgs.outliers_in_limits = inputSettings.spc.outliers_in_limits;
    let controlLimits: controlLimitsObject;
    if (groupStartEndIndexes.length > 1) {
      const groupedData: dataObject[] = groupStartEndIndexes.map((indexes) => {
        // Force a deep copy
        let data: dataObject = JSON.parse(JSON.stringify(inputData));
        let limitKeys: Exclude<(keyof controlLimitsArgs), "outliers_in_limits">[] = Object.keys(data.limitInputArgs) as Exclude<(keyof controlLimitsArgs), "outliers_in_limits">[];
        limitKeys.forEach(key => {
          if (Array.isArray(data.limitInputArgs[key])) {
            const groupVal = data.limitInputArgs[key].slice(indexes[0], indexes[1]);
            (data.limitInputArgs[key] as typeof groupVal) = groupVal;
            // Special case for subset points - need to re-index so that
            //   the indexes are relative to the new subset
            if (key === "subset_points") {
              data.limitInputArgs[key] = (data.limitInputArgs[key] as number[]).map((d: number) => d - indexes[0]);
            }
          }
        });
        return data;
      })

      const calcLimitsGrouped: controlLimitsObject[] = groupedData.map(d => {
        const currLimits = limitFunction(d.limitInputArgs);
        currLimits.trend_line = calculateTrendLine(currLimits.values);
        return currLimits;
      });

      controlLimits = calcLimitsGrouped.reduce((all: controlLimitsObject, curr: controlLimitsObject) => {
        const allInner: controlLimitsObject = all;
        Object.entries(all).forEach((entry, idx) => {
          if (isNullOrUndefined(entry[1])) {
            return;
          }
          const newValues = entry[1].concat(Object.entries(curr)[idx][1]);
          (allInner[entry[0] as keyof controlLimitsObject] as typeof newValues) = newValues;
        })
        return allInner;
      })
    } else {
      // Calculate control limits using user-specified type
      controlLimits = limitFunction(inputData.limitInputArgs);
      controlLimits.trend_line = calculateTrendLine(controlLimits.values);
    }

    controlLimits.alt_targets = inputData.alt_targets;

    for (const key in controlLimits) {
      const keyTyped: keyof controlLimitsObject = key as keyof controlLimitsObject;
      if (keyTyped === "keys" || keyTyped == "values" || isNullOrUndefined(controlLimits[keyTyped])) {
        continue;
      }
      controlLimits[keyTyped] = controlLimits[keyTyped].map(d => !isValidNumber(d) ? undefined : d);
    }

    return controlLimits;
  }

  initialisePlotDataGrouped(): void {
    this.plotPoints = new Array<plotDataGrouped[]>();
    this.tableColumns = new Array<{ name: string; label: string; }[]>();

    // Build table column definitions
    const tableColumnsDef = new Array<{ name: string; label: string; }>();
    this.indicatorVarNames.forEach(indicator_name => {
      tableColumnsDef.push({ name: indicator_name, label: indicator_name });
    })
    tableColumnsDef.push({ name: "latest_date", label: "Latest Date" });

    const lineSettings = this.inputSettings.settings[0].lines;
    if (lineSettings.show_main) {
      tableColumnsDef.push({ name: "value", label: "Value" });
    }
    if (this.inputSettings.settings[0].spc.ttip_show_numerator) {
      tableColumnsDef.push({ name: "numerator", label: "Numerator" });
    }
    if (this.inputSettings.settings[0].spc.ttip_show_denominator) {
      tableColumnsDef.push({ name: "denominator", label: "Denominator" });
    }
    if (lineSettings.show_target) {
      tableColumnsDef.push({ name: "target", label: lineSettings.ttip_label_target });
    }
    if (lineSettings.show_alt_target) {
      tableColumnsDef.push({ name: "alt_target", label: lineSettings.ttip_label_alt_target });
    }
    ["99", "95"].forEach(limit => {
      if (lineSettings[`show_${limit}` as LineSettingsKeys]) {
        tableColumnsDef.push({
          name: `ucl${limit}`,
          label: `${lineSettings[`ttip_label_${limit}_prefix_upper` as LineSettingsKeys]}${lineSettings[`ttip_label_${limit}` as LineSettingsKeys]}`
        })
      }
    });
    ["95", "99"].forEach(limit => {
      if (lineSettings[`show_${limit}` as LineSettingsKeys]) {
        tableColumnsDef.push({
          name: `lcl${limit}`,
          label: `${lineSettings[`ttip_label_${limit}_prefix_lower` as LineSettingsKeys]}${lineSettings[`ttip_label_${limit}` as LineSettingsKeys]}`
        })
      }
    })
    const anyTooltips: boolean = this.inputData.some(d => d?.tooltips?.some(t => t.length > 0));

    if (anyTooltips) {
      this.inputData?.[0].tooltips?.[0].forEach(tooltip => {
        tableColumnsDef.push({ name: tooltip.displayName, label: tooltip.displayName });
      })
    }

    // Process each indicator group
    for (let i: number = 0; i < this.groupNames.length; i++) {
      // Skip if no data for this group
      if (isNullOrUndefined(this.inputData[i]?.categories)) {
        continue;
      }
      const formatValues = valueFormatter(this.inputSettings.settings[i], this.inputSettings.derivedSettings[i]);
      const limits: controlLimitsObject = this.controlLimits[i];
      if (!limits) {
        continue;
      }
      const lastIndex: number = limits.keys.length - 1;
      const table_row_entries: [string, string | number][] = new Array<[string, string | number]>();
      this.indicatorVarNames.forEach((indicator_name, idx) => {
        table_row_entries.push([indicator_name, this.groupNames[i][idx]]);
      })
      table_row_entries.push(["latest_date", limits.keys?.[lastIndex].label]);
      table_row_entries.push(["value", formatValues(limits.values?.[lastIndex], "value")]);
      table_row_entries.push(["numerator", formatValues(limits.numerators?.[lastIndex], "integer")]);
      table_row_entries.push(["denominator", formatValues(limits.denominators?.[lastIndex], "integer")]);
      table_row_entries.push(["target", formatValues(limits.targets?.[lastIndex], "value")]);
      table_row_entries.push(["alt_target", formatValues(limits.alt_targets?.[lastIndex], "value")]);
      table_row_entries.push(["ucl99", formatValues(limits.ul99?.[lastIndex], "value")]);
      table_row_entries.push(["ucl95", formatValues(limits.ul95?.[lastIndex], "value")]);
      table_row_entries.push(["lcl95", formatValues(limits.ll95?.[lastIndex], "value")]);
      table_row_entries.push(["lcl99", formatValues(limits.ll99?.[lastIndex], "value")]);

      if (anyTooltips && !isNullOrUndefined(this.inputData[i].tooltips)) {
        this.inputData[i].tooltips![lastIndex].forEach(tooltip => {
          table_row_entries.push([tooltip.displayName, tooltip.value]);
        })
      }

      if (!this.plotPoints[i]) {
        this.plotPoints[i] = [];
      }

      (this.plotPoints[i] as plotDataGrouped[]).push({
        table_row: Object.fromEntries(table_row_entries) as summaryTableRowDataGrouped,
        identity: this.identities[i],
        aesthetics: this.inputSettings.settings[i].summary_table,
        highlighted: this.inputData[i].anyHighlights
      })

      this.tableColumns[i] = tableColumnsDef;
    }
  }

  initialisePlotData(host: IVisualHost): void {
    // Use first (and only) indicator data
    const inputData = this.inputData[0];
    const controlLimits = this.controlLimits[0];
    const outliers = this.outliers[0];
    const settings = this.inputSettings.settings[0];
    const derivedSettings = this.inputSettings.derivedSettings[0];

    this.plotPoints[0] = new Array<plotData>();
    this.tickLabels = new Array<{ x: number; label: string; }>();
    this.tableColumns[0] = new Array<{ name: string; label: string; }>();

    this.tableColumns[0].push({ name: "date", label: "Date" });
    this.tableColumns[0].push({ name: "value", label: "Value" });

    if (!controlLimits) {
      return;
    }

    if (!isNullOrUndefined(controlLimits.numerators)) {
      this.tableColumns[0].push({ name: "numerator", label: "Numerator" });
    }
    if (!isNullOrUndefined(controlLimits.denominators)) {
      this.tableColumns[0].push({ name: "denominator", label: "Denominator" });
    }
    if (settings.lines.show_target) {
      this.tableColumns[0].push({ name: "target", label: "Target" });
    }
    if (settings.lines.show_alt_target) {
      this.tableColumns[0].push({ name: "alt_target", label: "Alt. Target" });
    }
    if (settings.lines.show_trend) {
      this.tableColumns[0].push({ name: "trend_line", label: "Trend Line" });
    }
    if (derivedSettings.chart_type_props.has_control_limits) {
      if (settings.lines.show_99) {
        this.tableColumns[0].push({ name: "ll99", label: "LL 99%" },
                               { name: "ul99", label: "UL 99%" });
      }
      if (settings.lines.show_95) {
        this.tableColumns[0].push({ name: "ll95", label: "LL 95%" }, { name: "ul95", label: "UL 95%" });
      }
    }

    if (settings.outliers.astronomical) {
      this.tableColumns[0].push({ name: "astpoint", label: "Ast. Point" });
    }

    for (let i: number = 0; i < controlLimits.keys.length; i++) {
      const index: number = controlLimits.keys[i].x;
      const aesthetics: settingsValueType["scatter"] = inputData.scatter_formatting[i];
      if (this.colourPalette.isHighContrast) {
        aesthetics.colour = this.colourPalette.foregroundColour;
      }
      if (outliers.astpoint[i] !== "none") {
        // Én farve for alle astronomical-punkter uanset retning (qicharts2-paritet)
        aesthetics.colour = settings.outliers.ast_colour;
        aesthetics.colour_outline = settings.outliers.ast_colour;
      }
      const table_row: summaryTableRowData = {
        date: controlLimits.keys[i].label,
        numerator: controlLimits.numerators?.[i],
        denominator: controlLimits.denominators?.[i],
        value: controlLimits.values[i],
        target: controlLimits.targets[i],
        alt_target: controlLimits.alt_targets?.[i],
        ll99: controlLimits?.ll99?.[i],
        ll95: controlLimits?.ll95?.[i],
        ul95: controlLimits?.ul95?.[i],
        ul99: controlLimits?.ul99?.[i],
        trend_line: controlLimits?.trend_line?.[i],
        astpoint: outliers.astpoint[i],

      }


      this.plotPoints[0].push({
        x: index,
        value: controlLimits.values[i],
        aesthetics: aesthetics,
        table_row: table_row,
        identity: host.createSelectionIdBuilder()
                      .withCategory(inputData.categories, inputData.limitInputArgs.keys[i].id)
                      .createSelectionId(),
        highlighted: !isNullOrUndefined(inputData.highlights?.[index]),
        tooltip: buildTooltip(table_row, inputData?.tooltips?.[index],
                              settings, derivedSettings),
        label: {
          text_value: inputData.labels?.[index],
          aesthetics: inputData.label_formatting[index],
          angle: undefined,
          distance: undefined,
          line_offset: undefined,
          marker_offset: undefined
        }
      })
      this.tickLabels.push({x: index, label: controlLimits.keys[i].label});
    }
  }

  initialiseGroupedLines(): void {
    const settings = this.inputSettings.settings[0];
    const derivedSettings = this.inputSettings.derivedSettings[0];
    const controlLimits = this.controlLimits[0];
    const inputData = this.inputData[0];

    const labels: string[] = new Array<string>();
    if (settings.lines.show_main) {
      labels.push("values");
    }
    if (settings.lines.show_target) {
      labels.push("targets");
    }
    if (settings.lines.show_alt_target) {
      labels.push("alt_targets");
    }
    if (settings.lines.show_trend) {
      labels.push("trend_line");
    }
    if (derivedSettings.chart_type_props.has_control_limits) {
      if (settings.lines.show_99) {
        labels.push("ll99", "ul99");
      }
      if (settings.lines.show_95) {
        labels.push("ll95", "ul95");
      }
    }

    const formattedLines: lineData[] = new Array<lineData>();

    if (!controlLimits) {
      return;
    }

    const nLimits = controlLimits.keys.length;

    // Per-group Anhøj signal state, used to dash only the centerline
    // segments whose data-group has a signal. Falls back to all-false
    // when Anhøj rules are disabled or the chart has no groups recorded.
    const groupBounds: number[][] = this.groupStartEndIndexes[0] ?? [];
    const perGroupSignals = this.outliers[0]?.per_group_signals ?? [];
    // Pre-compute dashed flag per data-group; index by group walked in
    // sync with i below (groups are contiguous, monotonic in i).
    const dashedByGroup: boolean[] = groupBounds.map((_, g) => {
      const sig = perGroupSignals[g];
      return sig ? (sig.long_run || sig.few_crossings) : false;
    });
    let currentGroupIdx: number = 0;

    for (let i: number = 0; i < nLimits; i++) {
      // groupBounds entries are [start, end) — advance cursor when i
      // crosses into the next group.
      while (currentGroupIdx < groupBounds.length
             && i >= groupBounds[currentGroupIdx][1]) {
        currentGroupIdx++;
      }
      const groupSignalDashed: boolean = currentGroupIdx < dashedByGroup.length
                                          ? dashedByGroup[currentGroupIdx]
                                          : false;
      const isRebaselinePoint: boolean = this.splitIndexes.includes(i - 1) || (inputData.groupingIndexes?.includes(i - 1) ?? false);
      let isNewAltTarget: boolean = false;
      if (i > 0 && settings.lines.show_alt_target && !isNullOrUndefined(controlLimits.alt_targets)) {
        isNewAltTarget = controlLimits.alt_targets[i] !== controlLimits.alt_targets[i - 1];
      }
      labels.forEach(label => {
        const join_rebaselines: boolean = settings.lines[`join_rebaselines_${lineNameMap[label]}` as LineSettingsKeys] as boolean;
        // By adding an additional null line value at each re-baseline point
        // we avoid rendering a line joining each segment
        if (isRebaselinePoint || isNewAltTarget) {
          const is_alt_target: boolean = label === "alt_targets" && isNewAltTarget;
          const is_rebaseline: boolean = label !== "alt_targets" && isRebaselinePoint;
          formattedLines.push({
            x: controlLimits.keys[i].x,
            line_value: (!join_rebaselines && (is_alt_target || is_rebaseline)) ? undefined : controlLimits[label as Exclude<keyof controlLimitsObject, "keys">]?.[i],
            group: label,
            aesthetics: inputData.line_formatting[i],
            group_signal_dashed: groupSignalDashed
          })
        }

        formattedLines.push({
          x: controlLimits.keys[i].x,
          line_value: controlLimits[label as Exclude<keyof controlLimitsObject, "keys">]?.[i],
          group: label,
          aesthetics: inputData.line_formatting[i],
          group_signal_dashed: groupSignalDashed
        })
      })
    }
    this.groupedLines = groupBy(formattedLines, "group");
  }

  scaleAndTruncateLimits(controlLimits: controlLimitsObject,
                          inputSettings: settingsValueType,
                          derivedSettings: derivedSettingsClass): void {
    // Scale limits using provided multiplier
    const multiplier: number = derivedSettings.multiplier;
    let lines_to_scale: Exclude<keyof controlLimitsObject, "keys">[] = ["values", "targets"];

    if (derivedSettings.chart_type_props.has_control_limits) {
      lines_to_scale = lines_to_scale.concat(["ll99", "ll95", "ul95", "ul99"]);
    }

    let lines_to_truncate: Exclude<keyof controlLimitsObject, "keys">[] = lines_to_scale;
    if (inputSettings.lines.show_alt_target) {
      lines_to_truncate = lines_to_truncate.concat(["alt_targets"]);
      if (inputSettings.lines.multiplier_alt_target) {
        lines_to_scale = lines_to_scale.concat(["alt_targets"]);
      }
    }

    lines_to_scale.forEach(limit => {
      if (isNullOrUndefined(controlLimits[limit])) {
        return;
      }
      for (let i: number = 0; i < controlLimits[limit].length; i++) {
        if (!isNullOrUndefined(controlLimits[limit][i])) {
          controlLimits[limit][i] = (controlLimits[limit][i] as number) * multiplier;
        }
      }
    })

    lines_to_truncate.forEach(limit => {
      if (isNullOrUndefined(controlLimits[limit])) {
        return;
      }
      for (let i: number = 0; i < controlLimits[limit].length; i++) {
        if (!isNullOrUndefined(controlLimits[limit][i])) {
          const lower_trunc: number = isValidNumber(inputSettings.spc.ll_truncate)
            ? Math.max(inputSettings.spc.ll_truncate, controlLimits[limit][i]!)
            : controlLimits[limit][i] as number;
          const upper_trunc: number = isValidNumber(inputSettings.spc.ul_truncate)
            ? Math.min(inputSettings.spc.ul_truncate, lower_trunc)
            : lower_trunc;
          controlLimits[limit][i] = upper_trunc;
        }
      }
    })
  }

  flagOutliers(controlLimits: controlLimitsObject, groupStartEndIndexes: number[][],
                inputSettings: settingsValueType, derivedSettings: derivedSettingsClass): outliersObject {
    const perGroupSignals: { long_run: boolean; few_crossings: boolean }[] = [];
    const outliers: outliersObject = {
      astpoint: rep("none", controlLimits.values.length),
      per_group_signals: perGroupSignals
    }
    for (let i: number = 0; i < groupStartEndIndexes.length; i++) {
      const start: number = groupStartEndIndexes[i][0];
      const end: number = groupStartEndIndexes[i][1];
      const group_values: number[] = controlLimits.values.slice(start, end);
      const group_targets: number[] = controlLimits.targets.slice(start, end) as number[];
      const group_signal = { long_run: false, few_crossings: false };

      // Astronomical evalueres altid mod 3σ (ll99/ul99) — qicharts2 sigma.signal
      if (derivedSettings.chart_type_props.has_control_limits) {
        if (inputSettings.outliers.astronomical) {
          const lower_limits: number[] = controlLimits.ll99!.slice(start, end) as number[];
          const upper_limits: number[] = controlLimits.ul99!.slice(start, end) as number[];
          astronomical(group_values, lower_limits, upper_limits)
            .forEach((flag, idx) => outliers.astpoint[start + idx] = flag)
        }
      }
      if (inputSettings.outliers.anhoj_long_run) {
        group_signal.long_run = anhojLongRun(group_values, group_targets);
      }
      if (inputSettings.outliers.anhoj_few_crossings) {
        group_signal.few_crossings = anhojFewCrossings(group_values, group_targets);
      }
      perGroupSignals.push(group_signal);
    }
    return outliers;
  }
}
