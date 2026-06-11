import { colourOption, toggleOption } from "./common";

const outliersSettings = {
  description: "Outlier Settings",
  displayName: "Outlier Settings",
  settingsGroups: {
    "Astronomical Points" : {
      astronomical: toggleOption("Highlight Astronomical Points", false),
      ast_colour: colourOption("Astronomical Point Colour", "deterioration")
    },
    "Anhoej Rules": {
      anhoj_long_run: toggleOption("Dash Centerline on Long Run", false),
      anhoj_few_crossings: toggleOption("Dash Centerline on Few Crossings", false)
    }
  }
};

export default outliersSettings;
