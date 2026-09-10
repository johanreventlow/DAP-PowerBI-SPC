import { testDom, createVisualHost } from "powerbi-visuals-utils-testutils";
import { defaultSettings } from "../src/settings";
import { Visual } from "../src/visual";
import buildDataView from "./helpers/buildDataView";
import { describe, it, expect } from "vitest";

const stringKeys: string[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const stringGrouping: string[] = ["A", "A", "A", "B", "B", "B", "B"];
const validNumerators: number[] = [742731.43, 263501, 283085.78, 300263.49, 376074.57, 814724.34, 570921.34];

describe("Chart Initialisation", () => {
  const element = testDom("500", "500");
  const visual = new Visual({
    element: element,
    host: createVisualHost({})
  });
  const visualClassElement: Element = document.body.querySelector('.visual') as Element;
  const svgElement: Element = visualClassElement.querySelector('svg') as Element;
  const tableDivElement: Element = visualClassElement.querySelector('div') as Element;

  it("Visual can be created", () => {
    // Expect that the visual element has been created
    expect(visualClassElement).toBeTruthy();

    // Expect that the visual element contains both an SVG for the chart and a div for the table
    expect(svgElement).toBeTruthy();
    expect(tableDivElement?.querySelector('table')).toBeTruthy();
  });

  it("SPC Chart can be created", () => {
    visual.update({
      dataViews: [ buildDataView({ key: stringKeys, numerators: validNumerators }) ],
      viewport: { width: 500, height: 500 },
      type:  2 /*powerbi.VisualUpdateType.Data*/
    });


    // If only numerators and dates are passed, the SPC chart should be visible and table hidden
    expect(svgElement.getAttribute('width')).toBe('500');
    expect(svgElement.getAttribute('height')).toBe('500');
    expect(tableDivElement.getAttribute('style')).toContain('height: 0%');
    expect(tableDivElement.getAttribute('style')).toContain('width: 0%');

    // Pass indicator groupings with data
    visual.update({
      dataViews: [ buildDataView({ key: stringKeys, indicator: stringGrouping, numerators: validNumerators }) ],
      viewport: { width: 500, height: 500 },
      type:  2 /*powerbi.VisualUpdateType.Data*/
    });

    // Expect that the table div element now has 100% height and width, while the SPC chart is hidden
    expect(svgElement.getAttribute('width')).toBe('0');
    expect(svgElement.getAttribute('height')).toBe('0');
    expect(tableDivElement.getAttribute('style')).toContain('height: 100%');
    expect(tableDivElement.getAttribute('style')).toContain('width: 100%');
  });

  // Remove visual element from DOM to avoid interfering with other tests
  element.remove();
});

// The colour palette is read from the host so the visual can honour Windows'
// high-contrast mode. The constructor seeds the field with an empty object,
// and the guard that fills it tested for null or undefined — which an empty
// object is neither. The palette was therefore never read, isHighContrast
// stayed undefined, and every high-contrast branch in the visual was dead
// code. That is an accessibility failure, not a cosmetic one.
describe("Colour palette", () => {
  const visual = new Visual({
    element: testDom("500", "500"),
    host: createVisualHost({})
  });
  visual.update({
    dataViews: [ buildDataView({ key: stringKeys, numerators: validNumerators },
                               JSON.parse(JSON.stringify(defaultSettings))) ],
    viewport: { width: 500, height: 500 },
    type: 2 /*powerbi.VisualUpdateType.Data*/
  });

  it("is read from the host rather than left empty", () => {
    const palette = visual.viewModel.colourPalette;
    // The mock host supplies these; before the fix they were all undefined
    // because the palette object was never filled in at all.
    expect(palette.foregroundColour).toBeTypeOf("string");
    expect(palette.backgroundColour).toBeTypeOf("string");
    expect(palette.foregroundSelectedColour).toBeTypeOf("string");
    expect(palette.hyperlinkColour).toBeTypeOf("string");
    // isHighContrast is deliberately not asserted: the test host declares it
    // in its typings but never assigns it at runtime, so it stays undefined
    // here. Power BI itself supplies a boolean, which is what the
    // high-contrast branches throughout the visual read.
  });
});
