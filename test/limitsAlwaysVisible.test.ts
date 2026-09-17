import { defaultSettings } from "../src/settings";
import { testDom, createVisualHost } from "powerbi-visuals-utils-testutils";
import { Visual } from "../src/visual";
import buildDataView from "./helpers/buildDataView";
import { describe, it, expect } from "vitest";

// Skaleringsfaktoren på y-aksen må udvide aksen, men ikke skære
// kontrolgrænserne væk. drawLines dropper punkter uden for aksen, så en for
// snæver akse fik grænselinjen til at forsvinde uden besked.
//
// Det ramte især I′, hvor grænserne er punktvise: brede ved små nævnere,
// smalle ved store. Aksen nåede de smalle men ikke de brede, og linjen blev
// vist i stykker.

const keys: string[] = Array.from({length: 18}, (_, i) => `2024-${String((i % 12) + 1).padStart(2, "0")}-01`);
const numerators: number[] = [50,52,49,51,53,48,50,52,49,51,50,53,49,52,50,51,49,53];
// Nævnerne varierer kraftigt — det er hele grunden til at bruge I′
const denominators: number[] = [8,12,40,9,11,150,10,7,13,95,10,12,9,11,60,10,8,12];

function antalGraensepunkter(chart_type: string, tweak: (s: any) => void = () => undefined): number {
  const element = testDom("800", "500");
  const visual = new Visual({ element: element, host: createVisualHost({}) });
  const settings = JSON.parse(JSON.stringify(defaultSettings));
  settings.spc.chart_type = chart_type;
  tweak(settings);

  visual.update({
    dataViews: [ buildDataView({
      key: keys,
      numerators: numerators,
      denominators: chart_type === "ip" ? denominators : undefined
    }, settings) ],
    viewport: { width: 800, height: 500 },
    type: 2 /*powerbi.VisualUpdateType.Data*/
  });

  const grupper = Array.from(element.querySelectorAll(".ll99-linegroup, .ul99-linegroup"));
  const antal: number = grupper
    .flatMap(g => Array.from(g.querySelectorAll("path, line")))
    .map(el => el.tagName === "line" ? 2 : ((el.getAttribute("d") ?? "").match(/[ML]/g) ?? []).length)
    .reduce((a, b) => a + b, 0);
  element.remove();
  return antal;
}

describe("Kontrolgrænser skæres ikke væk af y-aksens skaleringsfaktor", () => {
  // 18 punkter på hver af de to grænselinjer
  const fuldt: number = 36;

  it("viser alle grænsepunkter ved standardfaktoren", () => {
    expect(antalGraensepunkter("ip")).toBe(fuldt);
  });

  it("viser alle grænsepunkter ved faktor 1,0", () => {
    expect(antalGraensepunkter("ip", s => { s.y_axis.limit_multiplier = 1.0; })).toBe(fuldt);
  });

  it("viser alle grænsepunkter ved en faktor under 1", () => {
    // Før rettelsen: 0. Aksen landede inde mellem centerlinjen og den
    // bredeste grænse, og hele linjen blev fjernet.
    expect(antalGraensepunkter("ip", s => { s.y_axis.limit_multiplier = 0.2; })).toBe(fuldt);
  });

  it("viser alle grænsepunkter ved faktor 0", () => {
    // Yderpunktet: aksen må lige nøjagtig røre den bredeste grænse.
    expect(antalGraensepunkter("ip", s => { s.y_axis.limit_multiplier = 0; })).toBe(fuldt);
  });

  it("gælder også det almindelige I-kort", () => {
    expect(antalGraensepunkter("i", s => { s.y_axis.limit_multiplier = 0.2; })).toBe(fuldt);
  });

  it("respekterer stadig en eksplicit øvre og nedre grænse", () => {
    // En fast akse er brugerens bevidste valg om at zoome ind, og den
    // overtrumfer stadig. Grænserne uden for vinduet vises ikke.
    const antal: number = antalGraensepunkter("ip", s => {
      s.y_axis.ylimit_l = 49;
      s.y_axis.ylimit_u = 53;
    });
    expect(antal).toBeLessThan(fuldt);
  });
});
