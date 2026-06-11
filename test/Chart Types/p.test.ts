import { defaultSettings } from "../../src/settings";
import { testDom, createVisualHost } from "powerbi-visuals-utils-testutils";
import { Visual } from "../../src/visual";
import buildDataView from "../helpers/buildDataView";
import { type controlLimitsObject } from "../../src/Classes/viewModelClass";
import { describe, it, expect } from "vitest";

const keys: string[] = ["2011-07-01","2011-08-01","2011-09-01","2011-10-01","2011-11-01","2011-12-01","2012-01-01","2012-02-01","2012-03-01","2012-04-01","2012-05-01","2012-06-01","2012-07-01","2012-08-01","2012-09-01","2012-10-01","2012-11-01","2012-12-01","2013-01-01","2013-02-01","2013-03-01","2013-04-01","2013-05-01","2013-06-01","2013-07-01","2013-08-01","2013-09-01","2013-10-01","2013-11-01","2013-12-01","2014-01-01","2014-02-01","2014-03-01","2014-04-01","2014-05-01","2014-06-01"];
const numerators: number[] = [14,12,15,8,16,11,12,14,16,17,5,11,13,10,14,5,12,10,11,5,10,8,11,12,11,18,18,21,14,15,18,22,17,16,20,15];
const denominators: number[] = [52,64,70,60,67,69,67,54,79,59,49,61,41,51,56,43,57,48,69,41,40,46,59,62,57,65,75,70,76,69,64,67,84,67,69,78];

const ul99: number[] = [38.76,37.07,36.4,37.58,36.72,36.5,36.72,38.44,35.53,37.71,39.28,37.45,40.92,38.93,38.14,40.47,37.99,39.46,36.5,40.92,41.16,39.84,37.71,37.32,37.99,36.95,35.9,36.4,35.8,36.5,37.07,36.72,35.11,36.72,36.5,35.62];
const ll99: number[] = [4.5,6.19,6.87,5.69,6.54,6.76,6.54,4.82,7.74,5.55,3.99,5.82,2.34,4.34,5.13,2.8,5.27,3.8,6.76,2.34,2.1,3.42,5.55,5.95,5.27,6.31,7.37,6.87,7.46,6.76,6.19,6.54,8.16,6.54,6.76,7.65];

describe("P Chart Test", () => {
  const element = testDom("500", "500");
  const visual = new Visual({
    element: element,
    host: createVisualHost({})
  });

  it("P Chart can be created", () => {
    let defaultSettingsCopy = JSON.parse(JSON.stringify(defaultSettings));
    defaultSettingsCopy.spc.chart_type = "p";
    visual.update({
      dataViews: [ buildDataView({
        key: keys,
        numerators: numerators,
        denominators: denominators
      },
      defaultSettingsCopy) ],
      viewport: { width: 500, height: 500 },
      type:  2 /*powerbi.VisualUpdateType.Data*/
    });

    const limits: controlLimitsObject = visual.viewModel.controlLimits[0];
    for (let i = 0; i < limits.keys.length; i++) {
      expect((limits.ul99 as number[])[i]).toBeCloseTo(ul99[i], 2);
      expect((limits.ll99 as number[])[i]).toBeCloseTo(ll99[i], 2);
    }
  });

  // Remove visual element from DOM to avoid interfering with other tests
  element.remove();
});
