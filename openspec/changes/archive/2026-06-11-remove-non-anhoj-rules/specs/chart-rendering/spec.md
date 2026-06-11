# Chart Rendering — Spec Delta (F2)

> NHS-ikon-fjernelsen vedrører upstream-adfærd der aldrig var spec'et i
> openspec — dokumenteret i proposal + NEWS. Dette delta tilføjer
> kontrakten for point-flag-rendering efter fjernelsen.

## ADDED Requirements

### Requirement: Point-flag rendering (kun astronomical)

Punktfarvning på canvas SHALL alene drives af `astpoint`-flags (astronomical). Tooltips og summary-table-rækker SHALL ikke indeholde shift-, trend- eller two-in-three-felter. NHS variation/assurance-ikoner SHALL ikke renderes — hverken i chart-hjørne eller som summary-table-kolonner/-filtre.

#### Scenario: Tooltip uden fjernede regler

- **WHEN** brugeren hover over et datapunkt
- **THEN** viser tooltip astronomical-status (hvis flagget) men ingen shift/trend/two-in-three-linjer

#### Scenario: Stiplet centerline uberørt af F2

- **WHEN** en data-gruppes Anhøj-signal (long-run eller few-crossings) er aktivt
- **THEN** rendres gruppens centerline-segment stiplet præcis som før F2 (per_group_signals-mekanismen er uændret)
