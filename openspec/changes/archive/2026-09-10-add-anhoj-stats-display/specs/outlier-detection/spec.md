# Outlier Detection — Spec Delta (add-anhoj-stats-display)

## ADDED Requirements

### Requirement: Anhøj-statistik per fase

`per_group_signals[g]` SHALL indeholde et `stats`-felt med runs-analysens grundtal for fasen: `{ nUseful, longestRun, longestRunMax, nCrossings, nCrossingsMin, longRunSignal, fewCrossingsSignal }`. Tallene SHALL være identiske med qicharts2's `summary()` for samme data (samme definitioner som de eksisterende regler). Statistikken beregnes uanset toggle-tilstand; dash-signalerne forbliver gated af deres toggles.

#### Scenario: Stats matcher qicharts2-fixtures

- **WHEN** `anhojStats` køres på et fixture-datasæt
- **THEN** matcher nUseful, longestRun, longestRunMax, nCrossings og nCrossingsMin fixture-værdierne (genereret af qicharts2 0.8.1)

#### Scenario: Degenereret fase

- **WHEN** en fase har `nUseful < 2`
- **THEN** er longestRun/nCrossings/tærskler markeret utilgængelige (null) og begge signaler false
