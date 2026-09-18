import { paddingOption, toggleOption } from "./common";

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
      right_padding: paddingOption("Margen til højre (px):")
    }
  }
};

export default canvasSettings;
