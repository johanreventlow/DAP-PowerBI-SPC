/**
 * Anhøj long-run rule.
 *
 * Detects "unusually long run" of consecutive observations on the same side
 * of the centerline. The threshold is dynamic:
 *
 *   longest_run_max = round(log2(n_useful)) + 3
 *
 * where n_useful is the count of observations NOT exactly on the centerline.
 *
 * Reference: qicharts2's runs.analysis (v0.8.1). qicharts2 returns a single
 * scalar signal per chart-part; this implementation extends the contract to
 * flag the specific points that participate in the offending run(s).
 *
 * Flagging rules (PowerBI-SPC-specific extension):
 * - When signal fires: every observation in EVERY max-length run is flagged
 *   with its side ("upper" if above centerline, "lower" if below).
 * - If multiple runs share the max length, points in all of them are flagged.
 * - Observations exactly on the centerline are excluded from run-counting
 *   and are always flagged "none" themselves.
 *
 * @param val - Observation values
 * @param centerline - Centerline value at each position (chart-type-dependent)
 * @returns Array of "upper" | "lower" | "none" flags, same length as val
 */
export default function anhojLongRun(
  val: readonly number[],
  centerline: readonly number[]
): string[] {
  const n: number = val.length;
  const result: string[] = new Array<string>(n).fill("none");

  // Collect side info for observations not on centerline
  const sides: number[] = [];          // +1 = above, -1 = below
  const usefulIndices: number[] = [];  // map: useful-idx -> original idx
  for (let i = 0; i < n; i++) {
    if (val[i] !== centerline[i]) {
      sides.push(val[i] > centerline[i] ? 1 : -1);
      usefulIndices.push(i);
    }
  }

  const nUseful: number = sides.length;
  if (nUseful < 2) {
    return result;
  }

  const longestRunMax: number = Math.round(Math.log2(nUseful)) + 3;

  // Partition into runs of consecutive same-side observations
  type Run = { start: number; end: number; side: number };
  const runs: Run[] = [];
  let runStart: number = 0;
  for (let i: number = 1; i < nUseful; i++) {
    if (sides[i] !== sides[i - 1]) {
      runs.push({ start: runStart, end: i - 1, side: sides[runStart] });
      runStart = i;
    }
  }
  runs.push({ start: runStart, end: nUseful - 1, side: sides[runStart] });

  // Find the max run length
  let longestRun: number = 0;
  for (const r of runs) {
    const len: number = r.end - r.start + 1;
    if (len > longestRun) {
      longestRun = len;
    }
  }

  // Signal fires only if longest_run STRICTLY exceeds threshold
  if (longestRun <= longestRunMax) {
    return result;
  }

  // Flag every point in every max-length run
  for (const r of runs) {
    if (r.end - r.start + 1 === longestRun) {
      const flag: string = r.side === 1 ? "upper" : "lower";
      for (let j: number = r.start; j <= r.end; j++) {
        result[usefulIndices[j]] = flag;
      }
    }
  }

  return result;
}
