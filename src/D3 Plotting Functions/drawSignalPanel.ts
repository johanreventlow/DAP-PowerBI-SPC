import * as d3 from "./D3 Modules";
import type { svgBaseType, Visual } from "../visual";
import type { groupStatsObject } from "../Classes/viewModelClass";
import type { settingsValueType } from "../settings";
import { buildSignalPanelBlocks, type signalPanelBlock, type signalPanelRow,
         type runsRulesEnabled } from "../Functions/signalPanelRows";

type panelGroupType = d3.Selection<SVGGElement, unknown, null, undefined>;
type textSelectionType = d3.Selection<SVGTextElement, unknown, null, undefined>;

// The panel has no font setting of its own: it follows Power BI's report
// font so it reads as part of the report chrome rather than of the chart.
const PANEL_FONT: string = "'Segoe UI', wf_segoe-ui_normal, helvetica, arial, sans-serif";
const TITLE_SIZE: number = 10;

// Fixed greys rather than settings: the layout relies on the numbers being
// lighter than the labels, and a signal inverting grey-on-white to
// white-on-grey. Only the signal fill is user-adjustable.
const TITLE_COLOUR: string = "#252525";
const LABEL_COLOUR: string = "#404040";
const HEADER_COLOUR: string = "#A6A6A6";
const NUMBER_COLOUR: string = "#8C8C8C";
const SIGNAL_TEXT_COLOUR: string = "#FFFFFF";

// Vertical rhythm, in multiples of the font size. CAP_HEIGHT is the height
// of digits and capitals for common sans-serif fonts; the panel is all caps
// and digits, so it is the height that matters for centring and boxing.
const LINE_HEIGHT: number = 1.2;
const CAP_HEIGHT: number = 0.72;
// Average advance of an upper-case letter or digit, used where the text
// cannot be measured (headless export) and to size columns before drawing.
const CHAR_WIDTH: number = 0.66;
const RIGHT_INSET: number = 4;
const ROW_GAP: number = 6;
// "All periods" shrinks the numbers so several periods fit the same height.
const COMPACT_SCALE: number = 0.6;
const CLIP_ID: string = "signal-panel-clip";

/**
 * Width of a text element, or the estimate when nothing can be measured.
 * Headless export has no layout, and a detached or unstyled node reports 0.
 */
function measureText(textSel: textSelectionType, estimate: number, headless: boolean): number {
  if (headless) {
    return estimate;
  }
  const node: SVGTextElement | null = textSel.node();
  const measured: number = node ? node.getComputedTextLength() : 0;
  return Number.isFinite(measured) && measured > 0 ? measured : estimate;
}

/**
 * Shorten a text element with an ellipsis until it fits maxWidth. Needed
 * because adjustPaddingForOverflow reads the SVG's bounding box, which
 * ignores clip-paths: a label sticking past the right edge would double
 * the right padding and squash the plot. Skipped in headless mode, where
 * there is no layout to measure against.
 */
function fitText(textSel: textSelectionType, maxWidth: number, headless: boolean): void {
  if (headless || maxWidth <= 0) {
    return;
  }
  let body: string = textSel.text();
  let width: number = measureText(textSel, 0, headless);
  while (width > maxWidth && body.length > 0) {
    // Proportional cut, always at least one character shorter so the loop
    // terminates even when the measured width barely moves.
    const keep: number = Math.min(body.length - 1,
                                  Math.max(0, Math.floor(body.length * maxWidth / width) - 1));
    body = body.slice(0, keep).trimEnd();
    textSel.text(`${body}…`);
    width = measureText(textSel, 0, headless);
  }
}

/**
 * Baselines that centre a block of nLines of text on `centre`, so a
 * two-line label sits level with the single large number beside it.
 */
function lineBaselines(nLines: number, centre: number, size: number): number[] {
  const lineHeight: number = size * LINE_HEIGHT;
  const blockHeight: number = (nLines - 1) * lineHeight + size * CAP_HEIGHT;
  const first: number = centre - blockHeight / 2 + size * CAP_HEIGHT;
  const baselines: number[] = [];
  for (let i: number = 0; i < nLines; i++) {
    baselines.push(first + i * lineHeight);
  }
  return baselines;
}

type panelStyle = {
  labelSize: number;
  numberSize: number;
  textColour: string;
  labelColour: string;
  headerColour: string;
  numberColour: string;
  signalFill: string;
  signalText: string;
  headless: boolean;
};

type panelColumns = {
  left: number;
  labelMaxWidth: number;
  expectedX: number;
  actualX: number;
  columnWidth: number;
};

function appendText(group: panelGroupType, text: string, x: number, y: number,
                    size: number, colour: string, anchor: string): textSelectionType {
  return group.append("text")
              .attr("x", x)
              .attr("y", y)
              .text(text)
              .style("text-anchor", anchor)
              .style("font-family", PANEL_FONT)
              .style("font-size", `${size}px`)
              .style("fill", colour);
}

