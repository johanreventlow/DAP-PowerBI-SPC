import { colourOption, toggleOption, dropdownOption } from "./common";

const outliersSettings = {
  description: "Outlier Settings",
  displayName: "Outlier Settings",
  settingsGroups: {
    "General" : {
      process_flag_type: dropdownOption("Type of Change to Flag", "both", ["both", "improvement", "deterioration"], "sentence"),
      improvement_direction: dropdownOption("Improvement Direction", "increase", ["increase", "neutral", "decrease"], "sentence")
    },
    "Astronomical Points" : {
      astronomical: toggleOption("Highlight Astronomical Points", false),
      astronomical_limit: dropdownOption("Limit for Astronomical Points", "3 Sigma", ["1 Sigma", "2 Sigma", "3 Sigma", "Specification"]),
      ast_colour_improvement: colourOption("Imp. Ast. Colour", "improvement"),
      ast_colour_deterioration: colourOption("Det. Ast. Colour", "deterioration"),
      ast_colour_neutral_low: colourOption("Neutral (Low) Ast. Colour", "neutral_low"),
      ast_colour_neutral_high: colourOption("Neutral (High) Ast. Colour", "neutral_high")
    },
    "Anhoej Rules": {
      anhoj_long_run: toggleOption("Dash Centerline on Long Run", false),
      anhoj_few_crossings: toggleOption("Dash Centerline on Few Crossings", false)
    }
  }
};

export default outliersSettings;
