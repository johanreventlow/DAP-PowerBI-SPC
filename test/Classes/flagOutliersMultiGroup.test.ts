import { describe, it, expect } from "vitest";
import viewModelClass from "../../src/Classes/viewModelClass";
import type { defaultSettingsType } from "../../src/Classes/settingsClass";
import type derivedSettingsClass from "../../src/Classes/derivedSettingsClass";
import { anhojFixtures } from "../Outlier Flagging/anhojFixtures";

// Locks the per-group Anhøj signal contract: in multi-group charts
// (split/rebaseline) each group is evaluated in isolation, so a signal
// in one group must not leak into its neighbours. Uses the qicharts2-
// verified fixtures as group data. (Task 8.3 — previously deferred.)
describe("flagOutliers — multi-group Anhøj signals", () => {
    const groupNames = ["boundary_run_over_max", "normal_series", "boundary_crossings_below_min"] as const;
    const groups = groupNames.map(name => anhojFixtures.find(f => f.name === name)!);

    const values: number[] = groups.flatMap(g => g.values);
    const targets: number[] = groups.flatMap(g => g.values.map(() => g.centerline_median));
    const groupStartEndIndexes: number[][] = [];
    let cursor = 0;
    groups.forEach(g => {
        groupStartEndIndexes.push([cursor, cursor + g.values.length]);
        cursor += g.values.length;
    });

    const settings = {
        outliers: {
            astronomical: false,
            anhoj_long_run: true,
            anhoj_few_crossings: true
        }
    } as unknown as defaultSettingsType;

    const derivedSettings = {
        chart_type_props: { has_control_limits: false }
    } as unknown as derivedSettingsClass;

    const vm = new viewModelClass();
    const outliers = vm.flagOutliers(
        { values, targets } as never,
        groupStartEndIndexes,
        settings,
        derivedSettings
    );

    it("evaluates each group in isolation (signals do not leak)", () => {
        expect(outliers.per_group_signals.length).toBe(3);
        // boundary_run_over_max: long run fires, crossings normal
        expect(outliers.per_group_signals[0]).toEqual({ long_run: true, few_crossings: false });
        // normal_series: nothing fires
        expect(outliers.per_group_signals[1]).toEqual({ long_run: false, few_crossings: false });
        // boundary_crossings_below_min: few crossings fires, run normal
        expect(outliers.per_group_signals[2]).toEqual({ long_run: false, few_crossings: true });
    });

    it("toggles off: no signals computed", () => {
        const offSettings = {
            outliers: {
                ...(settings as { outliers: Record<string, unknown> }).outliers,
                anhoj_long_run: false,
                anhoj_few_crossings: false
            }
        } as unknown as defaultSettingsType;

        const res = vm.flagOutliers(
            { values, targets } as never,
            groupStartEndIndexes,
            offSettings,
            derivedSettings
        );
        res.per_group_signals.forEach(sig => {
            expect(sig).toEqual({ long_run: false, few_crossings: false });
        });
    });
});
