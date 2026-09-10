import spcSettings from "../../src/Settings Model/spcSettings";
import { defaultSettings } from "../../src/settings";
import { describe, it, expect } from "vitest";

// qicharts2's `formals(qic)$chart` har "run" først, og et seriediagram er det
// eneste, der ikke antager noget om fordelingen. Defaulten er derfor et bevidst
// valg og ikke en tilfældighed — den låses her, så den ikke driver tilbage.

describe("Default diagramtype", () => {
  it("er run, som i qicharts2", () => {
    expect(spcSettings.settingsGroups.all.chart_type.default).toBe("run");
  });

  it("slår igennem i de settings, visualen faktisk starter med", () => {
    expect(defaultSettings.spc.chart_type).toBe("run");
  });
});
