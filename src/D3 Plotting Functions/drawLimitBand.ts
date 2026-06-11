import * as d3 from "./D3 Modules";
import type { svgBaseType, Visual } from "../visual";

type BandPoint = {
  x: number;
  lower: number;
  upper: number;
};

/**
 * Filled control-limit band (geom_ribbon style): shades the area between
 * the lower and upper 3-sigma limits (ll99/ul99). Drawn per phase so the
 * ribbon breaks at rebaselines, and rendered in the limitbandgroup which
 * sits behind lines and dots in the SVG paint order.
 */
export default function drawLimitBand(selection: svgBaseType, visualObj: Visual) {
  const group = selection.select(".limitbandgroup");

  const settings = visualObj.viewModel.inputSettings.settings[0];
  const derived = visualObj.viewModel.inputSettings.derivedSettings[0];
  const limits = visualObj.viewModel.controlLimits?.[0];
  const groupBounds: number[][] = visualObj.viewModel.groupStartEndIndexes?.[0] ?? [];

  const showBand: boolean = (settings?.lines?.show_band_99 ?? false)
    && (derived?.chart_type_props?.has_control_limits ?? false)
    && !visualObj.viewModel.showGrouped
    && !!limits?.ll99 && !!limits?.ul99;

  if (!showBand) {
    group.selectAll("path").remove();
    return;
  }

  // Ét bånd-segment per fase — ribbon brydes ved faseskift som linjerne
  const phases: BandPoint[][] = groupBounds.map(bounds => {
    const points: BandPoint[] = [];
    for (let i: number = bounds[0]; i < bounds[1]; i++) {
      const lower = limits.ll99?.[i];
      const upper = limits.ul99?.[i];
      if (Number.isFinite(lower) && Number.isFinite(upper)) {
        points.push({ x: limits.keys[i].x, lower: lower as number, upper: upper as number });
      }
    }
    return points;
  }).filter(points => points.length > 1);

  const bandArea = d3.area<BandPoint>()
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
