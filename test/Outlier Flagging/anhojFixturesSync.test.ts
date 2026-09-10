import { describe, it, expect } from "vitest";
import { anhojFixtures } from "./anhojFixtures";
import fixturesJson from "./anhoj-fixtures.json";

// anhoj-fixtures.json is what the R script writes and is the canonical
// reference; anhojFixtures.ts is a hand-maintained TypeScript copy that every
// other test reads. Nothing connected the two, so the copy had silently
// drifted: large_n_normal held a different series than R generated, and the
// tests passed anyway because both series happen to sit the same way around
// the median. Regenerating the fixtures would not have changed a single test.
//
// This asserts the copy still mirrors the JSON, so drift fails loudly here
// rather than quietly weakening every assertion built on it.

type jsonStats = {
  n_useful: number;
  longest_run: number | "NA";
  n_crossings: number | "NA";
  longest_run_max: number | "NA";
  n_crossings_min: number | "NA";
  long_run_signal: boolean;
  few_crossings_signal: boolean;
};

type jsonFixture = {
  name: string;
  values: number[];
  centerline_median: number;
  stats: jsonStats;
};

// The R script writes NA for a series with too few usable observations;
// jsonlite serialises it as the string "NA", which the copy stores as null.
function fromNA(value: number | "NA"): number | null {
  return value === "NA" ? null : value;
}

describe("anhojFixtures.ts mirrors anhoj-fixtures.json", () => {
  const json = fixturesJson as jsonFixture[];

  it("covers exactly the same fixtures, in the same order", () => {
    expect(anhojFixtures.map(f => f.name)).toEqual(json.map(f => f.name));
  });

  json.forEach((expected: jsonFixture, idx: number) => {
    it(`matches the generated fixture for ${expected.name}`, () => {
      const actual = anhojFixtures[idx];
      expect(actual.values).toEqual(expected.values);
      expect(actual.centerline_median).toBe(expected.centerline_median);
      expect(actual.stats).toEqual({
        n_useful: expected.stats.n_useful,
        longest_run: fromNA(expected.stats.longest_run),
        n_crossings: fromNA(expected.stats.n_crossings),
        longest_run_max: fromNA(expected.stats.longest_run_max),
        n_crossings_min: fromNA(expected.stats.n_crossings_min),
        long_run_signal: expected.stats.long_run_signal,
        few_crossings_signal: expected.stats.few_crossings_signal
      });
    });
  });
});
