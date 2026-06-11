import { computeSides } from "./anhojShared";

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
 * @param val - Observation values
 * @param centerline - Centerline value at each position
 * @returns TRUE when the long-run signal fires
 */
export default function anhojLongRun(
  val: readonly number[],
  centerline: readonly number[]
): boolean {
  const sides: number[] = computeSides(val, centerline);
  const nUseful: number = sides.length;
  if (nUseful < 2) {
    return false;
  }

  const longestRunMax: number = Math.round(Math.log2(nUseful)) + 3;

  let longestRun: number = 1;
  let currentRun: number = 1;
  for (let i: number = 1; i < nUseful; i++) {
    currentRun = sides[i] === sides[i - 1] ? currentRun + 1 : 1;
    if (currentRun > longestRun) longestRun = currentRun;
  }

  return longestRun > longestRunMax;
}
