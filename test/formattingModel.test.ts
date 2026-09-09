import { describe, it, expect } from "vitest";
import settingsClass from "../src/Classes/settingsClass";
import buildDataView from "./helpers/buildDataView";

// Proves the FormattingModel produced by settingsClass.getFormattingModel()
// includes the Anhøj Rules group with both toggles. If this passes but
// the group is still missing in Power BI Desktop, the bug is host-side
// (cache, version skew, model rejection) — not in the bundle.
describe("FormattingModel — Anhøj Rules group", () => {
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

    it("outliers card contains an Anhøj Rules group", () => {
        const anhojGroup = outliersCard?.groups.find(g => g.displayName === "Anhøj Rules");
        expect(anhojGroup).toBeTruthy();
    });

    it("Anhøj Rules group contains exactly the two toggles (no colour pickers)", () => {
        const anhojGroup = outliersCard?.groups.find(g => g.displayName === "Anhøj Rules");
        const sliceProps: string[] = (anhojGroup?.slices ?? []).map((s: any) => {
            return s.control?.properties?.descriptor?.propertyName;
        });

        expect(sliceProps).toContain("anhoj_long_run");
        expect(sliceProps).toContain("anhoj_few_crossings");
        // Per-point flagging removed (qicharts2 parity) — colour pickers gone
        expect(sliceProps.length).toBe(2);
    });

    it("Anhøj slice descriptors target the outliers object", () => {
        const anhojGroup = outliersCard?.groups.find(g => g.displayName === "Anhøj Rules");
        (anhojGroup?.slices ?? []).forEach((slice: any) => {
            expect(slice.control?.properties?.descriptor?.objectName).toBe("outliers");
        });
    });
});
