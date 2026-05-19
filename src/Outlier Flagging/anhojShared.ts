/**
 * Shared helpers for the Anhøj rules. Both anhojLongRun and
 * anhojFewCrossings need to map observations to their side of the
 * centerline while filtering out ties on the centerline itself.
 */

export type AnhojSideMap = {
  /** +1 if above centerline, -1 if below. Length = n_useful. */
  sides: number[];
  /** Original index into val for each entry in sides. */
  usefulIndices: number[];
};

/**
 * Map each observation to its side of the centerline using Math.sign,
 * dropping ties (observations exactly on the centerline). Matches the
 * convention in qicharts2's runs.analysis where n_useful excludes
 * on-centerline points.
 */
export function computeSides(
  val: readonly number[],
  centerline: readonly number[]
): AnhojSideMap {
  const sides: number[] = [];
  const usefulIndices: number[] = [];
  for (let i: number = 0; i < val.length; i++) {
    const s: number = Math.sign(val[i] - centerline[i]);
    if (s !== 0) {
      sides.push(s);
      usefulIndices.push(i);
    }
  }
  return { sides, usefulIndices };
}
