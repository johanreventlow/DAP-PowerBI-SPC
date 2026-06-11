import { colourOption, toggleOption, fontOption, fontSizeOption, textOption } from "./common";

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
      anhoj_few_crossings: toggleOption("Dash Centerline on Few Crossings", false),
      show_anhoj_stats: toggleOption("Show Runs Analysis on Chart", false),
      anhoj_stats_label_run: textOption("Longest Run Label", "Længste serie"),
      anhoj_stats_label_crossings: textOption("Crossings Label", "Kryds"),
      anhoj_stats_font: fontOption("Statistics Font"),
      anhoj_stats_size: fontSizeOption("Statistics Font Size"),
      anhoj_stats_colour: colourOption("Statistics Colour", "standard")
    }
  }
};

export default outliersSettings;
