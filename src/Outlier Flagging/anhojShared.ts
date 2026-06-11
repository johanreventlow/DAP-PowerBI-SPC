import qbinom from "../Functions/qbinom";

/**
 * Shared helpers for the Anhøj rules. Both anhojLongRun and
 * anhojFewCrossings need to map observations to their side of the
 * centerline while filtering out ties on the centerline itself.
 */

/**
 * Runs-analysis statistics for one chart part, matching qicharts2's
 * summary(): n_useful, longest run + dynamic threshold, crossings +
 * binomial threshold, and the derived signals. Thresholds and counts
 * are null when nUseful < 2 (qicharts2 reports NA).
 */
export type AnhojStats = {
  nUseful: number;
  longestRun: number | null;
  longestRunMax: number | null;
  nCrossings: number | null;
  nCrossingsMin: number | null;
  longRunSignal: boolean;
  fewCrossingsSignal: boolean;
};

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
 * Compute the full Anhøj runs-analysis for one chart part.
 *
 *   longest_run_max = round(log2(n_useful)) + 3
 *   n_crossings_min = qbinom(0.05, n_useful - 1, 0.5)
 *
 * Signals use strict comparisons, exactly as qicharts2 v0.8.1
 * runs.analysis / crsignal(method = "anhoej").
 */
export function anhojStats(
  val: readonly number[],
  centerline: readonly number[]
): AnhojStats {
  const sides: number[] = computeSides(val, centerline);
  const nUseful: number = sides.length;
  if (nUseful < 2) {
    return {
      nUseful: nUseful,
      longestRun: null,
      longestRunMax: null,
      nCrossings: null,
      nCrossingsMin: null,
      longRunSignal: false,
      fewCrossingsSignal: false
    };
  }

  let longestRun: number = 1;
  let currentRun: number = 1;
  let nCrossings: number = 0;
  for (let i: number = 1; i < nUseful; i++) {
    if (sides[i] === sides[i - 1]) {
      currentRun++;
    } else {
      currentRun = 1;
      nCrossings++;
    }
    if (currentRun > longestRun) longestRun = currentRun;
  }

  const longestRunMax: number = Math.round(Math.log2(nUseful)) + 3;
  const nCrossingsMin: number = qbinom(0.05, nUseful - 1, 0.5);

  return {
    nUseful,
    longestRun,
    longestRunMax,
    nCrossings,
    nCrossingsMin,
    longRunSignal: longestRun > longestRunMax,
    fewCrossingsSignal: nCrossings < nCrossingsMin
  };
}
