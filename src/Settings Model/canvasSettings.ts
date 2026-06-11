import { paddingOption, toggleOption } from "./common";

const canvasSettings = {
  description: "Plotområde",
  displayName: "Plotområde",
  settingsGroups: {
    "all": {
      show_errors: toggleOption("Vis fejlbeskeder på diagrammet", true),
      lower_padding: paddingOption("Margen under plot (px):"),
      upper_padding: paddingOption("Margen over plot (px):"),
      left_padding: paddingOption("Margen til venstre (px):"),
      right_padding: paddingOption("Margen til højre (px):")
    }
  }
};

export default canvasSettings;
