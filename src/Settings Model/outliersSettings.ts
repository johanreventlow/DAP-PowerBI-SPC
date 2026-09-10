import { colourOption, toggleOption } from "./common";

const outliersSettings = {
  description: "Signaler",
  displayName: "Signaler",
  settingsGroups: {
    "Punkter uden for kontrolgrænser" : {
      astronomical: toggleOption("Fremhæv punkter uden for kontrolgrænser", false),
      ast_colour: colourOption("Punktfarve", "beyond_limit")
    },
    "Signaldetektion": {
      anhoj_long_run: toggleOption("Stiplet centerlinje ved usædvanligt lang serie", true),
      anhoj_few_crossings: toggleOption("Stiplet centerlinje ved usædvanligt få kryds", true)
    }
  }
};

export default outliersSettings;
