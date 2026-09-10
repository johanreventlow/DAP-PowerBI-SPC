import { colourOption, toggleOption } from "./common";

const outliersSettings = {
  description: "Outlier Settings",
  displayName: "Outlier Settings",
  settingsGroups: {
    "Beyond Control Limit" : {
      astronomical: toggleOption("Highlight Observations Beyond Limit", false),
      ast_colour: colourOption("Colour", "beyond_limit")
    },
    "Signal Detection": {
      anhoj_long_run: toggleOption("Dash Centerline on Long Run", true),
      anhoj_few_crossings: toggleOption("Dash Centerline on Few Crossings", true)
    }
  }
};

export default outliersSettings;
