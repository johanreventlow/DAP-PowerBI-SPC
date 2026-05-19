import rep from "../Functions/rep";
import { computeSides } from "./anhojShared";

export type AnhojFlag = "upper" | "lower" | "none";

/**
 * Anhøj long-run rule.
 *
 * Flags observations participating in the longest run when its length
 * exceeds the dynamic threshold:
 *
 *   longest_run_max = round(log2(n_useful)) + 3
 *
 * Reference: qicharts2 v0.8.1 runs.analysis. qicharts2 returns a single
 * scalar signal per chart-part; this implementation extends the contract
 * to flag the specific points in every max-length run.
 *
 * @param val - Observation values
 * @param centerline - Centerline value at each position
 * @returns "upper" | "lower" | "none" per input point
 */
export default function anhojLongRun(
  val: readonly number[],
  centerline: readonly number[]
): AnhojFlag[] {
  const result: AnhojFlag[] = rep("none", val.length) as AnhojFlag[];

  const { sides, usefulIndices } = computeSides(val, centerline);
  const nUseful: number = sides.length;
  if (nUseful < 2) {
    return result;
  }

  const longestRunMax: number = Math.round(Math.log2(nUseful)) + 3;

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

  let longestRun: number = 0;
  for (const r of runs) {
    const len: number = r.end - r.start + 1;
    if (len > longestRun) longestRun = len;
  }

  if (longestRun <= longestRunMax) {
    return result;
  }

  for (const r of runs) {
    if (r.end - r.start + 1 === longestRun) {
      const flag: AnhojFlag = r.side === 1 ? "upper" : "lower";
      for (let j: number = r.start; j <= r.end; j++) {
        result[usefulIndices[j]] = flag;
      }
    }
  }

  return result;
}
