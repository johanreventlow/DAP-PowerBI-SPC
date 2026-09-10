import { colourOption, numberOption, toggleOption, dropdownOption, textOption } from "./common";

// Labels are text inputs rather than fixed strings so the panel can be run in
// Danish without translating the rest of the formatting pane, following the
// same pattern as the existing ttip_label_* settings.
const signalPanelSettings = {
  description: "Signalpanel",
  displayName: "Signalpanel",
  settingsGroups: {
    "Panel": {
      show_panel: toggleOption("Vis signalpanel", true),
      panel_width: numberOption("Panelbredde", 232, { min: 80, max: 600 }),
      panel_hide_below_width: numberOption("Skjul under diagrambredde", 480, { min: 0 }),
      panel_periods: dropdownOption("Perioder der vises", "newest", ["newest", "all"],
                                    "none", ["Kun seneste", "Alle (kompakt)"]),
      panel_show_n_useful: toggleOption("Vis antal brugbare observationer", true),
      panel_title: textOption("Paneltitel", "Statistisk proceskontrol (SPC)"),
      panel_font_size: numberOption("Talstørrelse", 25, { min: 6, max: 60 }),
      panel_label_size: numberOption("Etiketstørrelse", 9.5, { min: 4, max: 30 }),
      panel_signal_colour: colourOption("Signalfremhævning", "signal_box")
    },
    "Etiketter": {
      label_expected: textOption("Kolonne: forventet", "Forventet"),
      label_actual: textOption("Kolonne: faktisk", "Faktisk"),
      label_longest_run: textOption("Række: serielængde", "Serielængde (maksimum)"),
      label_crossings: textOption("Række: antal kryds", "Antal kryds (minimum)"),
      label_beyond_limits: textOption("Række: uden for kontrolgrænse", "Obs. uden for kontrolgrænse"),
      label_n_useful: textOption("Række: brugbare observationer", "Antal brugbare obs."),
      label_period: textOption("Periode-præfiks", "Periode")
    },
    "Tooltip": {
      ttip_show_signals: toggleOption("Vis signaltal i tooltip", true),
      ttip_label_expected: textOption("Suffiks for forventet", "forventet")
    }
  }
};

export default signalPanelSettings;
