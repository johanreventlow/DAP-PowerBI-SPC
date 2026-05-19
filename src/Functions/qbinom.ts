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
 * Implementation: incremental log-PMF recurrence in log-space, walking
 * k=0..n until the cumulative reaches p. Each step is two log-evaluations
 * plus one exp; no lgamma calls in the hot path.
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

  // Incremental log-PMF avoids ~2n lgamma calls inside the hot path.
  // PMF(k+1) / PMF(k) = (n-k)/(k+1) * prob/(1-prob), so the log-ratio
  // is added per step rather than recomputing two factorials each time.
  let logPmf: number = n * log1mProb;
  let cumulative: number = Math.exp(logPmf);
  if (cumulative >= p) return 0;

  for (let k: number = 0; k < n; k++) {
    logPmf += Math.log((n - k) / (k + 1)) + logProb - log1mProb;
    cumulative += Math.exp(logPmf);
    if (cumulative >= p) {
      return k + 1;
    }
  }

  return n;
}
