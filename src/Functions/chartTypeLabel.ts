/**
 * Kort navn på en diagramtype, til tooltip og andre steder, hvor der kun er
 * plads til nogle få tegn.
 *
 * Dropdownens etiketter er skrevet til at vælge ud fra ("Måling – fx
 * ventetid, blodtryk (I')"); denne er skrevet til at genkende bagefter.
 */
const chartTypeNames: Record<string, string> = {
  run: "Seriediagram",
  i: "I-kort",
  ip: "I'-kort",
  i_m: "I-kort (median)",
  i_mm: "I-kort (median, median-MR)",
  mr: "MR-kort",
  p: "P-kort",
  pp: "P'-kort",
  u: "U-kort",
  up: "U'-kort",
  c: "C-kort",
  xbar: "Xbar-kort",
  s: "S-kort",
  g: "G-kort",
  t: "T-kort"
};

export default function chartTypeLabel(chart_type: string): string {
  // En ukendt kode vises som sig selv frem for tomt: sker den, er koden selv
  // det mest brugbare, en bruger kan give videre.
  return chartTypeNames[chart_type] ?? chart_type;
}
