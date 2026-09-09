import { describe, it, expect } from "vitest";
import { anhojRunsAnalysis } from "../../src/Outlier Flagging/anhojShared";
import anhojLongRun from "../../src/Outlier Flagging/anhojLongRun";
import anhojFewCrossings from "../../src/Outlier Flagging/anhojFewCrossings";
import { anhojFixtures, centerlineArray } from "./anhojFixtures";

// The two rules only ever exposed their verdict. The signal panel and the
// tooltip need the counts behind it, so anhojRunsAnalysis returns the whole
// object. These assertions lock every field against qicharts2 v0.8.1 rather
// than just the two booleans the rules used to return.
describe("anhojRunsAnalysis — full statistics vs qicharts2 fixtures", () => {
  anhojFixtures.forEach(fixture => {
    it(`matches qicharts2 for ${fixture.name}`, () => {
      const centerline: number[] = centerlineArray(fixture);
      const res = anhojRunsAnalysis(fixture.values, centerline);

      expect(res.n_useful).toBe(fixture.stats.n_useful);
      expect(res.longest_run).toBe(fixture.stats.longest_run);
      expect(res.n_crossings).toBe(fixture.stats.n_crossings);
      expect(res.longest_run_max).toBe(fixture.stats.longest_run_max);
      expect(res.n_crossings_min).toBe(fixture.stats.n_crossings_min);
      expect(res.long_run_signal).toBe(fixture.stats.long_run_signal);
      expect(res.few_crossings_signal).toBe(fixture.stats.few_crossings_signal);
    });
  });
});

// The rules are now thin wrappers. If they ever drift from the analysis they
// wrap, the dashed centerline would disagree with the numbers printed beside
// it — which is worse than either being wrong alone.
describe("anhojLongRun / anhojFewCrossings agree with the analysis they wrap", () => {
  anhojFixtures.forEach(fixture => {
    it(`stays consistent for ${fixture.name}`, () => {
      const centerline: number[] = centerlineArray(fixture);
      const res = anhojRunsAnalysis(fixture.values, centerline);

      expect(anhojLongRun(fixture.values, centerline)).toBe(res.long_run_signal);
      expect(anhojFewCrossings(fixture.values, centerline)).toBe(res.few_crossings_signal);
    });
  });
});

describe("anhojRunsAnalysis — degenerate series", () => {
  it("reports NA-equivalent nulls when fewer than two observations are useful", () => {
    const res = anhojRunsAnalysis([5, 5, 5], [5, 5, 5]);
    expect(res.n_useful).toBe(0);
    expect(res.longest_run).toBeNull();
    expect(res.n_crossings).toBeNull();
    expect(res.longest_run_max).toBeNull();
    expect(res.n_crossings_min).toBeNull();
    expect(res.long_run_signal).toBe(false);
    expect(res.few_crossings_signal).toBe(false);
  });

  it("drops non-finite values rather than counting them as a side", () => {
    const vals = [1, NaN, 9, undefined as unknown as number, 2];
    const res = anhojRunsAnalysis(vals, new Array<number>(vals.length).fill(5));
    expect(res.n_useful).toBe(3);
    expect(res.longest_run).toBe(1);
    expect(res.n_crossings).toBe(2);
  });
});
