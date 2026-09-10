import {
  toggleOption, lineTypeOption,
  colourOption, numberOption,
  fontOption, fontSizeOption, textOption,
  lineLabelPositionOption
} from "./common";

const linesSettings = {
  description: "Line Settings",
  displayName: "Line Settings",
  settingsGroups: {
    "Main": {
      show_main: toggleOption("Show Main Line", true),
      width_main: numberOption("Main Line Width", 1, { min: 0, max: 100 }),
      type_main: lineTypeOption("Main Line Type", "10 0"),
      colour_main: colourOption("Main Line Colour", "common_cause"),
      opacity_main: numberOption("Default Opacity", 1, { min: 0, max: 1 }),
      opacity_unselected_main: numberOption("Opacity if Any Selected", 0.2, { min: 0, max: 1 }),
      join_rebaselines_main: toggleOption("Connect Rebaselined Limits", false),
      plot_label_show_main: toggleOption("Show Value on Plot", false),
      plot_label_show_all_main: toggleOption("Show Value at all Re-Baselines", false),
      plot_label_show_n_main: numberOption("Show Value at Last N Re-Baselines", 1, { min: 1 }),
      plot_label_position_main: lineLabelPositionOption(),
      plot_label_vpad_main: numberOption("Value Vertical Padding", 0),
      plot_label_hpad_main: numberOption("Value Horizontal Padding", 10),
      plot_label_font_main: fontOption("Value Font"),
      plot_label_size_main: fontSizeOption("Value Font Size"),
      plot_label_colour_main: colourOption("Value Colour", "standard"),
      plot_label_prefix_main: textOption("Value Prefix", "")
    },
    "Target": {
      show_target: toggleOption("Show Target", true),
      width_target: numberOption("Line Width", 1.5, { min: 0, max: 100 }),
      type_target: lineTypeOption("Line Type", "10 0"),
      colour_target: colourOption("Line Colour", "standard"),
      opacity_target: numberOption("Default Opacity", 1, { min: 0, max: 1 }),
      opacity_unselected_target: numberOption("Opacity if Any Selected", 0.2, { min: 0, max: 1 }),
      join_rebaselines_target: toggleOption("Connect Rebaselined Limits", false),
      ttip_show_target: toggleOption("Show value in tooltip", true),
      ttip_label_target: textOption("Tooltip Label", "Centerline"),
      plot_label_show_target: toggleOption("Show Value on Plot", false),
      plot_label_show_all_target: toggleOption("Show Value at all Re-Baselines", false),
      plot_label_show_n_target: numberOption("Show Value at Last N Re-Baselines", 1, { min: 1 }),
      plot_label_position_target: lineLabelPositionOption(),
      plot_label_vpad_target: numberOption("Value Vertical Padding", 0),
      plot_label_hpad_target: numberOption("Value Horizontal Padding", 10),
      plot_label_font_target: fontOption("Value Font"),
      plot_label_size_target: fontSizeOption("Value Font Size"),
      plot_label_colour_target: colourOption("Value Colour", "standard"),
      plot_label_prefix_target: textOption("Value Prefix", "")
    },
    "Alt. Target": {
      show_alt_target: toggleOption("Show Alt. Target Line", false),
      alt_target: numberOption("Additional Target Value:", undefined),
      multiplier_alt_target: toggleOption("Apply Multiplier to Alt. Target", false),
      width_alt_target: numberOption("Line Width", 1.5, { min: 0, max: 100 }),
      type_alt_target: lineTypeOption("Line Type", "10 0"),
      colour_alt_target: colourOption("Line Colour", "standard"),
      opacity_alt_target: numberOption("Default Opacity", 1, { min: 0, max: 1 }),
      opacity_unselected_alt_target: numberOption("Opacity if Any Selected", 0.2, { min: 0, max: 1 }),
      join_rebaselines_alt_target: toggleOption("Connect Rebaselined Limits", false),
      ttip_show_alt_target: toggleOption("Show value in tooltip", true),
      ttip_label_alt_target: textOption("Tooltip Label", "Alt. Target"),
      plot_label_show_alt_target: toggleOption("Show Value on Plot", false),
      plot_label_show_all_alt_target: toggleOption("Show Value at all Re-Baselines", false),
      plot_label_show_n_alt_target: numberOption("Show Value at Last N Re-Baselines", 1, { min: 1 }),
      plot_label_position_alt_target: lineLabelPositionOption(),
      plot_label_vpad_alt_target: numberOption("Value Vertical Padding", 0),
      plot_label_hpad_alt_target: numberOption("Value Horizontal Padding", 10),
      plot_label_font_alt_target: fontOption("Value Font"),
      plot_label_size_alt_target: fontSizeOption("Value Font Size"),
      plot_label_colour_alt_target: colourOption("Value Colour", "standard"),
      plot_label_prefix_alt_target: textOption("Value Prefix", "")
    },
    "99% Limits": {
      show_99: toggleOption("Show 99% Lines", true),
      width_99: numberOption("Line Width", 2, { min: 0, max: 100 }),
      type_99: lineTypeOption("Line Type", "10 10"),
      colour_99: colourOption("Line Colour", "limits"),
      opacity_99: numberOption("Default Opacity", 1, { min: 0, max: 1 }),
      opacity_unselected_99: numberOption("Opacity if Any Selected", 0.2, { min: 0, max: 1 }),
      join_rebaselines_99: toggleOption("Connect Rebaselined Limits", false),
      ttip_show_99: toggleOption("Show value in tooltip", true),
      ttip_label_99: textOption("Tooltip Label", "99% Limit"),
      ttip_label_99_prefix_lower: textOption("Tooltip Label - Lower Prefix", "Lower "),
      ttip_label_99_prefix_upper: textOption("Tooltip Label - Upper Prefix", "Upper "),
      plot_label_show_99: toggleOption("Show Value on Plot", false),
      plot_label_show_all_99: toggleOption("Show Value at all Re-Baselines", false),
      plot_label_show_n_99: numberOption("Show Value at Last N Re-Baselines", 1, { min: 1 }),
      plot_label_position_99: lineLabelPositionOption(),
      plot_label_vpad_99: numberOption("Value Vertical Padding", 0),
      plot_label_hpad_99: numberOption("Value Horizontal Padding", 10),
      plot_label_font_99: fontOption("Value Font"),
      plot_label_size_99: fontSizeOption("Value Font Size"),
      plot_label_colour_99: colourOption("Value Colour", "standard"),
      plot_label_prefix_99: textOption("Value Prefix", ""),
      // Default fra: båndet er en tilvalgt læsehjælp, ikke en del af
      // qicharts2's udtryk.
      show_band_99: toggleOption("Show Filled Band Between Limits", false),
      band_colour_99: colourOption("Band Colour", "limits"),
      band_opacity_99: numberOption("Band Opacity", 0.15, { min: 0, max: 1 })
    }
  }
};

export default linesSettings;
