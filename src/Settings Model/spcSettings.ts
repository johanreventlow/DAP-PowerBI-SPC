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
      //
      // xbar og s er ude af samme grund: datafeltet med gruppens
      // standardafvigelse er fjernet fra Byg-ruden, og uden det kan de to
      // korttyper ikke beregnes. De bliver i `valid`, så en gammel rapport
      // stadig åbner.
      chart_type: {
        ...dropdownOption(
          // Default som i qicharts2: `formals(qic)$chart` har "run" først.
          // Et seriediagram stiller ingen krav til fordelingen og er derfor det
          // sikre udgangspunkt, før brugeren tager stilling til diagramtypen.
          "Diagramtype", "run",
          // Rækkefølgen er listen, brugeren ser. Først datatypen — det
          // spørgsmål, en ikke-ekspert kan svare på — og kortkoden til sidst i
          // parentes. Nederst de klassiske kort med koden forrest; den
          // typografiske forskel virker som en "avanceret"-overskrift, uden at
          // der står en overskrift, man kan komme til at vælge.
          //
          // Etiketten klippes i den smalle formateringsrude, så det ord, der
          // adskiller punkterne, står først. "Procent/andel" frem for "Andel",
          // fordi Andel og Antal ellers ligner hinanden fra første stavelse.
          ["run", "ip", "pp", "up", "c", "t", "g", "i", "p", "u", "mr",
           "i_m", "i_mm", "xbar", "s"], "none",
          [
            "Seriediagram – udvikling over tid",
            "Måling – fx ventetid, blodtryk (I')",
            "Procent/andel – fx komplikationer (P')",
            "Rate – fx pr. 1000 patientdage (U')",
            "Antal – fx fald pr. måned (C)",
            "Tid mellem sjældne hændelser (T)",
            "Enheder mellem sjældne hændelser (G)",
            "I-kort – måling, klassisk",
            "P-kort – andel, klassisk",
            "U-kort – rate, klassisk",
            "MR-kort – variation mellem målinger",
            "i_m - Individuelle målinger: median-centerlinje",
            "i_mm - Individuelle målinger: median-centerlinje, median-MR-grænser",
            "xbar - Gennemsnit per gruppe",
            "s - Standardafvigelser per gruppe"
          ],
          ["i_m", "i_mm", "xbar", "s"]
        ),
        // Info-ikon ved indstillingens navn. Listen kan ikke bære vejledningen
        // alene, og der er ingen plads til hjælpetekst i ruden.
        description: "Vælg efter typen af tal: procent, rate, antal eller måling. I tvivl: Seriediagram."
      },
      outliers_in_limits: toggleOption("Behold outliers i grænseberegning", false),
      multiplier: numberOption("Multiplikator", 1, { min: 0 }),
      sig_figs: numberOption("Antal decimaler:", 2, { min: 0, max: 20 }),
      perc_labels: dropdownOption("Vis som procent", "Automatic", ["Automatic", "Yes", "No"], "none", ["Automatisk", "Ja", "Nej"]),
      split_on_click: toggleOption("Opdel i faser ved klik", false),
      num_points_subset: numberOption("Antal punkter til grænseberegning", undefined),
      subset_points_from: dropdownOption("Beregn grænser fra", "Start", ["Start", "End"], "none", ["Start", "Slut"]),
      subset_rebaselines: toggleOption("Anvend punktudvalg efter hver faseopdeling", false),
      ttip_show_date: toggleOption("Vis dato i tooltip", true),
      ttip_label_date: textOption("Dato-etiket i tooltip", "Automatic"),
      ttip_show_numerator: toggleOption("Vis tæller i tooltip", true),
      ttip_label_numerator: textOption("Tæller-etiket i tooltip", "Numerator"),
      ttip_show_denominator: toggleOption("Vis nævner i tooltip", true),
      ttip_label_denominator: textOption("Nævner-etiket i tooltip", "Denominator"),
      // Diagramtypen i tooltippet frem for på lærredet: en forkert valgt
      // korttype er matematisk forkert uden at se forkert ud, og her kan en
      // kollega opdage det uden at åbne formateringsruden.
      ttip_show_chart_type: toggleOption("Vis diagramtype i tooltip", true),
      ttip_label_chart_type: textOption("Diagramtype-etiket i tooltip", "Diagramtype"),
      ttip_show_value: toggleOption("Vis værdi i tooltip", true),
      ttip_label_value: textOption("Værdi-etiket i tooltip", "Automatic"),
      ll_truncate: numberOption("Afskær nedre grænser ved:", undefined),
      ul_truncate: numberOption("Afskær øvre grænser ved:", undefined)
    }
  }
};

export default spcSettings;
