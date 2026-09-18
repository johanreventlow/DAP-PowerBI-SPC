import { describe, it, expect } from "vitest";
import spcSettings from "../src/Settings Model/spcSettings";
import chartTypeLabel from "../src/Functions/chartTypeLabel";
import settingsClass from "../src/Classes/settingsClass";
import buildTooltip from "../src/Functions/buildTooltip";
import derivedSettingsClass from "../src/Classes/derivedSettingsClass";
import { defaultSettings } from "../src/settings";
import buildDataView from "./helpers/buildDataView";

// Listen skal kunne vælges rigtigt af en, der ikke kender koderne. Ruden er
// smal og klipper halen, så det afgørende ord skal stå først, og to punkter
// må ikke ligne hinanden fra starten.

const items = spcSettings.settingsGroups.all.chart_type.items;

describe("Diagramtype-listen", () => {
  it("stiller de fem hyppigste valg først, i datatype-rækkefølge", () => {
    expect(items.slice(0, 5).map(d => d.value)).toEqual(["run", "ip", "pp", "up", "c"]);
  });

  it("samler de klassiske kort nederst med koden forrest", () => {
    expect(items.slice(-4).map(d => d.value)).toEqual(["i", "p", "u", "mr"]);
    items.slice(-4).forEach(d => expect(d.displayName).toMatch(/^(I|P|U|MR)-kort/));
  });

  it("kan skelnes på de første ti tegn", () => {
    const starts: string[] = items.map(d => d.displayName.slice(0, 10));
    expect(new Set(starts).size).toBe(items.length);
  });

  it("holder etiketterne korte nok til den smalle rude", () => {
    items.forEach(d => expect(d.displayName.length, d.displayName).toBeLessThanOrEqual(40));
  });

  it("nævner kortkoden i hvert kontrolkort", () => {
    // Koden er ankeret for den, der kender SPC-litteraturen. Seriediagrammet
    // har ingen — det er ordret søsterprojektets etiket, så de to værktøjer
    // kalder det samme.
    items.filter(d => d.value !== "run").forEach(d => {
      expect(d.displayName, d.displayName).toMatch(/\(?\b(I|P|U|C|T|G|MR)'?\b/);
    });
    expect(items[0].displayName).toBe("Seriediagram – udvikling over tid");
  });

  it("beholder seriediagrammet som default", () => {
    // Det eneste valg, der ikke kan være matematisk forkert: ingen grænser.
    expect(spcSettings.settingsGroups.all.chart_type.default).toBe("run");
  });
});

describe("Vejledning på indstillingen", () => {
  it("giver diagramtypen en info-tekst i formateringsruden", () => {
    const settings = new settingsClass();
    settings.update(buildDataView({ key: ["A", "B", "C"], numerators: [1, 2, 3] }), [[0, 3]]);
    const card = settings.getFormattingModel().cards.find(c => c.uid === "spc_card_uid");
    const slice = card?.groups[0].slices!.find((s: any) => s.uid.includes("chart_type")) as any;
    expect(slice?.description).toContain("I tvivl");
  });
});

describe("Diagramtypen i tooltippet", () => {
  const row: any = { date: "2024-01-01", value: 1, target: 1, ll99: 0, ul99: 2, astpoint: "none" };
  const build = (overrides: any = {}) => {
    const settings = JSON.parse(JSON.stringify(defaultSettings));
    settings.spc = { ...settings.spc, ...overrides };
    return buildTooltip(row, undefined, settings, new derivedSettingsClass(settings.spc));
  };

  it("står sidst, som kontekst om hele diagrammet", () => {
    const tooltip = build({ chart_type: "pp" });
    expect(tooltip[tooltip.length - 1]).toEqual({ displayName: "Diagramtype", value: "P'-kort" });
  });

  it("kan slås fra", () => {
    const tooltip = build({ chart_type: "pp", ttip_show_chart_type: false });
    expect(tooltip.some(t => t.value === "P'-kort")).toBe(false);
  });

  it("navngiver hver korttype kort", () => {
    expect(chartTypeLabel("run")).toBe("Seriediagram");
    expect(chartTypeLabel("ip")).toBe("I'-kort");
    // En ukendt kode vises som sig selv frem for tomt.
    expect(chartTypeLabel("ukendt")).toBe("ukendt");
  });
});