/**
 * One number cell. A signal is drawn as reversed text on a filled box that
 * hugs the digits, rather than as coloured text, so it stays legible in
 * greyscale print and at a glance across a room.
 */
function drawNumber(group: panelGroupType, text: string, cx: number, cy: number,
                    signal: boolean, style: panelStyle): void {
  const size: number = style.numberSize;
  const capHeight: number = size * CAP_HEIGHT;
  const textSel: textSelectionType = appendText(group, text, cx, cy + capHeight / 2, size,
                                                signal ? style.signalText : style.numberColour,
                                                "middle")
    .style("font-variant-numeric", "tabular-nums");
  if (!signal) {
    return;
  }
  const width: number = measureText(textSel, text.length * size * CHAR_WIDTH, style.headless);
  const padX: number = size * 0.2;
  const padY: number = size * 0.12;
  const textNode: SVGTextElement | null = textSel.node();
  group.insert("rect", () => textNode)
       // Classed so the box can be selected on its own: the panel also holds
       // the clipPath's rect, which a bare "rect" selector would match.
       .classed("signal-box", true)
       .attr("x", cx - width / 2 - padX)
       .attr("y", cy - capHeight / 2 - padY)
       .attr("width", width + 2 * padX)
       .attr("height", capHeight + 2 * padY)
       .attr("rx", 2)
       .style("fill", style.signalFill);
}

function drawRow(group: panelGroupType, row: signalPanelRow, centre: number,
                 columns: panelColumns, style: panelStyle): void {
  const baselines: number[] = lineBaselines(row.label.length, centre, style.labelSize);
  row.label.forEach((line: string, i: number) => {
    const textSel: textSelectionType = appendText(group, line, columns.left, baselines[i],
                                                  style.labelSize, style.labelColour, "start");
    fitText(textSel, columns.labelMaxWidth, style.headless);
  });
  drawNumber(group, row.expected, columns.expectedX, centre, false, style);
  drawNumber(group, row.actual, columns.actualX, centre, row.signal, style);
}

function drawColumnHeaders(group: panelGroupType, settings: settingsValueType["signal_panel"],
                           baseline: number, columns: panelColumns, style: panelStyle): void {
  const headers: { text: string; x: number }[] = [
    { text: settings.label_expected.toUpperCase(), x: columns.expectedX },
    { text: settings.label_actual.toUpperCase(), x: columns.actualX }
  ];
  headers.forEach(header => {
    const textSel: textSelectionType = appendText(group, header.text, header.x, baseline,
                                                  style.labelSize, style.headerColour, "middle");
    fitText(textSel, columns.columnWidth, style.headless);
  });
}

/**
 * Draw the signal panel to the right of the plot: a small table of the
 * observed run statistics against their expected thresholds, one block per
 * period shown. Whether the panel is drawn at all (and its width reserved)
 * is decided in plotPropertiesClass.update, so the plot and the panel never
 * disagree about the space.
 *
 * @param selection - The visual's root SVG selection
 * @param visualObj - The visual, for settings, palette and layout
 */
