import { paddingOption, toggleOption, numberOption } from "./common";

const canvasSettings = {
  description: "Plotområde",
  displayName: "Plotområde",
  settingsGroups: {
    "all": {
      show_errors: toggleOption("Vis fejlbeskeder på diagrammet", true),
      // Advarsel, når de bundne data ikke passer til diagramtypen. Default
      // til: fejlen er tavs uden den.
      show_chart_type_warning: toggleOption("Vis advarsel om diagramtype", true),
      lower_padding: paddingOption("Margen under plot (px):"),
      upper_padding: paddingOption("Margen over plot (px):"),
      left_padding: paddingOption("Margen til venstre (px):"),
      // Bredere end de øvrige: centerlinjens værdi står som default til højre
      // for sidste punkt. Tallet er et minimum — er etiketten bredere, måler
      // adjustPaddingForPanel den og udvider margenen tilsvarende, så den
      // aldrig lægger sig ind over signalpanelet. Panelets egen bredde er
      // reserveret særskilt.
      right_padding: numberOption("Margen til højre (px):", 50)
    }
  }
};

export default canvasSettings;
