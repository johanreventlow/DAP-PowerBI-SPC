# Outlier Detection — Spec Delta (F2)

> Fjernelserne (shift/trend/twoInThree) vedrører upstream-adfærd der aldrig
> var spec'et i openspec — de dokumenteres i proposal + NEWS. Dette delta
> tilføjer den samlede regelsæt-kontrakt som erstatter dem.

## ADDED Requirements

### Requirement: Outlier-regelsæt (qicharts2-parity)

Systemets samlede regelsæt SHALL bestå af præcis: (1) astronomical-punktflagging (qicharts2 `sigma.signal`-ækvivalent) og (2) Anhøj-seriesignalerne long-run + few-crossings (qicharts2 `runs.signal`-ækvivalent). `outliersObject` SHALL bestå af `{ astpoint: string[], per_group_signals: { long_run, few_crossings }[] }`. Fast-n shift, trend (WE) og two-in-three (WE) SHALL ikke tilbydes — de har intet modstykke i qicharts2; Anhøj long-run med dynamisk tærskel er den danske shift-detektion.

#### Scenario: Kun qicharts2-regler eksponeres

- **WHEN** formatting-panelets Outlier Settings inspiceres
- **THEN** indeholder det grupperne General, Astronomical Points og Anhoej Rules — ingen Shifts-, Trends- eller Two-In-Three-grupper

#### Scenario: Fjernede regler beregnes ikke

- **WHEN** `flagOutliers` kører på en serie der ville have udløst fast-n shift (7 punkter samme side), trend eller two-in-three
- **THEN** produceres ingen flags for disse mønstre; kun astronomical + Anhøj-signaler beregnes
