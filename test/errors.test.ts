import { testDom, createVisualHost } from "powerbi-visuals-utils-testutils";
import { Visual } from "../src/visual";
import buildDataView from "./helpers/buildDataView";
import rep from "../src/Functions/rep";
import { describe, it, expect } from "vitest";

const stringKeys: string[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const validNumerators: number[] = [742731.43, 263501, 283085.78, 300263.49, 376074.57, 814724.34, 570921.34];

function expect_error(element: Element, message: string): void {
  const errElement = element.querySelector('.errormessage') as Element;
  expect(errElement).toBeTruthy();
  const errText = errElement.querySelector('text') as Element;
  expect(errText.textContent).toBe(message);
}

describe("Chart Errors", () => {
  const element = testDom("500", "500");
  const visual = new Visual({
    element: element,
    host: createVisualHost({})
  });
  const visualClassElement: Element = document.body.querySelector('.visual') as Element;
  const svgElement: Element = visualClassElement.querySelector('svg') as Element;

  it("Errors render", () => {
    visual.update({
      dataViews: [ buildDataView({ key: stringKeys }) ],
      viewport: { width: 500, height: 500 },
      type:  2 /*powerbi.VisualUpdateType.Data*/
    });

    expect_error(svgElement, 'Ingen tællere angivet.');

    visual.update({
      dataViews: [ buildDataView({ key: stringKeys, numerators: rep(<any>null, 7) }) ],
      viewport: { width: 500, height: 500 },
      type:  2 /*powerbi.VisualUpdateType.Data*/
    });

    expect_error(svgElement, 'Alle tællere mangler.');

    visual.update({
      dataViews: [ buildDataView({ key: stringKeys, numerators: stringKeys }) ],
      viewport: { width: 500, height: 500 },
      type:  2 /*powerbi.VisualUpdateType.Data*/
    });

    expect_error(svgElement, 'Ingen af tællerne er tal.');

    visual.update({
      dataViews: [ buildDataView({ key: rep(<any>null, 7), numerators: validNumerators }) ],
      viewport: { width: 500, height: 500 },
      type:  2 /*powerbi.VisualUpdateType.Data*/
    });

    expect_error(svgElement, 'Alle datoer/nøgler mangler.');
  });

  element.remove();
});
