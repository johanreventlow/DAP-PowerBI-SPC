import { defaultSettings } from "../src/settings";
import { testDom, createVisualHost } from "powerbi-visuals-utils-testutils";
import { Visual } from "../src/visual";
import buildDataView from "./helpers/buildDataView";
import { describe, it, expect } from "vitest";

// Mållinjen (alt_target) er den eneste indstilling, der udelukkende læses
// gennem den betingede formatering — se extractInputData. Falder en række
// tilbage til de hardkodede defaults, er målværdien undefined for netop den
// række, og linjen får huller. Den er derfor værd at holde fast.

const keys: string[] = Array.from({length: 12}, (_, i) => `2024-${String(i + 1).padStart(2, "0")}-01`);
const numerators: number[] = [50,52,49,51,53,48,50,52,49,51,50,53];

function maallinje(alt_target?: number): { punkter: number, vaerdier: (number | undefined)[] } {
  const element = testDom("800", "500");
  const visual = new Visual({ element: element, host: createVisualHost({}) });
  const settings = JSON.parse(JSON.stringify(defaultSettings));
  settings.spc.chart_type = "i";
  if (alt_target !== undefined) {
    settings.lines.show_alt_target = true;
    settings.lines.alt_target = alt_target;
  }

  visual.update({
    dataViews: [ buildDataView({ key: keys, numerators: numerators }, settings) ],
    viewport: { width: 800, height: 500 },
    type: 2 /*powerbi.VisualUpdateType.Data*/
  });

  const punkter: number = Array.from(element.querySelectorAll(".alt_targets-linegroup"))
    .flatMap(g => Array.from(g.querySelectorAll("path, line")))
    .map(el => el.tagName === "line" ? 2 : ((el.getAttribute("d") ?? "").match(/[ML]/g) ?? []).length)
    .reduce((a, b) => a + b, 0);
  const vaerdier = ((visual as any).viewModel.controlLimits[0].alt_targets ?? []) as (number | undefined)[];
  element.remove();
  return { punkter, vaerdier };
}

describe("Mållinje", () => {
  it("tegnes ikke, når den er slået fra", () => {
    expect(maallinje().punkter).toBe(0);
  });

  it("når ud til alle datapunkter", () => {
    // Ikke kun det første: en målværdi gælder hele serien.
    expect(maallinje(55).vaerdier).toEqual(new Array<number>(12).fill(55));
  });

  it("tegnes som én sammenhængende linje", () => {
    expect(maallinje(55).punkter).toBe(12);
  });

  it("tegnes også når målet ligger langt fra data", () => {
    // Målet flytter y-aksen. Både linjen og de øvrige linjer skal stadig med.
    expect(maallinje(200).punkter).toBe(12);
    expect(maallinje(-50).punkter).toBe(12);
  });
});
