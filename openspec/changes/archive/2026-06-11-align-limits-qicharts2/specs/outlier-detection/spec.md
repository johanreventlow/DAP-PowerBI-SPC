# Outlier Detection — Spec Delta (align-limits-qicharts2)

## MODIFIED Requirements

### Requirement: Outlier-regelsæt (qicharts2-parity)

Systemets samlede regelsæt SHALL bestå af præcis: (1) astronomical-punktflagging (qicharts2 `sigma.signal`-ækvivalent) og (2) Anhøj-seriesignalerne long-run + few-crossings (qicharts2 `runs.signal`-ækvivalent). `outliersObject` SHALL bestå af `{ astpoint: string[], per_group_signals: { long_run, few_crossings }[] }`. Fast-n shift, trend (WE) og two-in-three (WE) SHALL ikke tilbydes.

Astronomical-flagging SHALL altid evalueres mod 3σ-grænserne (ll99/ul99) — ingen konfigurerbar limit. Flag-værdier er "upper"/"lower"/"none" internt, men farvning SHALL ske med ÉN konfigurerbar farve (`ast_colour`) uafhængigt af retning. Retningssemantik (`process_flag_type`, `improvement_direction`, direction-mapping) SHALL ikke findes.

#### Scenario: Kun qicharts2-regler eksponeres

- **WHEN** formatting-panelets Outlier Settings inspiceres
- **THEN** indeholder det grupperne Astronomical Points og Anhoej Rules — ingen General-, Shifts-, Trends- eller Two-In-Three-grupper

#### Scenario: Astronomical altid 3σ

- **WHEN** et punkt ligger udenfor ll99/ul99
- **THEN** flagges det — uden at brugeren kan vælge anden grænse (1σ/2σ/Specification findes ikke)

#### Scenario: Én farve uanset retning

- **WHEN** to punkter flagges, ét over UCL og ét under LCL
- **THEN** farves begge med samme `ast_colour`

#### Scenario: Fjernede regler beregnes ikke

- **WHEN** `flagOutliers` kører på en serie der ville have udløst fast-n shift (7 punkter samme side), trend eller two-in-three
- **THEN** produceres ingen flags for disse mønstre; kun astronomical + Anhøj-signaler beregnes
