# Outlier Detection — Spec Delta (F2)

## REMOVED Requirements

### Requirement: Shift Detection (fast n)

**Reason**: qicharts2 har ingen fast-n shift-regel — Anhøj long-run med dynamisk tærskel `round(log2(n_useful)) + 3` ER den danske shift-detektion (verificeret empirisk mod qicharts2 0.8.1, 2026-06-11). To overlappende shift-regler forvirrer klinikere.

**Migration**: Aktivér "Dash Centerline on Long Run" under Anhoej Rules. Rapporter med `shift`-toggle gemt: Power BI ignorerer den ukendte property; ingen handling påkrævet.

### Requirement: Trend Detection (n stigende/faldende)

**Reason**: Walker-Evans-regel uden modstykke i qicharts2/dansk praksis.

**Migration**: Ingen erstatning — reglen indgår ikke i dansk SPC-analyse. Gemte `trend`-settings ignoreres af Power BI.

### Requirement: Two-In-Three Detection

**Reason**: WE-regel (2 af 3 udenfor warning-limits) uden modstykke i qicharts2/dansk praksis.

**Migration**: Ingen erstatning. Gemte `two_in_three`-settings ignoreres af Power BI.

## MODIFIED Requirements

### Requirement: Outlier-regelsæt (qicharts2-parity)

Systemets samlede regelsæt SHALL bestå af præcis: (1) astronomical-punktflagging (qicharts2 `sigma.signal`-ækvivalent) og (2) Anhøj-seriesignalerne long-run + few-crossings (qicharts2 `runs.signal`-ækvivalent). `outliersObject` SHALL reduceres til `{ astpoint: string[], per_group_signals: { long_run, few_crossings }[] }`. Direction-mapping (`checkFlagDirection` med `process_flag_type`/`improvement_direction`) SHALL kun anvendes på `astpoint`.

#### Scenario: Kun qicharts2-regler eksponeres

- **WHEN** formatting-panelets Outlier Settings inspiceres
- **THEN** indeholder det grupperne General, Astronomical Points og Anhoej Rules — ingen Shifts-, Trends- eller Two-In-Three-grupper

#### Scenario: Astronomical består uændret

- **WHEN** `astronomical`-toggle er aktiv og et punkt ligger udenfor kontrolgrænserne
- **THEN** flagges punktet som hidtil (improvement/deterioration/neutral via direction-mapping)

#### Scenario: Fjernede regler beregnes ikke

- **WHEN** `flagOutliers` kører på en serie der ville have udløst shift (7 punkter samme side), trend eller two-in-three
- **THEN** produceres ingen flags for disse mønstre; kun astronomical + Anhøj-signaler beregnes
