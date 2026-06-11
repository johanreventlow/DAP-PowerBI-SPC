import {
  fontOption, toggleOption,
  colourOption, fontSizeOption, lineTypeOption,
  numberOption, dropdownOption
 } from "./common";

const labelsSettings = {
  description: "Værdietiketter",
  displayName: "Værdietiketter",
  settingsGroups: {
    "all": {
      show_labels: toggleOption("Vis værdietiketter", true),
      label_position: dropdownOption("Placering", "top", ["top", "bottom"], "none", ["Øverst", "Nederst"]),
      label_y_offset: numberOption("Afstand fra top/bund (px)", 20),
      label_line_offset: numberOption("Afstand fra forbindelseslinje (px)", 5),
      label_angle_offset: numberOption("Vinkelforskydning (grader)", 0, { min: -90, max: 90 }),
      label_font: fontOption("Skrifttype"),
      label_size: fontSizeOption("Skriftstørrelse"),
      label_colour: colourOption("Skriftfarve", "standard"),
      label_line_colour: colourOption("Forbindelseslinje: farve", "standard"),
      label_line_width: numberOption("Forbindelseslinje: tykkelse", 1, { min: 0, max: 100 }),
      label_line_type: lineTypeOption("Forbindelseslinje: type", "10 0"),
      label_line_max_length: numberOption("Maks. linjelængde (px)", 1000, { min: 0, max: 10000 }),
      label_marker_show: toggleOption("Show Line Markers", true),
      label_marker_offset: numberOption("Markørafstand fra værdi (px)", 5),
      label_marker_size: numberOption("Punktstørrelse", 3, { min: 0, max: 100 }),
      label_marker_colour: colourOption("Punktfarve", "standard"),
      label_marker_outline_colour: colourOption("Kantfarve", "standard")
    }
  }
};

export default labelsSettings;
