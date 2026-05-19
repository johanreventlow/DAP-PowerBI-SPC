import anhojLongRun from "../../src/Outlier Flagging/anhojLongRun";
import shift from "../../src/Outlier Flagging/shift";
import { anhojFixtures, centerlineArray } from "./anhojFixtures";

/**
 * Sanity-check that the existing `shift` rule (fixed `n`) and the new
 * `anhojLongRun` rule (dynamic threshold) produce DIFFERENT behavior on
 * the same data. This is intentional — they implement different SPC
 * rules — and the test documents the expected divergence.
 */
describe("anhojLongRun vs shift (rule contrast)", () => {
    it("'boundary_run_at_max' (run=7): shift(n=7) fires, anhoj does NOT (threshold=7 strict >)", () => {
        const fx = anhojFixtures.find(f => f.name === "boundary_run_at_max")!;
        const centerline = centerlineArray(fx);

        const shiftFlags = shift(fx.values, centerline, 7);
        const anhojFlags = anhojLongRun(fx.values, centerline);

        // shift uses >= n → run of 7 with n=7 fires
        expect(shiftFlags.some(f => f !== "none")).toBe(true);
        // anhoj uses > longest_run_max=7 → run of 7 does NOT fire
        expect(anhojFlags.every(f => f === "none")).toBe(true);
    });

    it("'boundary_run_over_max' (run=8): both fire, but on different points", () => {
        const fx = anhojFixtures.find(f => f.name === "boundary_run_over_max")!;
        const centerline = centerlineArray(fx);

        const shiftFlags = shift(fx.values, centerline, 8);
        const anhojFlags = anhojLongRun(fx.values, centerline);

        expect(shiftFlags.some(f => f !== "none")).toBe(true);
        expect(anhojFlags.some(f => f !== "none")).toBe(true);
        // Both flag the 8-point run at indices 1..8
        for (let i: number = 1; i <= 8; i++) {
            expect(anhojFlags[i]).toBe("upper");
        }
    });

    it("'normal_series' (max run=2): neither fires", () => {
        const fx = anhojFixtures.find(f => f.name === "normal_series")!;
        const centerline = centerlineArray(fx);

        const shiftFlags = shift(fx.values, centerline, 7);
        const anhojFlags = anhojLongRun(fx.values, centerline);

        expect(shiftFlags.every(f => f === "none")).toBe(true);
        expect(anhojFlags.every(f => f === "none")).toBe(true);
    });
});
