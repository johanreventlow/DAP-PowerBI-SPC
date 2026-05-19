import anhojFewCrossings from "../../src/Outlier Flagging/anhojFewCrossings";
import { anhojFixtures, centerlineArray } from "./anhojFixtures";

describe("anhojFewCrossings", () => {
    describe("fixture parity (vs qicharts2)", () => {
        anhojFixtures.forEach(fx => {
            it(`'${fx.name}': matches few_crossings_signal=${fx.stats.few_crossings_signal}`, () => {
                const result = anhojFewCrossings(fx.values, centerlineArray(fx));
                expect(result).toBe(fx.stats.few_crossings_signal);
            });
        });
    });

    describe("edge cases", () => {
        it("all observations on centerline: returns false (n_useful < 2)", () => {
            const val = [5, 5, 5, 5];
            const centerline = [5, 5, 5, 5];
            expect(anhojFewCrossings(val, centerline)).toBe(false);
        });

        it("single useful observation: returns false", () => {
            const val = [5, 5, 7, 5];
            const centerline = [5, 5, 5, 5];
            expect(anhojFewCrossings(val, centerline)).toBe(false);
        });

        it("operator is strict < (crossings AT threshold does not fire)", () => {
            // boundary_crossings_at_min: crossings=6, min=6, signal must be FALSE
            const fx = anhojFixtures.find(f => f.name === "boundary_crossings_at_min")!;
            expect(anhojFewCrossings(fx.values, centerlineArray(fx))).toBe(false);
        });

        it("crossings below threshold fires", () => {
            const fx = anhojFixtures.find(f => f.name === "boundary_crossings_below_min")!;
            expect(anhojFewCrossings(fx.values, centerlineArray(fx))).toBe(true);
        });
    });
});
