import {
  toggleOption, numberOption,
  fontOption, fontSizeOption, textOption, colourOption
} from "./common";

const xAxisSettings = {
  description: "X-akse",
  displayName: "X-akse",
  settingsGroups: {
    "Akse": {
      xlimit_show: toggleOption("Vis X-akse", true),
      xlimit_colour: colourOption("Aksefarve", "standard"),
      xlimit_l: numberOption("Nedre grænse", undefined),
      xlimit_u: numberOption("Øvre grænse", undefined)
    },
    "Aksemærker": {
      xlimit_ticks: toggleOption("Vis aksemærker", true),
      xlimit_tick_count: numberOption("Maks. antal mærker", 10, { min: 0, max: 100 }),
      xlimit_tick_font: fontOption("Skrifttype"),
      xlimit_tick_size: fontSizeOption("Skriftstørrelse"),
      xlimit_tick_colour: colourOption("Skriftfarve", "standard"),
      xlimit_tick_rotation: numberOption("Rotation (grader)", -35, { min: -360, max: 360 })
    },
    "Aksetitel": {
      xlimit_label: textOption("Aksetitel", ""),
      xlimit_label_font: fontOption("Skrifttype"),
      xlimit_label_size: fontSizeOption("Skriftstørrelse"),
      xlimit_label_colour: colourOption("Skriftfarve", "standard")
    }
  }
};

export default xAxisSettings;
