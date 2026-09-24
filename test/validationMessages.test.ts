import { describe, it, expect } from "vitest";
import validateDataViewColumns from "../src/Functions/validateDataViewColumns";
import settingsClass from "../src/Classes/settingsClass";
import buildDataView from "./helpers/buildDataView";

// Fejlbeskeder, brugeren ser på lærredet, når et felt mangler. De skal være
// danske og nævne feltet ved det navn, det har i Byg-ruden.

function settingsFor(chart_type: string, dataView: any) {
  const settings = new settingsClass();
  const view = JSON.parse(JSON.stringify(dataView));
  settings.update(view, [[0, 3]]);
  settings.settings[0].spc.chart_type = chart_type;
  settings.derivedSettings[0] = new (settings.derivedSettings[0].constructor as any)(settings.settings[0].spc);
  return settings;
}

describe("Fejlbeskeder om manglende felter", () => {
  it("beder om en værdi, når ingen er bundet", () => {
    const view = buildDataView({ key: ["A", "B", "C"], numerators: [1, 2, 3] });
    view.categorical!.values = [] as any;
    expect(validateDataViewColumns([view], settingsFor("i", view)))
      .toBe("Tilføj et felt til Værdi/Tæller.");
  });

  it("beder om en nævner ved korttypens navn", () => {
    const view = buildDataView({ key: ["A", "B", "C"], numerators: [1, 2, 3] });
    expect(validateDataViewColumns([view], settingsFor("pp", view)))
      .toBe("P'-kort kræver en nævner. Tilføj et felt til Nævner.");
  });

  it("peger på en anden diagramtype, når feltet ikke længere findes", () => {
    const view = buildDataView({ key: ["A", "B", "C"], numerators: [1, 2, 3], denominators: [3, 3, 3] });
    expect(validateDataViewColumns([view], settingsFor("xbar", view)))
      .toBe("Xbar-kort kan ikke længere beregnes. Vælg en anden diagramtype.");
  });

  it("indeholder ingen engelske rester", () => {
    const view = buildDataView({ key: ["A", "B", "C"], numerators: [1, 2, 3] });
    for (const t of ["p", "pp", "u", "up"]) {
      expect(validateDataViewColumns([view], settingsFor(t, view))).not.toMatch(/requires|passed|Chart type/);
    }
  });
});
