/**
 * Shared helper for the Anhøj rules. Both anhojLongRun and
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
