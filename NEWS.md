# NEWS

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
