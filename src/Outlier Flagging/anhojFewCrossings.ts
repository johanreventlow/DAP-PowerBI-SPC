import { anhojRunsAnalysis } from "./anhojShared";

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
 *
 * The counts behind the verdict live in anhojRunsAnalysis; callers that
 * need to display them should use that directly.
 */
export default function anhojFewCrossings(
  val: readonly number[],
  centerline: readonly number[]
): boolean {
  return anhojRunsAnalysis(val, centerline).few_crossings_signal;
}
