import { defaultSettings } from "../src/settings";
import { testDom, createVisualHost } from "powerbi-visuals-utils-testutils";
import { Visual } from "../src/visual";
import buildDataView from "./helpers/buildDataView";
import { describe, it, expect } from "vitest";

// Uroterede aksemærke-etiketter kan ikke vige for hinanden, så de, der ville
// overlappe, skjules. Datoetiketter er den tætte sag; korte tal er den frie.

const numerators: number[] = [50, 52, 48, 51, 49, 53, 47, 50, 52, 48, 51, 49,
                              68, 50, 52, 48, 51, 49, 53, 47];
const dateKeys: string[] = numerators.map((_, i) => `2024-${String((i % 12) + 1).padStart(2, "0")}-01`);
const shortKeys: string[] = numerators.map((_, i) => String(i + 1));

function render(keys: string[], width: number, overrides: (s: any) => void = () => undefined) {
  const element = testDom(String(width), "400");
  const visual = new Visual({ element: element, host: createVisualHost({}) });
  const settings = JSON.parse(JSON.stringify(defaultSettings));
  settings.spc.chart_type = "i";
  overrides(settings);

  const update = () => visual.update({
    dataViews: [ buildDataView({ key: keys, numerators: numerators }, settings) ],
    viewport: { width: width, height: 400 },
    type: 2 /*powerbi.VisualUpdateType.Data*/
  });
  update();
  return { element, settings, update };
}

function labels(element: HTMLElement) {
  const all = Array.from(element.querySelectorAll<SVGGraphicsElement>(".xaxisgroup .tick text"));
  const withText = all.filter(l => (l.textContent ?? "") !== "");
  return {
    all: all,
    shown: withText.filter(l => l.style.display !== "none"),
    hidden: withText.filter(l => l.style.display === "none")
  };
}

function overlaps(shown: SVGGraphicsElement[]): boolean {
  for (let i = 1; i < shown.length; i++) {
    if (shown[i].getBoundingClientRect().left < shown[i - 1].getBoundingClientRect().right) {
      return true;
    }
  }
  return false;
}

describe("Uroterede aksemærke-etiketter", () => {
  it("skjuler datoetiketter, der ville overlappe", () => {
    const { element } = render(dateKeys, 600);
    const { shown, hidden } = labels(element);
    expect(hidden.length).toBeGreaterThan(0);
    expect(shown.length).toBeGreaterThan(1);
    expect(overlaps(shown)).toBe(false);
    element.remove();
  });

  it("beholder alle korte etiketter, der er plads til", () => {
    const { element } = render(shortKeys, 600);
    const { shown, hidden } = labels(element);
    expect(hidden.length).toBe(0);
    expect(shown.length).toBeGreaterThan(1);
    element.remove();
  });

  it("viser færre etiketter, når aksen bliver smallere", () => {
    const smal = render(dateKeys, 250);
    const bred = render(dateKeys, 900);
    expect(labels(smal.element).shown.length).toBeLessThan(labels(bred.element).shown.length);
    // Aksen må ikke ende uden etiketter, uanset hvor smal den bliver.
    expect(labels(smal.element).shown.length).toBeGreaterThan(0);
    smal.element.remove();
    bred.element.remove();
  });

  it("viser en skjult etiket igen, når rotationen slås til", () => {
    const { element, settings, update } = render(dateKeys, 600);
    expect(labels(element).hidden.length).toBeGreaterThan(0);

    // Samme visual, ny optegning: en etiket, der vigede, må ikke blive væk,
    // fordi den var skjult sidst.
    settings.x_axis.xlimit_tick_rotation = -35;
    update();
    expect(labels(element).hidden.length).toBe(0);
    element.remove();
  });
});
