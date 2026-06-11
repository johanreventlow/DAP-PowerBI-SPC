/**
 * Formatér et tal med fast antal decimaler og dansk decimalmarkør
 * (komma). Bruges alle steder hvor tal vises for brugeren — tooltips,
 * oversigtstabel, akser og linje-etiketter.
 */
export default function toFixedComma(value: number, decimals: number): string {
  return value.toFixed(decimals).replace(".", ",");
}
