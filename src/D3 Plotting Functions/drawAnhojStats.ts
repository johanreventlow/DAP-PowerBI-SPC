import * as d3 from "./D3 Modules";
import type { svgBaseType, Visual } from "../visual";
import type { AnhojStats } from "../Outlier Flagging/anhojShared";

type AnhojStatsLabel = {
  x: number;
  lineRun: string;
  lineCrossings: string;
};

/**
 * Persistent on-canvas runs-analysis per phase (Anhøj): one text block
 * centred over each phase's x-interval, showing longest run vs the
 * dynamic threshold and crossings vs the binomial minimum. Phases with
 * nUseful < 2 render nothing (stats are NA in qicharts2 terms).
 */
export default function drawAnhojStats(selection: svgBaseType, visualObj: Visual) {
  const group = selection
    .selectAll<SVGGElement, null>(".anhojstatsgroup")
    .data([null])
    .join("g")
    .attr("class", "anhojstatsgroup");

  const settings = visualObj.viewModel.inputSettings.settings[0];
  const showStats: boolean = settings?.outliers?.show_anhoj_stats ?? false;
  const groupBounds: number[][] = visualObj.viewModel.groupStartEndIndexes?.[0] ?? [];
  const perGroupSignals = visualObj.viewModel.outliers?.[0]?.per_group_signals ?? [];
  const keys = visualObj.viewModel.controlLimits?.[0]?.keys ?? [];

  if (!showStats || visualObj.viewModel.showGrouped
      || groupBounds.length === 0 || keys.length === 0) {
    group.selectAll("text").remove();
    return;
  }

  const labelRun: string = settings.outliers.anhoj_stats_label_run;
  const labelCrossings: string = settings.outliers.anhoj_stats_label_crossings;

  const labels: AnhojStatsLabel[] = [];
  groupBounds.forEach((bounds, g) => {
    const stats: AnhojStats | undefined = perGroupSignals[g]?.stats;
    // Degenererede faser (nUseful < 2) har null-statistik — spring over
    if (!stats || stats.longestRun === null) {
      return;
    }
    const firstKey = keys[bounds[0]];
    const lastKey = keys[bounds[1] - 1];
    if (!firstKey || !lastKey) {
      return;
    }
    const midX: number = visualObj.plotProperties.xScale(
      (firstKey.x + lastKey.x) / 2
    ) as number;
    labels.push({
      x: midX,
      lineRun: `${labelRun}: ${stats.longestRun} (maks ${stats.longestRunMax})`,
      lineCrossings: `${labelCrossings}: ${stats.nCrossings} (min ${stats.nCrossingsMin})`
    });
  });

  const fontSize: number = settings.outliers.anhoj_stats_size;
  const yTop: number = (visualObj.plotProperties.yScale(
    visualObj.plotProperties.yAxis.upper
  ) as number) + fontSize;

  group
    .selectAll<SVGTextElement, AnhojStatsLabel>("text")
    .data(labels)
    .join("text")
    .attr("x", d => d.x)
    .attr("y", yTop)
    .attr("text-anchor", "middle")
    .style("font-family", settings.outliers.anhoj_stats_font)
    .style("font-size", `${fontSize}px`)
    .style("fill", settings.outliers.anhoj_stats_colour)
    .each(function(d) {
      const text = d3.select(this);
      text.selectAll("tspan").remove();
      text.append("tspan").attr("x", d.x).attr("dy", 0).text(d.lineRun);
      text.append("tspan").attr("x", d.x).attr("dy", fontSize * 1.2).text(d.lineCrossings);
    });
}
