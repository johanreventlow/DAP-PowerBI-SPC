import lgamma from "./lgamma";

/**
 * Quantile function for the binomial distribution.
 *
 * Returns the smallest integer k such that P(X <= k) >= p, where
 * X follows a Binomial(n, prob) distribution. Matches R's qbinom()
 * with default lower.tail = TRUE, log.p = FALSE.
 *
 * Used by the Anhøj few-crossings rule to compute the lower
 * threshold for the expected number of median crossings:
 *
 *   n_crossings_min = qbinom(0.05, n_useful - 1, 0.5)
 *
 * Implementation: log-space PMF accumulation via lgamma to avoid
 * overflow for large n. Linear search from k=0 upward (Anhøj
 * use-cases typically have n < 200, so worst case is ~100 iterations).
 *
 * @param p - Probability in (0, 1)
 * @param n - Non-negative integer, number of trials
 * @param prob - Success probability per trial, in [0, 1]
 * @returns The smallest k such that P(X <= k) >= p
 * @throws RangeError if inputs are out of valid range
 */
export default function qbinom(p: number, n: number, prob: number): number {
  if (!Number.isFinite(p) || p <= 0 || p >= 1) {
    throw new RangeError(`qbinom: p must be in (0, 1); got ${p}`);
  }
  if (!Number.isInteger(n) || n < 0) {
    throw new RangeError(`qbinom: n must be a non-negative integer; got ${n}`);
  }
  if (!Number.isFinite(prob) || prob < 0 || prob > 1) {
    throw new RangeError(`qbinom: prob must be in [0, 1]; got ${prob}`);
  }

  if (n === 0) {
    return 0;
  }
  if (prob === 0) {
    return 0;
  }
  if (prob === 1) {
    return n;
  }

  const logProb: number = Math.log(prob);
  const log1mProb: number = Math.log(1 - prob);
  const lgammaN1: number = lgamma(n + 1);

  let cumulative: number = 0;
  for (let k: number = 0; k <= n; k++) {
    // log P(X = k) = lgamma(n+1) - lgamma(k+1) - lgamma(n-k+1)
    //              + k * log(prob) + (n - k) * log(1 - prob)
    const logPmf: number = lgammaN1 - lgamma(k + 1) - lgamma(n - k + 1)
                          + k * logProb + (n - k) * log1mProb;
    cumulative += Math.exp(logPmf);
    if (cumulative >= p) {
      return k;
    }
  }

  // Fallback for fp drift at k = n
  return n;
}
