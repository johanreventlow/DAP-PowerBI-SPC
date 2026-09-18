import type { svgBaseType, Visual } from "../visual";

// Samme skrift som signalpanelet: advarslen er rapportens stemme, ikke
// diagrammets. Størrelsen er mindre end aksernes, så den ikke tager
// opmærksomhed fra data, men stadig kan læses.
const WARNING_FONT: string = "'Segoe UI', wf_segoe-ui_normal, helvetica, arial, sans-serif";
const WARNING_SIZE: number = 11;
const PADDING: number = 4;
const LINE_HEIGHT: number = 1.3;

/**
 * Advarsel om, at de bundne data ikke passer til den valgte diagramtype.
 *
 * Lægges oven på lærredets øverste kant med en udfyldt baggrund, så den er
 * læsbar, selv hvor en linje løber bagved. Lagt som overlay frem for at
 * skubbe plottet ned: advarslen er midlertidig — brugeren retter valget
 * eller slår advarslen fra — og et plot, der flytter sig, er værre end en
 * linje, der kortvarigt er dækket.
 */
export default function drawWarning(selection: svgBaseType, visualObj: Visual) {
  const group = selection.select(".warninggroup");
  const message: string = visualObj.viewModel.chartTypeWarning;
  const show: boolean = message !== ""
                        && visualObj.viewModel.inputSettings.settings[0].canvas.show_chart_type_warning
                        && visualObj.plotProperties.displayPlot;

  if (!show) {
    group.selectAll("*").remove();
    return;
  }

  // Én linje per sætning. Beskeden er kort, men lærredet er smalt, og en
  // enkelt lang linje løber ind i signalpanelet i højre side.
  const lines: string[] = message.split(". ").map((line, idx, all) => {
    return idx < all.length - 1 ? `${line}.` : line;
  });

  const text = group
    .selectAll<SVGTextElement, string[]>("text")
    .data([lines])
    .join("text")
    .attr("x", PADDING * 2)
    .attr("y", WARNING_SIZE + PADDING)
    .style("font-family", WARNING_FONT)
    .style("font-size", `${WARNING_SIZE}px`)
    .style("fill", visualObj.viewModel.inputSettings.settings[0].outliers.ast_colour);

  text
    .selectAll<SVGTSpanElement, string>("tspan")
    .data(d => d)
    .join("tspan")
    .attr("x", PADDING * 2)
    .attr("dy", (_, idx) => idx === 0 ? 0 : WARNING_SIZE * LINE_HEIGHT)
    .text(d => d);

  // Baggrunden måles efter teksten og lægges bagved den.
  const node: SVGGraphicsElement | null = text.node();
  const width: number = node ? node.getBBox().width : 0;
  group
    .selectAll<SVGRectElement, number>("rect")
    .data(width > 0 ? [width] : [])
    .join("rect")
    .lower()
    .attr("x", PADDING)
    .attr("y", PADDING / 2)
    .attr("width", d => d + PADDING * 2)
    .attr("height", WARNING_SIZE * LINE_HEIGHT * lines.length + PADDING)
    .attr("fill", "#FFFFFF")
    .attr("fill-opacity", 0.85);
}
