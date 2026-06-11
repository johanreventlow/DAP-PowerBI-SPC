# NEWS

## (development) — Limit-flade alignet til qicharts2

### Breaking changes

* **68%-grænser (1σ) fjernet helt** — beregning, linjer, settings,
  tooltips og tabel-kolonner. qicharts2 har intet 1σ-koncept.
* **95%-grænser (2σ) er nu opt-in med default FRA** — matcher qicharts2's
  `show.95 = FALSE`. Genaktivér under Lines → 95% Limits.
* **Astronomical flagger altid mod 3σ** — `astronomical_limit`-dropdown
  (1σ/2σ/Specification) fjernet; matcher qicharts2's `sigma.signal`.
* **Én farve for astronomical-punkter** — retningssemantikken
  (`process_flag_type`, `improvement_direction` og fire retningsfarver)
  er fjernet; alle flagede punkter farves med `ast_colour`, ens for
  punkter over og under grænserne.
* **Specification-grænser fjernet** — findes ikke i qicharts2.
* **Trend-linje (regression) fjernet** — findes ikke i qicharts2.

Gemte settings for fjernede properties ignoreres af Power BI ved load.

### Interne ændringer

* `controlLimitsObject` uden ll68/ul68/speclimits/trend_line;
  `checkFlagDirection` + `calculateTrendLine` slettet.
* Outlier Settings = Astronomical Points + Anhoej Rules; Lines-grupper
  = Main, Target, 95% Limits, 99% Limits.

## (development) — F2 Fjernelse af ikke-Anhøj-regler

### Breaking changes

* **`shift`-reglen fjernet** (fast-n, default 7 punkter samme side):
  qicharts2 har ingen fast-n-regel — Anhøj long-run med dynamisk tærskel
  ER den danske shift-detektion. Migration: aktivér "Dash Centerline on
  Long Run" under Anhøj Rules.
* **`trend`- og `twoInThree`-reglerne fjernet**: Walker-Evans-regler uden
  modstykke i qicharts2/dansk praksis. Ingen erstatning.
* **NHS variation/assurance-ikoner fjernet** inkl. settings-kort,
  SVG-assets, summary-table-ikon-kolonner og -filtre. Anhøj-signalet
  formidles via stiplet centerline.
* `astronomical` (punkter udenfor kontrolgrænser) **beholdt** — matcher
  qicharts2's `sigma.signal` (verificeret empirisk). Afviger fra
  oprindelig faseplan, som ville fjerne astronomical og beholde shift;
  begge ændringer begrundet i qicharts2-parity.

Gemte settings for fjernede properties ignoreres af Power BI ved load —
ingen migration af eksisterende rapporter nødvendig.

### Interne ændringer

* `outliersObject` reduceret til `{ astpoint, per_group_signals }`;
  direction-mapping forenklet til kun astronomical.
* Outlier-settings-panelet viser nu præcis tre grupper: General,
  Astronomical Points, Anhoej Rules.

## (development) — F1 Anhøj-regler

### Nye features

* **Anhøj long-run-regel** (settings → Outlier Settings → Anhøj Rules): stipler
  centerline når længste run på samme side af centerline overstiger den
  dynamiske tærskel `round(log2(n_useful)) + 3`. Seriesignal per data-gruppe —
  ingen punktmarkering, eksakt som `qicharts2`'s `runs.analysis`.
* **Anhøj few-crossings-regel**: stipler centerline når antallet af median-
  krydsninger er under den binomialt-baserede tærskel
  `qbinom(0.05, n_useful - 1, 0.5)`.
* **Per-data-gruppe-signal-rendering**: i multi-group / rebaseline-charts dasher
  kun de centerline-segmenter hvis gruppe har Anhøj-signal — øvrige segmenter
  forbliver solid.

### Interne ændringer

* Ny statistisk helper `src/Functions/qbinom.ts` (kvantilfunktion for
  binomialfordelingen, log-space PMF-akkumulering via eksisterende `lgamma`).
* `outliersObject`-type udvidet med per-group-signal-array
  `per_group_signals: { long_run, few_crossings }[]` til centerline-rendering.
* Per-punkt-flagging af long-runs (NHS-stil udvidelse fra tidlig F1-iteration)
  fjernet igen efter empirisk qicharts2-review: Anhøj-metoden flagger ikke
  enkeltpunkter, kun seriesignal → stiplet centerline. Tilhørende
  colour-picker-settings fjernet fra settings + capabilities.
* `lineData`-type udvidet med `group_signal_dashed?: boolean`.
* Test-fixtures regenereret fra `qicharts2` v0.8.1
  (`test/Outlier Flagging/anhoj-fixtures-gen.R`).

### Reference

* Anhøj-rules implementeret iht. `qicharts2` v0.8.1 (Anhoej, Olesen).
* `qicharts2::qic` source: <https://github.com/anhoej/qicharts2>.

### Out of scope (planlagt til senere phases)

* F2: Fjernelse af `astronomical`, `trend`, `twoInThree` outlier-regler.
* F2: Fjernelse af NHS Icons.
* F3: Rebrand til BFH-variant.
