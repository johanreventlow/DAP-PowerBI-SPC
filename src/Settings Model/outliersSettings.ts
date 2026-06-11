import { colourOption, toggleOption, fontOption, fontSizeOption, textOption } from "./common";

const outliersSettings = {
  description: "Signaler",
  displayName: "Signaler",
  settingsGroups: {
    "Punkter uden for kontrolgrænser" : {
      astronomical: toggleOption("Fremhæv punkter uden for kontrolgrænser", false),
      ast_colour: colourOption("Punktfarve", "deterioration")
    },
    "Anhøj-regler": {
      anhoj_long_run: toggleOption("Stiplet centerlinje ved usædvanligt lang serie", false),
      anhoj_few_crossings: toggleOption("Stiplet centerlinje ved usædvanligt få kryds", false),
      show_anhoj_stats: toggleOption("Vis serieanalyse på diagrammet", false),
      anhoj_stats_label_run: textOption("Etiket for længste serie", "Længste serie"),
      anhoj_stats_label_crossings: textOption("Etiket for kryds", "Kryds"),
      anhoj_stats_font: fontOption("Skrifttype"),
      anhoj_stats_size: fontSizeOption("Skriftstørrelse"),
      anhoj_stats_colour: colourOption("Skriftfarve", "standard")
    }
  }
};

export default outliersSettings;
