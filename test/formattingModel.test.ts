import { describe, it, expect } from "vitest";
import settingsClass from "../src/Classes/settingsClass";
import buildDataView from "./helpers/buildDataView";

// Proves the FormattingModel produced by settingsClass.getFormattingModel()
// includes the Signal Detection group with both toggles. If this passes but
// the group is still missing in Power BI Desktop, the bug is host-side
// (cache, version skew, model rejection) — not in the bundle.
describe("FormattingModel — Signal Detection group", () => {
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

    it("outliers card contains a Signal Detection group", () => {
        const signalGroup = outliersCard?.groups.find(g => g.displayName === "Signaldetektion");
        expect(signalGroup).toBeTruthy();
    });

    it("Signal Detection group contains exactly the two toggles (no colour pickers)", () => {
        const signalGroup = outliersCard?.groups.find(g => g.displayName === "Signaldetektion");
        const sliceProps: string[] = (signalGroup?.slices ?? []).map((s: any) => {
            return s.control?.properties?.descriptor?.propertyName;
        });

        expect(sliceProps).toContain("anhoj_long_run");
        expect(sliceProps).toContain("anhoj_few_crossings");
        // Per-point flagging removed (qicharts2 parity) — colour pickers gone
        expect(sliceProps.length).toBe(2);
    });

    it("Signal Detection slice descriptors target the outliers object", () => {
        const signalGroup = outliersCard?.groups.find(g => g.displayName === "Signaldetektion");
        (signalGroup?.slices ?? []).forEach((slice: any) => {
            expect(slice.control?.properties?.descriptor?.objectName).toBe("outliers");
        });
    });
});

// The signal panel is a separate card. Every property here must also exist in
// capabilities.json, or Power BI accepts the slice but never persists what the
// user sets — a failure that looks like "the setting doesn't stick".
describe("FormattingModel — Signal Panel card", () => {
    const settings = new settingsClass();
    const dataView = buildDataView({
        key: ["A", "B", "C", "D", "E"],
        numerators: [1, 2, 3, 4, 5]
    });
    settings.update(dataView, [[0, 5]]);
    const model = settings.getFormattingModel();
    const card = model.cards.find(c => c.uid === "signal_panel_card_uid");

    it("card exists in the formatting model", () => {
        expect(card).toBeTruthy();
    });

    it("exposes the panel, label and tooltip groups", () => {
        const names = (card?.groups ?? []).map(g => g.displayName);
        expect(names).toContain("Panel");
        expect(names).toContain("Etiketter");
        expect(names).toContain("Tooltip");
    });

    it("every slice targets the signal_panel object", () => {
        (card?.groups ?? []).forEach(group => {
            (group.slices ?? []).forEach((slice: any) => {
                expect(slice.control?.properties?.descriptor?.objectName).toBe("signal_panel");
            });
        });
    });

    it("carries the settings the panel and tooltip read", () => {
        const props: string[] = (card?.groups ?? []).flatMap(g =>
            (g.slices ?? []).map((s: any) => s.control?.properties?.descriptor?.propertyName));

        ["show_panel", "panel_width", "panel_hide_below_width", "panel_periods",
         "panel_show_n_useful", "label_longest_run", "label_crossings",
         "label_beyond_limits", "label_n_useful", "ttip_show_signals",
         "ttip_label_expected"].forEach(name => {
            expect(props).toContain(name);
        });
    });
});
