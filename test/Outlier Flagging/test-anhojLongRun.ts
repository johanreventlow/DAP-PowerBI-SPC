import anhojLongRun from "../../src/Outlier Flagging/anhojLongRun";
import { anhojFixtures, centerlineArray } from "./anhojFixtures";

describe("anhojLongRun", () => {
    describe("fixture parity (vs qicharts2 + own contract)", () => {
        anhojFixtures.forEach(fx => {
            it(`'${fx.name}': flag-count consistent with long_run_signal`, () => {
                const centerline = centerlineArray(fx);
                const flags = anhojLongRun(fx.values, centerline);

                expect(flags.length).toBe(fx.values.length);

                const flaggedCount = flags.filter(f => f !== "none").length;

                if (fx.stats.long_run_signal) {
                    // Signal fires: at least one max-length run is flagged.
                    // Total flagged points >= longest_run (one max-length run worth).
                    expect(flaggedCount).toBeGreaterThanOrEqual(fx.stats.longest_run!);
                } else {
                    // No signal: every flag is "none"
                    expect(flaggedCount).toBe(0);
                }
            });
        });
    });

    describe("specific point-flag assertions", () => {
        it("'boundary_run_over_max': flags exactly the 8 'upper' points", () => {
            // Pattern: Z HHHHHHHH Z H Z H ZZZZZZZ → run of 8 hundreds at indices 1..8
            const fx = anhojFixtures.find(f => f.name === "boundary_run_over_max")!;
            const flags = anhojLongRun(fx.values, centerlineArray(fx));

            const expected: string[] = new Array<string>(20).fill("none");
            for (let i: number = 1; i <= 8; i++) {
                expected[i] = "upper";
            }
            expect(flags).toEqual(expected);
        });

        it("'long_run_only': flags the 9-point upper run at indices 7..15", () => {
            const fx = anhojFixtures.find(f => f.name === "long_run_only")!;
            const flags = anhojLongRun(fx.values, centerlineArray(fx));

            // Values 11,12,10,13,11,12,10,13,11 are at original positions 7..15
            for (let i: number = 7; i <= 15; i++) {
                expect(flags[i]).toBe("upper");
            }
            // Points outside the run (and the tie-on-median at index 3 and 18) are "none"
            expect(flags[0]).toBe("none");
            expect(flags[6]).toBe("none");
            expect(flags[16]).toBe("none");
        });
    });

    describe("edge cases", () => {
        it("all observations on centerline: returns all 'none'", () => {
            const fx = anhojFixtures.find(f => f.name === "all_ties")!;
            const flags = anhojLongRun(fx.values, centerlineArray(fx));
            expect(flags).toEqual(new Array<string>(12).fill("none"));
        });

        it("observations exactly on centerline are flagged 'none' themselves", () => {
            // Custom: 1,2,3,5,5,7,6,8,9,5 with centerline=5 → ties at indices 3,4,9
            const val = [1, 2, 3, 5, 5, 7, 6, 8, 9, 5];
            const centerline = new Array<number>(10).fill(5);
            const flags = anhojLongRun(val, centerline);
            expect(flags[3]).toBe("none");
            expect(flags[4]).toBe("none");
            expect(flags[9]).toBe("none");
        });

        it("returns array of same length as input", () => {
            const val = [1, 2, 3];
            const centerline = [2, 2, 2];
            const flags = anhojLongRun(val, centerline);
            expect(flags.length).toBe(3);
        });

        it("operator is strict > (run AT threshold does not fire)", () => {
            const fx = anhojFixtures.find(f => f.name === "boundary_run_at_max")!;
            const flags = anhojLongRun(fx.values, centerlineArray(fx));
            expect(flags.every(f => f === "none")).toBe(true);
        });
    });
});
