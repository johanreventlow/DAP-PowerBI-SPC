import { numberOption, toggleOption, textOption, dropdownOption } from "./common";

const spcSettings = {
  description: "SPC-indstillinger",
  displayName: "SPC-indstillinger",
  settingsGroups: {
    "all": {
      // i_m og i_mm tilbydes ikke længere i dropdownen — ingen af dem findes
      // i qicharts2 — men de bliver i `valid`, så en rapport, hvor chart_type
      // allerede er gemt som en af dem, stadig renderer i stedet for at falde
      // tilbage til default med en fejlbesked.
      // Se openspec/changes/complete-qicharts2-alignment.
      chart_type: dropdownOption(
        "Diagramtype", "i",
        ["run", "i", "i_m", "i_mm", "mr", "p", "pp", "u", "up", "c", "xbar", "s", "g", "t"], "none",
        [
          "run - Seriediagram (median)",
          "i - Individuelle målinger",
          "i_m - Individuelle målinger: median-centerlinje",
          "i_mm - Individuelle målinger: median-centerlinje, median-MR-grænser",
          "mr - Glidende variationsbredde (moving range)",
          "p - Andele",
          "p' - Andele: korrigeret for store stikprøver",
          "u - Rater",
          "u' - Rater: korrigeret for store stikprøver",
          "c - Antal",
          "xbar - Gennemsnit per gruppe",
          "s - Standardafvigelser per gruppe",
          "g - Antal enheder mellem hændelser",
          "t - Tid mellem hændelser"
        ],
        ["i_m", "i_mm"]
      ),
      outliers_in_limits: toggleOption("Behold outliers i grænseberegning", false),
      multiplier: numberOption("Multiplikator", 1, { min: 0 }),
      sig_figs: numberOption("Antal decimaler:", 2, { min: 0, max: 20 }),
      perc_labels: dropdownOption("Vis som procent", "Automatic", ["Automatic", "Yes", "No"], "none", ["Automatisk", "Ja", "Nej"]),
      split_on_click: toggleOption("Opdel i faser ved klik", false),
      num_points_subset: numberOption("Antal punkter til grænseberegning", undefined),
      subset_points_from: dropdownOption("Beregn grænser fra", "Start", ["Start", "End"], "none", ["Start", "Slut"]),
      ttip_show_date: toggleOption("Vis dato i tooltip", true),
      ttip_label_date: textOption("Dato-etiket i tooltip", "Automatic"),
      ttip_show_numerator: toggleOption("Vis tæller i tooltip", true),
      ttip_label_numerator: textOption("Tæller-etiket i tooltip", "Numerator"),
      ttip_show_denominator: toggleOption("Vis nævner i tooltip", true),
      ttip_label_denominator: textOption("Nævner-etiket i tooltip", "Denominator"),
      ttip_show_value: toggleOption("Vis værdi i tooltip", true),
      ttip_label_value: textOption("Værdi-etiket i tooltip", "Automatic"),
      ll_truncate: numberOption("Afskær nedre grænser ved:", undefined),
      ul_truncate: numberOption("Afskær øvre grænser ved:", undefined)
    }
  }
};

export default spcSettings;
