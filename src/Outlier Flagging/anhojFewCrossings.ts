import qbinom from "../Functions/qbinom";
import { computeSides } from "./anhojShared";

/**
 * Anhøj few-crossings rule.
 *
 * Returns TRUE when the count of side-transitions across the centerline
 * is strictly less than the binomial-derived threshold:
 *
 *   n_crossings_min = qbinom(0.05, n_useful - 1, 0.5)
 *
 * This is a series-level signal (not per-point) matching qicharts2's
 * scalar runs.signal contract. The caller decides how to render it
 * (e.g. dashed centerline).
 */
export default function anhojFewCrossings(
  val: readonly number[],
  centerline: readonly number[]
): boolean {
  const { sides } = computeSides(val, centerline);
  const nUseful: number = sides.length;
  if (nUseful < 2) {
    return false;
  }

  let nCrossings: number = 0;
  for (let i: number = 1; i < nUseful; i++) {
    if (sides[i] !== sides[i - 1]) nCrossings++;
  }

  return nCrossings < qbinom(0.05, nUseful - 1, 0.5);
}