export default function drawSignalPanel(selection: svgBaseType, visualObj: Visual): void {
  const inputSettings: settingsValueType = visualObj.viewModel.inputSettings.settings[0];
  const settings: settingsValueType["signal_panel"] = inputSettings.signal_panel;
  const perGroupStats: groupStatsObject[] = visualObj.viewModel.outliers[0]?.per_group_stats ?? [];
  // The same toggles that gate the dashed centerline gate the highlight here,
  // so the two never disagree about whether a signal fired.
  const enabled: runsRulesEnabled = {
    long_run: inputSettings.outliers.anhoj_long_run,
    few_crossings: inputSettings.outliers.anhoj_few_crossings
  };
  const blocks: signalPanelBlock[] = visualObj.plotProperties.showSignalPanel
    ? buildSignalPanelBlocks(perGroupStats, settings, enabled)
    : [];

  if (blocks.length === 0) {
    selection.select(".signal-panel").remove();
    return;
  }
  if (selection.select(".signal-panel").empty()) {
    selection.append("g").classed("signal-panel", true);
  }
  // Rebuilt from scratch each update: the panel is a few dozen elements,
  // and a join keyed on rows would have to track period count, row count
  // and signal state for no visible gain.
  const panel: panelGroupType = selection.select(".signal-panel") as panelGroupType;
  panel.selectAll("*").remove();

  const svgWidth: number = visualObj.viewModel.svgWidth;
  const svgHeight: number = visualObj.viewModel.svgHeight;
  // The reserved strip is end_padding wide; right_padding of it is the gap
  // to the plot, the rest is the panel. Anchoring on end_padding rather
  // than on svgWidth - panel_width keeps the panel clear of the plot when
  // adjustPaddingForOverflow widens the padding.
  const left: number = svgWidth - visualObj.plotProperties.xAxis.end_padding
                       + inputSettings.canvas.right_padding;
  const right: number = svgWidth - RIGHT_INSET;
  const top: number = inputSettings.canvas.upper_padding;

  // Nothing outside the strip is ever painted, whatever the label text.
  panel.append("clipPath")
       .attr("id", CLIP_ID)
       .append("rect")
       .attr("x", left)
       .attr("y", 0)
       .attr("width", Math.max(0, svgWidth - left))
       .attr("height", svgHeight);
  panel.attr("clip-path", `url(#${CLIP_ID})`);

  const palette = visualObj.viewModel.colourPalette;
  const highContrast: boolean = palette.isHighContrast;
  const compact: boolean = settings.panel_periods === "all";
  const style: panelStyle = {
    labelSize: settings.panel_label_size,
    numberSize: settings.panel_font_size * (compact ? COMPACT_SCALE : 1),
    textColour: highContrast ? palette.foregroundColour : TITLE_COLOUR,
    labelColour: highContrast ? palette.foregroundColour : LABEL_COLOUR,
    headerColour: highContrast ? palette.foregroundColour : HEADER_COLOUR,
    numberColour: highContrast ? palette.foregroundColour : NUMBER_COLOUR,
    signalFill: highContrast ? palette.foregroundColour : settings.panel_signal_colour,
    signalText: highContrast ? palette.backgroundColour : SIGNAL_TEXT_COLOUR,
    headless: visualObj.viewModel.headless
  };

  // The number columns must hold the widest number actually shown, the box
  // drawn around it when it signals, and the column header above it; the
  // label column takes whatever is left. Sizing from the settings alone was
  // not enough: a long series pushes the usable-observation count to four or
  // five digits, which then overflowed the reserved strip. The overflow check
  // in visual.ts reacts by doubling end_padding and redrawing, which at tile
  // widths just above the hide threshold leaves the plot with an inverted
  // x-range.
  const headerChars: number = Math.max(settings.label_expected.length, settings.label_actual.length);
  const digits: number = blocks.reduce((widest: number, block: signalPanelBlock) => {
    return block.rows.reduce((rowWidest: number, row: signalPanelRow) => {
      return Math.max(rowWidest, row.expected.length, row.actual.length);
    }, widest);
  }, 1);
  // CHAR_WIDTH over-estimates digits, and the extra half-em covers the
  // signal box's padding on both sides.
  const columnWidth: number = Math.max(style.numberSize * 2,
                                       digits * style.numberSize * CHAR_WIDTH + style.numberSize * 0.5,
                                       headerChars * style.labelSize * CHAR_WIDTH + 4);
  const columns: panelColumns = {
    left: left,
    labelMaxWidth: right - 2 * columnWidth - left - 4,
    expectedX: right - columnWidth * 1.5,
    actualX: right - columnWidth / 2,
    columnWidth: columnWidth
  };

  let cursor: number = top;
  const title: string = settings.panel_title.trim().toUpperCase();
  if (title !== "") {
    const titleSel: textSelectionType = appendText(panel, title, left, cursor + TITLE_SIZE,
                                                   TITLE_SIZE, style.textColour, "start")
      .style("font-weight", "bold");
    fitText(titleSel, right - left, style.headless);
    // The blank line between the title and the table in the layout.
    cursor += TITLE_SIZE * LINE_HEIGHT + TITLE_SIZE;
  }

  const labelLine: number = style.labelSize * LINE_HEIGHT;
  const rowHeight: number = Math.max(style.numberSize, 2 * labelLine);
  const blockHeight = (block: signalPanelBlock): number => {
    return (block.heading !== null ? labelLine + 2 : 0)
           + labelLine + 4
           + block.rows.length * (rowHeight + ROW_GAP);
  };

  // Rows are only drawn while they fit inside the SVG: the clip-path hides
  // overflow visually, but the overflow check in visual.ts would still see
  // it and shrink the plot. The first block is drawn row by row so a short
  // tile still shows what it can; later blocks are all-or-nothing so a
  // period never appears as a heading with no numbers under it.
  const fits = (bottom: number): boolean => bottom <= svgHeight;
  for (let b: number = 0; b < blocks.length; b++) {
    const block: signalPanelBlock = blocks[b];
    if (b > 0 && !fits(cursor + blockHeight(block))) {
      break;
    }
    if (block.heading !== null) {
      if (!fits(cursor + labelLine)) break;
      appendText(panel, block.heading, left, cursor + style.labelSize,
                 style.labelSize, style.labelColour, "start")
        .style("font-weight", "bold");
      cursor += labelLine + 2;
    }
    if (!fits(cursor + labelLine)) break;
    drawColumnHeaders(panel, settings, cursor + style.labelSize, columns, style);
    cursor += labelLine + 4;

    for (const row of block.rows) {
      if (!fits(cursor + rowHeight)) break;
      drawRow(panel, row, cursor + rowHeight / 2, columns, style);
      cursor += rowHeight + ROW_GAP;
    }
    cursor += ROW_GAP;
  }
}
