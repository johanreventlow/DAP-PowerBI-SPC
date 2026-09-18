/**
 * Symbolet foran målets værdi, fx "≥ " i "≥ 55".
 *
 * Retningen vises, men fortolkes ikke: diagrammet markerer ikke, om målet er
 * nået. Den fortæller læseren, hvilken vej der er den rigtige — en oplysning,
 * der ellers kun findes i hovedet på den, der byggede rapporten.
 */
const operatorSymbols: Record<string, string> = {
  ">=": "≥",
  "<=": "≤",
  ">": ">",
  "<": "<"
};

export default function targetOperator(operator: string): string {
  const symbol: string | undefined = operatorSymbols[operator];
  return symbol ? `${symbol} ` : "";
}
