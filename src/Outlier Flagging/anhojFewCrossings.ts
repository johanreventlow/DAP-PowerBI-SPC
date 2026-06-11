import { anhojStats } from "./anhojShared";

/**
 * Anhøj few-crossings rule (series-level signal).
 *
 * Returns TRUE when the count of side-transitions across the centerline
 * is strictly less than the binomial-derived threshold:
 *
 *   n_crossings_min = qbinom(0.05, n_useful - 1, 0.5)
 *
 * Series-level signal matching qicharts2's scalar runs.signal contract.
 * The caller decides how to render it (e.g. dashed centerline).
 */
export default function anhojFewCrossings(
  val: readonly number[],
  centerline: readonly number[]
): boolean {
  return anhojStats(val, centerline).fewCrossingsSignal;
}
