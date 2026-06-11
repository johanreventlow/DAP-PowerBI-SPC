import anhojLongRun from "../../src/Outlier Flagging/anhojLongRun";
import shift from "../../src/Outlier Flagging/shift";
import { anhojFixtures, centerlineArray } from "./anhojFixtures";

/**
 * Sanity-check that the existing `shift` rule (fixed `n`, per-point flags)
 * and the `anhojLongRun` rule (dynamic threshold, series-level signal)
 * produce DIFFERENT behavior on the same data. This is intentional — they
 * implement different SPC rules — and the test documents the divergence.
 */
describe("anhojLongRun vs shift (rule contrast)", () => {
    it("'boundary_run_at_max' (run=7): shift(n=7) fires, anhoj does NOT (threshold=7 strict >)", () => {
        const fx = anhojFixtures.find(f => f.name === "boundary_run_at_max")!;
        const centerline = centerlineArray(fx);

        // shift uses >= n → run of 7 with n=7 fires
        expect(shift(fx.values, centerline, 7).some(f => f !== "none")).toBe(true);
        // anhoj uses > longest_run_max=7 → run of 7 does NOT fire
        expect(anhojLongRun(fx.values, centerline)).toBe(false);
    });

    it("'boundary_run_over_max' (run=8): both fire", () => {
        const fx = anhojFixtures.find(f => f.name === "boundary_run_over_max")!;
        const centerline = centerlineArray(fx);

        expect(shift(fx.values, centerline, 8).some(f => f !== "none")).toBe(true);
        expect(anhojLongRun(fx.values, centerline)).toBe(true);
    });

    it("'normal_series' (max run=2): neither fires", () => {
        const fx = anhojFixtures.find(f => f.name === "normal_series")!;
        const centerline = centerlineArray(fx);

        expect(shift(fx.values, centerline, 7).every(f => f === "none")).toBe(true);
        expect(anhojLongRun(fx.values, centerline)).toBe(false);
    });
});
