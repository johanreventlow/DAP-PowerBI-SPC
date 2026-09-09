import { colourOption, numberOption, toggleOption, dropdownOption, textOption } from "./common";

// Labels are text inputs rather than fixed strings so the panel can be run in
// Danish without translating the rest of the formatting pane, following the
// same pattern as the existing ttip_label_* settings.
const signalPanelSettings = {
  description: "Signal Panel",
  displayName: "Signal Panel",
  settingsGroups: {
    "Panel": {
      show_panel: toggleOption("Show Signal Panel", true),
      panel_width: numberOption("Panel Width", 232, { min: 80, max: 600 }),
      panel_hide_below_width: numberOption("Hide Below Chart Width", 480, { min: 0 }),
      panel_periods: dropdownOption("Periods to Show", "newest", ["newest", "all"],
                                    "none", ["Newest only", "All (compact)"]),
      panel_show_n_useful: toggleOption("Show Usable Observations", true),
      panel_title: textOption("Panel Title", "Statistisk proceskontrol (SPC)"),
      panel_font_size: numberOption("Number Size", 25, { min: 6, max: 60 }),
      panel_label_size: numberOption("Label Size", 9.5, { min: 4, max: 30 }),
      panel_signal_colour: colourOption("Signal Highlight", "signal_box")
    },
    "Labels": {
      label_expected: textOption("Column: Expected", "Forventet"),
      label_actual: textOption("Column: Actual", "Faktisk"),
      label_longest_run: textOption("Row: Longest Run", "Serielængde (maksimum)"),
      label_crossings: textOption("Row: Crossings", "Antal kryds (minimum)"),
      label_beyond_limits: textOption("Row: Beyond Limits", "Obs. uden for kontrolgrænse"),
      label_n_useful: textOption("Row: Usable Observations", "Antal brugbare obs."),
      label_period: textOption("Period Prefix", "Periode")
    },
    "Tooltip": {
      ttip_show_signals: toggleOption("Show Signal Counts in Tooltip", true),
      ttip_label_expected: textOption("Expected Suffix", "forventet")
    }
  }
};

export default signalPanelSettings;
