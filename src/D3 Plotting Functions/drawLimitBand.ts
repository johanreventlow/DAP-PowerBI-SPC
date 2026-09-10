import * as d3 from "./D3 Modules";
import between from "../Functions/between";
import isNullOrUndefined from "../Functions/isNullOrUndefined";
import type { svgBaseType, Visual } from "../visual";

type bandPoint = {
  x: number;
  lower: number;
  upper: number;
};

/**
 * Udfyldt bånd mellem nedre og øvre 3σ-kontrolgrænse.
 *
 * Området mellem grænserne aflæses lettere som en flade end som to streger
 * alene. Båndet tegnes i `limitbandgroup`, som ligger før `linesgroup` i
 * SVG'ens dokumentorden og derfor males bagved både linjer og punkter.
 *
 * Ét bånd per fase. Ved et faseskift ændrer grænserne sig i et spring, og et
 * sammenhængende bånd hen over skiftet ville tegne en flade, der ikke svarer
 * til nogen af de to faser.
 */
export default function drawLimitBand(selection: svgBaseType, visualObj: Visual) {
  const group = selection.select(".limitbandgroup");
  const settings = visualObj.viewModel.inputSettings.settings[0];
  const derived = visualObj.viewModel.inputSettings.derivedSettings[0];
  const limits = visualObj.viewModel.controlLimits?.[0];
  const groupBounds: number[][] = visualObj.viewModel.groupStartEndIndexes?.[0] ?? [];

  // has_control_limits er den semantiske betingelse. At run-diagrammet også
  // er den eneste chart-type, hvis limit-beregning slet ikke producerer
  // ll99/ul99, gør de to kontroller ækvivalente — men det er en egenskab ved
  // run.ts, ikke en garanti. Denne læser intentionen.
  const showBand: boolean = settings.lines.show_band_99
    && (derived?.chart_type_props?.has_control_limits ?? false)
    && !visualObj.viewModel.showGrouped
    && !isNullOrUndefined(limits);

  if (!showBand) {
    group.selectAll("path").remove();
    return;
  }

  const xlower: number = visualObj.plotProperties.xAxis.lower;
  const xupper: number = visualObj.plotProperties.xAxis.upper;

  // Grænser, der ikke er reelle tal, springes over frem for at bryde båndet:
  // en manglende grænse er fravær af en grænse, ikke en flade med højde nul.
  const phases: bandPoint[][] = groupBounds.map(bounds => {
    const points: bandPoint[] = [];
    for (let i: number = bounds[0]; i < bounds[1]; i++) {
      const x: number = limits.keys[i].x;
      const lower = limits.ll99?.[i];
      const upper = limits.ul99?.[i];
      if (between(x, xlower, xupper) && Number.isFinite(lower) && Number.isFinite(upper)) {
        points.push({ x: x, lower: lower as number, upper: upper as number });
      }
    }
    return points;
    // Ét punkt giver ingen flade at tegne.
  }).filter(points => points.length > 1);

  const bandArea = d3.area<bandPoint>()
    .x(d => visualObj.plotProperties.xScale(d.x) as number)
    .y0(d => visualObj.plotProperties.yScale(d.lower) as number)
    .y1(d => visualObj.plotProperties.yScale(d.upper) as number);

  group
    .selectAll("path")
    .data(phases)
    .join("path")
    .attr("d", d => bandArea(d))
    .attr("fill", settings.lines.band_colour_99)
    .attr("fill-opacity", settings.lines.band_opacity_99)
    .attr("stroke", "none");
}
