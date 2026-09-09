import qbinom from "../Functions/qbinom";

/**
 * Shared helpers for the Anhøj rules. Both anhojLongRun and
 * anhojFewCrossings need to map observations to their side of the
 * centerline while filtering out ties on the centerline itself.
 */

/**
 * Map each observation to its side of the centerline (+1 above, -1
 * below), dropping ties and non-finite values. Matches qicharts2's
 * runs.analysis where n_useful excludes on-centerline points and NA.
 * Number.isFinite rejects null/NaN without coercion.
 */
export function computeSides(
  val: readonly number[],
  centerline: readonly number[]
): number[] {
  const sides: number[] = [];
  for (let i: number = 0; i < val.length; i++) {
    if (!Number.isFinite(val[i]) || !Number.isFinite(centerline[i])) {
      continue;
    }
    const s: number = Math.sign(val[i] - centerline[i]);
    if (s !== 0) {
      sides.push(s);
    }
  }
  return sides;
}

/**
 * The counts and thresholds behind the two runs rules. `null` mirrors R's
 * NA for a series with fewer than two useful observations, where neither
 * a run length nor a crossing count is defined.
 */
export type runsAnalysisObject = {
  n_useful: number;
  longest_run: number | null;
  n_crossings: number | null;
  longest_run_max: number | null;
  n_crossings_min: number | null;
  long_run_signal: boolean;
  few_crossings_signal: boolean;
};

/**
 * Full runs analysis of one chart part, as qicharts2 v0.8.1 reports it:
 *
 *   longest_run_max = round(log2(n_useful)) + 3
 *   n_crossings_min = qbinom(0.05, n_useful - 1, 0.5)
 *
 * A signal fires when the longest run strictly exceeds its maximum, or
 * the crossing count falls strictly below its minimum.
 *
 * Callers that only need the verdict should use anhojLongRun /
 * anhojFewCrossings, which wrap this. Callers that display the counts
 * (the signal panel, the tooltip) need the whole object, which is why
 * the arithmetic lives here rather than inside the two rules.
 *
 * @param val - Observation values
 * @param centerline - Centerline value at each position
 */
export function anhojRunsAnalysis(
  val: readonly number[],
  centerline: readonly number[]
): runsAnalysisObject {
  const sides: number[] = computeSides(val, centerline);
  const nUseful: number = sides.length;

  if (nUseful < 2) {
    return {
      n_useful: nUseful,
      longest_run: null,
      n_crossings: null,
      longest_run_max: null,
      n_crossings_min: null,
      long_run_signal: false,
      few_crossings_signal: false
    };
  }

  let longestRun: number = 1;
  let currentRun: number = 1;
  let nCrossings: number = 0;
  for (let i: number = 1; i < nUseful; i++) {
    if (sides[i] === sides[i - 1]) {
      currentRun += 1;
      if (currentRun > longestRun) longestRun = currentRun;
    } else {
      currentRun = 1;
      nCrossings += 1;
    }
  }

  const longestRunMax: number = Math.round(Math.log2(nUseful)) + 3;
  const nCrossingsMin: number = qbinom(0.05, nUseful - 1, 0.5);

  return {
    n_useful: nUseful,
    longest_run: longestRun,
    n_crossings: nCrossings,
    longest_run_max: longestRunMax,
    n_crossings_min: nCrossingsMin,
    long_run_signal: longestRun > longestRunMax,
    few_crossings_signal: nCrossings < nCrossingsMin
  };
}
