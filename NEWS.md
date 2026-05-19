# NEWS

## (development) — F1 Anhøj-regler

### Nye features

* **Anhøj long-run-regel** (settings → Outlier Settings → Anhøj Rules): flagger
  punkter i runs der overstiger den dynamiske tærskel `round(log2(n_useful)) + 3`.
  Implementeret iht. `qicharts2`'s `runs.analysis`-algoritme, med PowerBI-SPC-
  specifik udvidelse til at flagge specifikke punkter i alle max-længde-runs.
* **Anhøj few-crossings-regel**: stipler centerline når antallet af median-
  krydsninger er under den binomialt-baserede tærskel
  `qbinom(0.05, n_useful - 1, 0.5)`.
* **Per-data-gruppe-signal-rendering**: i multi-group / rebaseline-charts dasher
  kun de centerline-segmenter hvis gruppe har Anhøj-signal — øvrige segmenter
  forbliver solid.
* **Direction-agnostisk Anhøj-farvelægning**: Anhøj long-run-flags bypasser
  `improvement_direction`-mapping. Brugeren konfigurerer farver via
  Neutral-(Low) / Neutral-(High)-color-pickers under "Anhøj Rules".

### Interne ændringer

* Ny statistisk helper `src/Functions/qbinom.ts` (kvantilfunktion for
  binomialfordelingen, log-space PMF-akkumulering via eksisterende `lgamma`).
* `outliersObject`-type udvidet med `anhoj_long_run: string[]`,
  `global_signals: { long_run, few_crossings }` og per-group-signal-array
  til centerline-rendering.
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
