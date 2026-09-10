import { colourOption, toggleOption, dropdownOption } from "./common";

const outliersSettings = {
  description: "Outlier Settings",
  displayName: "Outlier Settings",
  settingsGroups: {
    "General" : {
      process_flag_type: dropdownOption("Type of Change to Flag", "both", ["both", "improvement", "deterioration"], "sentence"),
      improvement_direction: dropdownOption("Improvement Direction", "increase", ["increase", "neutral", "decrease"], "sentence")
    },
    "Beyond Control Limit" : {
      astronomical: toggleOption("Highlight Observations Beyond Limit", false),
      astronomical_limit: dropdownOption("Limit to Compare Against", "3 Sigma", ["1 Sigma", "2 Sigma", "3 Sigma"]),
      ast_colour_improvement: colourOption("Imp. Colour", "improvement"),
      ast_colour_deterioration: colourOption("Det. Colour", "deterioration"),
      ast_colour_neutral_low: colourOption("Neutral (Low) Colour", "neutral_low"),
      ast_colour_neutral_high: colourOption("Neutral (High) Colour", "neutral_high")
    },
    "Signal Detection": {
      anhoj_long_run: toggleOption("Dash Centerline on Long Run", true),
      anhoj_few_crossings: toggleOption("Dash Centerline on Few Crossings", true)
    }
  }
};

export default outliersSettings;
