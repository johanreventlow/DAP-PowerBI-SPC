import { describe, it, expect } from "vitest";
import settingsClass from "../src/Classes/settingsClass";
import buildDataView from "./helpers/buildDataView";

// Proves the FormattingModel produced by settingsClass.getFormattingModel()
// includes the Anhøj-regler group with both toggles. If this passes but
// the group is still missing in Power BI Desktop, the bug is host-side
// (cache, version skew, model rejection) — not in the bundle.
describe("FormattingModel — Anhøj-regler group", () => {
    const settings = new settingsClass();
    const dataView = buildDataView({
        key: ["A", "B", "C", "D", "E"],
        numerators: [1, 2, 3, 4, 5]
    });
    settings.update(dataView, [[0, 5]]);
    const model = settings.getFormattingModel();
    const outliersCard = model.cards.find(c => c.uid === "outliers_card_uid");

    it("outliers card exists in the formatting model", () => {
        expect(outliersCard).toBeTruthy();
    });

    it("outliers card contains an Anhøj-regler group", () => {
        const anhoejGroup = outliersCard?.groups.find(g => g.displayName === "Anhøj-regler");
        expect(anhoejGroup).toBeTruthy();
    });

    it("Anhøj-regler group contains dash toggles plus stats-display settings", () => {
        const anhoejGroup = outliersCard?.groups.find(g => g.displayName === "Anhøj-regler");
        const sliceProps: string[] = (anhoejGroup?.slices ?? []).map((s: any) => {
            return s.control?.properties?.descriptor?.propertyName;
        });

        expect(sliceProps).toContain("anhoj_long_run");
        expect(sliceProps).toContain("anhoj_few_crossings");
        expect(sliceProps).toContain("show_anhoj_stats");
        expect(sliceProps).toContain("anhoj_stats_label_run");
        expect(sliceProps).toContain("anhoj_stats_label_crossings");
        expect(sliceProps).toContain("anhoj_stats_font");
        expect(sliceProps).toContain("anhoj_stats_size");
        expect(sliceProps).toContain("anhoj_stats_colour");
        expect(sliceProps.length).toBe(8);
    });

    it("Anhoej slice descriptors target the outliers object", () => {
        const anhoejGroup = outliersCard?.groups.find(g => g.displayName === "Anhøj-regler");
        (anhoejGroup?.slices ?? []).forEach((slice: any) => {
            expect(slice.control?.properties?.descriptor?.objectName).toBe("outliers");
        });
    });

    it("outliers card contains exactly the two Danish outlier groups", () => {
        const groupNames = (outliersCard?.groups ?? []).map(g => g.displayName);
        expect(groupNames).toEqual(["Punkter uden for kontrolgrænser", "Anhøj-regler"]);
    });
});
