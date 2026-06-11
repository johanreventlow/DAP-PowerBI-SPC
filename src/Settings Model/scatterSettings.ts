import { colourOption, numberOption, toggleOption, dropdownOption } from "./common";

const scatterSettings = {
  description: "Datapunkter",
  displayName: "Datapunkter",
  settingsGroups: {
    "all": {
      show_dots: toggleOption("Vis datapunkter", true),
      shape: dropdownOption("Form", "Circle", ["Circle", "Cross", "Diamond", "Square", "Star", "Triangle", "Wye"], "none", ["Cirkel", "Kryds", "Diamant", "Firkant", "Stjerne", "Trekant", "Y-form"]),
      size: numberOption("Størrelse", 2.5, { min: 0, max: 100 }),
      colour: colourOption("Farve", "common_cause"),
      colour_outline: colourOption("Kantfarve", "common_cause"),
      width_outline: numberOption("Kanttykkelse", 1, { min: 0, max: 100 }),
      opacity: numberOption("Gennemsigtighed", 1, { min: 0, max: 1 }),
      opacity_selected: numberOption("Gennemsigtighed (valgt)", 1, { min: 0, max: 1 }),
      opacity_unselected: numberOption("Gennemsigtighed (fravalgt)", 0.2, { min: 0, max: 1 })
    }
  }
};

export default scatterSettings;
