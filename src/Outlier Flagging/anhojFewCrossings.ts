import qbinom from "../Functions/qbinom";

/**
 * Anhøj few-crossings rule.
 *
 * Detects "unusually few crossings" of the centerline. A crossing is a
 * transition between sides (above ↔ below). The threshold is:
 *
 *   n_crossings_min = qbinom(0.05, n_useful - 1, 0.5)
 *
 * where n_useful is the count of observations NOT exactly on the centerline.
 *
 * Few crossings is a GLOBAL property of the series — not a point-level
 * attribute. This function returns a single boolean indicating whether the
 * signal fires for the whole input. The caller is responsible for combining
 * this with point-level outputs (e.g. dashing the centerline rather than
 * flagging individual points).
 *
 * Reference: qicharts2's runs.analysis (v0.8.1), which returns the same
 * scalar signal per chart-part.
 *
 * @param val - Observation values
 * @param centerline - Centerline value at each position
 * @returns true if signal fires (n_crossings < n_crossings_min), else false
 */
export default function anhojFewCrossings(
  val: readonly number[],
  centerline: readonly number[]
): boolean {
  const n: number = val.length;

  // Collect sides for observations not on centerline
  const sides: number[] = [];
  for (let i: number = 0; i < n; i++) {
    if (val[i] !== centerline[i]) {
      sides.push(val[i] > centerline[i] ? 1 : -1);
    }
  }

  const nUseful: number = sides.length;
  if (nUseful < 2) {
    return false;
  }

  // Count side transitions
  let nCrossings: number = 0;
  for (let i: number = 1; i < nUseful; i++) {
    if (sides[i] !== sides[i - 1]) {
      nCrossings++;
    }
  }

  const nCrossingsMin: number = qbinom(0.05, nUseful - 1, 0.5);

  return nCrossings < nCrossingsMin;
}
