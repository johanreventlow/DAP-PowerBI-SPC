import settingsClass from "../src/Classes/settingsClass";
import { defaultSettings } from "../src/settings";
import toFixedComma from "../src/Functions/toFixedComma";
import { describe, it, expect } from "vitest";

// Formateringsruden bygges af settingsClass.getFormattingModel. Den er det ene
// sted, hvor alt det brugervendte i ruden samles, så den er også det rette sted
// at kontrollere, at intet af det slap igennem på engelsk.

function allPaneText(): string[] {
  const model = new settingsClass().getFormattingModel();
  const out: string[] = [];
  model.cards.forEach(card => {
    out.push(card.displayName ?? "");
    card.groups.forEach(group => {
      out.push(group.displayName ?? "");
      (group.slices ?? []).forEach((slice: any) => {
        out.push(slice.displayName ?? "");
        const items = slice.control?.properties?.items;
        if (Array.isArray(items)) {
          items.forEach((item: any) => out.push(item.displayName ?? ""));
        }
      });
    });
  });
  return out.filter(t => t.length > 0);
}

describe("Formateringsruden er dansk", () => {
  // Ord, der kun optræder i engelsk UI-sprog. Udeladt er ord, der staves ens
  // på dansk — "Tooltip", "SD", "Start", "Panel", "Normal" — og
  // diagramtypernes engelske koder ("run - Seriediagram"), hvor kun teksten
  // efter bindestregen kontrolleres.
  const ENGELSKE_ORD: RegExp = /\b(Show|Hide|Colour|Color|Width|Height|Size|Font|Label|Value|Line|Limit|Target|Border|Header|Body|Padding|Opacity|Marker|Position|Offset|Prefix|Suffix|Delimiter|Locale|Multiplier|Subset|Split|Truncate|Report|Keep|Decimals|Maximum|Scaling|Draw|Connect|Apply|Highlight|Dash|Band|Filled|Between|Outer|Inner|Weight|Transform|Align|Style|Default|Selected|Unselected|Chart|Axis|Ticks?|Period|Column|Row|Signal|Crossings|Observations|Newest|Solid|Dashed|Dotted|Circle|Square|Triangle|Diamond|Cross|Star|Automatic|Yes|No|End|Top|Bottom|Above|Below|Beside|Outside|Inside)\b/;

  it("indeholder ingen engelske UI-ord", () => {
    const engelske: string[] = allPaneText()
      .map(t => t.includes(" - ") ? t.slice(t.indexOf(" - ") + 3) : t)
      .filter(t => ENGELSKE_ORD.test(t));
    expect(engelske).toEqual([]);
  });

  it("henter faktisk tekst at kontrollere", () => {
    // Uden denne ville testen ovenfor bestå på en tom liste.
    expect(allPaneText().length).toBeGreaterThan(150);
  });
});

// "Anhøj" er metodens navn i litteraturen og bruges frit i kode, kommentarer
// og dokumentation. Brugerne skal ikke møde det: for en kliniker er det
// relevante, hvad diagrammet viser, ikke hvem reglen er opkaldt efter.
describe("Fagbegrebet Anhøj er ikke brugervendt", () => {
  it("optræder ikke i formateringsruden", () => {
    const traeffere: string[] = allPaneText().filter(t => /anh[øo]j/i.test(t));
    expect(traeffere).toEqual([]);
  });

  it("optræder ikke i nogen default-værdi, brugeren kan se", () => {
    const traeffere: string[] = [];
    const walk = (obj: any) => {
      Object.values(obj).forEach(v => {
        if (typeof v === "string" && /anh[øo]j/i.test(v)) traeffere.push(v);
        else if (v && typeof v === "object") walk(v);
      });
    };
    walk(defaultSettings);
    expect(traeffere).toEqual([]);
  });
});

describe("Dansk decimalkomma", () => {
  it("bruger komma som decimalmarkør", () => {
    expect(toFixedComma(3.5, 1)).toBe("3,5");
    expect(toFixedComma(0.125, 2)).toBe("0,13");
    expect(toFixedComma(-2.75, 2)).toBe("-2,75");
  });

  it("giver intet komma uden decimaler", () => {
    expect(toFixedComma(42, 0)).toBe("42");
  });

  it("rører ikke store tal, da toFixed ikke grupperer", () => {
    // Var der tusindtalsseparatorer i input, ville en ubetinget udskiftning
    // ødelægge dem. toFixed producerer dem ikke, og det er forudsætningen.
    expect(toFixedComma(1234567.5, 1)).toBe("1234567,5");
  });
});
