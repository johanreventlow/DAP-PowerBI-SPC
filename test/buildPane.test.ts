import { describe, it, expect } from "vitest";
import capabilities from "../capabilities.json";
import settingsClass from "../src/Classes/settingsClass";
import spcSettings from "../src/Settings Model/spcSettings";
import buildDataView from "./helpers/buildDataView";

// Byg-ruden holdes så enkel som muligt: kun de felter, en bruger skal udfylde
// for at få et diagram. Felter, der er taget ud, er fjernet helt — Power BI
// har ingen måde at skjule et datafelt på.

describe("Byg-ruden", () => {
  const roles = (capabilities as any).dataRoles as { name: string, displayName: string }[];

  it("tilbyder kun de fire felter", () => {
    expect(roles.map(r => r.name)).toEqual(["numerators", "denominators", "key", "indicator"]);
  });

  it("kalder nøglefeltet X akse", () => {
    expect(roles.find(r => r.name === "key")!.displayName).toBe("X akse");
  });

  it("binder ikke data til et felt, der ikke findes", () => {
    const mapping = (capabilities as any).dataViewMappings[0];
    const bound: string[] = [
      ...mapping.categorical.categories.select.map((s: any) => s.for.in),
      ...mapping.categorical.values.select.map((s: any) => s.bind.to),
      ...Object.keys(mapping.conditions[0])
    ];
    const names: string[] = roles.map(r => r.name);
    expect(bound.filter(b => !names.includes(b))).toEqual([]);
  });
});

describe("Korttyper, der kræver et fjernet felt", () => {
  it("tilbyder ikke xbar og s i dropdownen", () => {
    const items: string[] = spcSettings.settingsGroups.all.chart_type.items.map(i => i.value);
    expect(items).not.toContain("xbar");
    expect(items).not.toContain("s");
  });

  it("beholder dem som gyldige, så en gammel rapport stadig åbner", () => {
    const valid: string[] = spcSettings.settingsGroups.all.chart_type.valid;
    expect(valid).toContain("xbar");
    expect(valid).toContain("s");
  });
});

describe("Formateringsruden", () => {
  const settings = new settingsClass();
  settings.update(buildDataView({ key: ["A", "B", "C"], numerators: [1, 2, 3] }), [[0, 3]]);
  const model = settings.getFormattingModel();

  it("viser ikke kortet for værdietiketter, hvis feltet er væk", () => {
    expect(model.cards.find(c => c.uid === "labels_card_uid")).toBeUndefined();
  });

  it("viser stadig de øvrige kort", () => {
    expect(model.cards.find(c => c.uid === "lines_card_uid")).toBeTruthy();
    expect(model.cards.find(c => c.uid === "spc_card_uid")).toBeTruthy();
  });
});
