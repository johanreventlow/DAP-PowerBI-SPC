import {
  toggleOption, numberOption,
  fontOption, fontSizeOption, colourOption, dropdownOption,
  borderStyleOption, borderWidthOption, alignmentOption,
  fontWeightOption, textTransformOption
} from "./common";

const summaryTableSettings = {
  description: "Oversigtstabel",
  displayName: "Oversigtstabel",
  settingsGroups: {
    "Generelt": {
      show_table: toggleOption("Vis oversigtstabel", false),
      table_text_overflow: dropdownOption("Tekstoverløb", "ellipsis", ["ellipsis", "clip", "none"], "none", ["Udeladelsesprikker (…)", "Klip", "Ingen"]),
      table_opacity: numberOption("Gennemsigtighed", 1, { min: 0, max: 1 }),
      table_opacity_selected: numberOption("Gennemsigtighed (valgt)", 1, { min: 0, max: 1 }),
      table_opacity_unselected: numberOption("Gennemsigtighed (fravalgt)", 0.2, { min: 0, max: 1 }),
      table_outer_border_style: borderStyleOption("Ydre rammestil"),
      table_outer_border_width: borderWidthOption("Ydre rammetykkelse"),
      table_outer_border_colour: colourOption("Ydre rammefarve", "standard"),
      table_outer_border_top: toggleOption("Ramme i top", true),
      table_outer_border_bottom: toggleOption("Ramme i bund", true),
      table_outer_border_left: toggleOption("Ramme til venstre", true),
      table_outer_border_right: toggleOption("Ramme til højre", true)
    },
    "Overskrift": {
      table_header_font: fontOption("Skrifttype"),
      table_header_size: fontSizeOption("Skriftstørrelse"),
      table_header_text_align: alignmentOption("Justering"),
      table_header_font_weight: fontWeightOption("Skriftvægt"),
      table_header_text_transform: textTransformOption("Teksttransform"),
      table_header_text_padding: numberOption("Tekstafstand", 1, { min: 0, max: 100 }),
      table_header_colour: colourOption("Skriftfarve", "standard"),
      table_header_bg_colour: colourOption("Baggrundsfarve", "lightgray"),
      table_header_border_style: borderStyleOption("Rammestil"),
      table_header_border_width: borderWidthOption("Rammetykkelse"),
      table_header_border_colour: colourOption("Rammefarve", "standard"),
      table_header_border_bottom: toggleOption("Bundramme", true),
      table_header_border_inner: toggleOption("Indre rammer", true)
    },
    "Indhold": {
      table_body_font: fontOption("Skrifttype"),
      table_body_size: fontSizeOption("Skriftstørrelse"),
      table_body_text_align: alignmentOption("Justering"),
      table_body_font_weight: fontWeightOption("Skriftvægt"),
      table_body_text_transform: textTransformOption("Teksttransform"),
      table_body_text_padding: numberOption("Tekstafstand", 1, { min: 0, max: 100 }),
      table_body_colour: colourOption("Skriftfarve", "standard"),
      table_body_bg_colour: colourOption("Baggrundsfarve", "white"),
      table_body_border_style: borderStyleOption("Rammestil"),
      table_body_border_width: borderWidthOption("Rammetykkelse"),
      table_body_border_colour: colourOption("Rammefarve", "standard"),
      table_body_border_top_bottom: toggleOption("Vandrette rammer", true),
      table_body_border_left_right: toggleOption("Lodrette rammer", true)
    }
  }
};

export default summaryTableSettings;
