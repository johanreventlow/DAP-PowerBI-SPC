import { describe, it, expect } from "vitest";
import { anhojStats } from "../../src/Outlier Flagging/anhojShared";
import { anhojFixtures, centerlineArray } from "./anhojFixtures";

describe("anhojStats", () => {
    describe("fixture parity (vs qicharts2 0.8.1)", () => {
        anhojFixtures.forEach(fx => {
            it(`'${fx.name}': all stats match qicharts2`, () => {
                const stats = anhojStats(fx.values, centerlineArray(fx));

                expect(stats.nUseful).toBe(fx.stats.n_useful);
                expect(stats.longestRun).toBe(fx.stats.longest_run);
                expect(stats.longestRunMax).toBe(fx.stats.longest_run_max);
                expect(stats.nCrossings).toBe(fx.stats.n_crossings);
                expect(stats.nCrossingsMin).toBe(fx.stats.n_crossings_min);
                expect(stats.longRunSignal).toBe(fx.stats.long_run_signal);
                expect(stats.fewCrossingsSignal).toBe(fx.stats.few_crossings_signal);
            });
        });
    });

    it("degenerate series (nUseful < 2): null stats, false signals", () => {
        const stats = anhojStats([5, 5, 5], [5, 5, 5]);
        expect(stats.nUseful).toBe(0);
        expect(stats.longestRun).toBeNull();
        expect(stats.longestRunMax).toBeNull();
        expect(stats.nCrossings).toBeNull();
        expect(stats.nCrossingsMin).toBeNull();
        expect(stats.longRunSignal).toBe(false);
        expect(stats.fewCrossingsSignal).toBe(false);
    });
});
