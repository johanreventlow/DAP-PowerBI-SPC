import anhojLongRun from "../../src/Outlier Flagging/anhojLongRun";
import { anhojFixtures, centerlineArray } from "./anhojFixtures";

describe("anhojLongRun", () => {
    describe("fixture parity (vs qicharts2 long_run_signal)", () => {
        anhojFixtures.forEach(fx => {
            it(`'${fx.name}': signal matches qicharts2 (${fx.stats.long_run_signal})`, () => {
                const centerline = centerlineArray(fx);
                expect(anhojLongRun(fx.values, centerline)).toBe(fx.stats.long_run_signal);
            });
        });
    });

    describe("edge cases", () => {
        it("all observations on centerline: no signal", () => {
            const fx = anhojFixtures.find(f => f.name === "all_ties")!;
            expect(anhojLongRun(fx.values, centerlineArray(fx))).toBe(false);
        });

        it("observations exactly on centerline are excluded from runs", () => {
            // 6 over centerline i træk, men afbrudt af ties — ties bryder
            // IKKE et run (de filtreres fra, jf. qicharts2 n_useful)
            const val = [1, 7, 6, 5, 8, 9, 5, 7, 6, 1];
            const centerline = new Array<number>(10).fill(5);
            // useful sides: -1, +1, +1, +1, +1, +1, +1, -1 → longest run 6,
            // n_useful=8 → threshold round(log2(8))+3 = 6 → 6 > 6 falsk
            expect(anhojLongRun(val, centerline)).toBe(false);
        });

        it("operator is strict > (run AT threshold does not fire)", () => {
            const fx = anhojFixtures.find(f => f.name === "boundary_run_at_max")!;
            expect(anhojLongRun(fx.values, centerlineArray(fx))).toBe(false);
        });

        it("fewer than 2 useful observations: no signal", () => {
            expect(anhojLongRun([5], [3])).toBe(false);
            expect(anhojLongRun([], [])).toBe(false);
        });

        it("non-finite observations are excluded (parity with R NA-drop)", () => {
            // 9 finite punkter over centerline + NaN/null-huller.
            // n_useful=9 → threshold round(log2(9))+3 = 6 → run af 9 > 6 → signal
            const val = [7, 8, NaN, 9, 7, null as unknown as number, 8, 9, 7, 8, 9];
            const centerline = new Array<number>(11).fill(5);
            expect(anhojLongRun(val, centerline)).toBe(true);
        });
    });
});
