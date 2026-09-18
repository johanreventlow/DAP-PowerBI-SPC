import type { svgBaseType } from "../visual";

export default function initialiseSVG(selection: svgBaseType,
                                      removeAll: boolean = false) {
  if (removeAll) {
    selection.selectChildren().remove();
  }
  selection.append('g').classed("xaxisgroup", true)
  selection.append('text').classed('xaxislabel', true)
  selection.append('g').classed("yaxisgroup", true)
  selection.append('text').classed('yaxislabel', true)
  // Før linesgroup: SVG maler i dokumentorden, så båndet skal ligge her for
  // at havne bag linjer og punkter.
  selection.append('g').classed("limitbandgroup", true)
  // Efter båndet: sigtelinjerne peger på akserne og skal kunne følges hen over
  // fladen. Før linjer og punkter, så de ikke dækker data.
  selection.append('line').classed("ttip-line-x", true)
  selection.append('line').classed("ttip-line-y", true)
  selection.append('g').classed("linesgroup", true)
  selection.append('g').classed("dotsgroup", true)
  // Sidst: advarslen skal kunne læses oven på alt andet.
  selection.append('g').classed("warninggroup", true)
}
