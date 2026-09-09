import { anhojRunsAnalysis } from "./anhojShared";

/**
 * Anhøj long-run rule (series-level signal).
 *
 * Returns TRUE when the longest run of observations on the same side of
 * the centerline strictly exceeds the dynamic threshold:
 *
 *   longest_run_max = round(log2(n_useful)) + 3
 *
 * Matches qicharts2 v0.8.1 runs.analysis / crsignal(method = "anhoej"):
 * runs analysis yields one boolean per chart part — rendered as a dashed
 * centerline — and flags no individual points.
 *
 * The counts behind the verdict live in anhojRunsAnalysis; callers that
 * need to display them should use that directly.
 *
 * @param val - Observation values
 * @param centerline - Centerline value at each position
 * @returns TRUE when the long-run signal fires
 */
export default function anhojLongRun(
  val: readonly number[],
  centerline: readonly number[]
): boolean {
  return anhojRunsAnalysis(val, centerline).long_run_signal;
}
