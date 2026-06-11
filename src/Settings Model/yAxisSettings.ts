import {
  colourOption, numberOption,
  toggleOption, fontOption, fontSizeOption, textOption
} from "./common";

const yAxisSettings = {
  description: "Y-akse",
  displayName: "Y-akse",
  settingsGroups: {
    "Akse": {
      ylimit_show: toggleOption("Vis Y-akse", true),
      ylimit_colour: colourOption("Aksefarve", "standard"),
      limit_multiplier: numberOption("Skaleringsfaktor", 1.5, { min: 0 }),
      ylimit_sig_figs: numberOption("Antal decimaler", undefined, { min: 0, max: 100 }),
      ylimit_l: numberOption("Nedre grænse", undefined),
      ylimit_u: numberOption("Øvre grænse", undefined)
    },
    "Aksemærker": {
      ylimit_ticks: toggleOption("Vis aksemærker", true),
      ylimit_tick_count: numberOption("Maks. antal mærker", 10, { min: 0, max: 100 }),
      ylimit_tick_font: fontOption("Skrifttype"),
      ylimit_tick_size: fontSizeOption("Skriftstørrelse"),
      ylimit_tick_colour: colourOption("Skriftfarve", "standard"),
      ylimit_tick_rotation: numberOption("Rotation (grader)", 0, { min: -360, max: 360 })
    },
    "Aksetitel": {
      ylimit_label: textOption("Aksetitel", ""),
      ylimit_label_font: fontOption("Skrifttype"),
      ylimit_label_size: fontSizeOption("Skriftstørrelse"),
      ylimit_label_colour: colourOption("Skriftfarve", "standard")
    }
  }
};

export default yAxisSettings;
