/**
 * Formatér et tal med fast antal decimaler og dansk decimalmarkør.
 *
 * `toFixed` producerer aldrig tusindtalsseparatorer, så det eneste punktum i
 * resultatet er decimalpunktummet. Derfor er en ubetinget udskiftning sikker
 * her — den ville ikke være det på en streng, der allerede var grupperet.
 *
 * @param value - Tallet der skal formateres
 * @param decimals - Antal decimaler
 */
export default function toFixedComma(value: number, decimals: number): string {
  return value.toFixed(decimals).replace(".", ",");
}
