# Chart Rendering — Spec Delta (align-limits-qicharts2)

## ADDED Requirements

### Requirement: Limit-linje-flade (qicharts2-parity)

Chartet SHALL som default rendere præcis: datalinje, centerline (CL/target) og 3σ-kontrolgrænser (UCL/LCL). 95%-grænser (2σ) SHALL være tilgængelige som opt-in med default FRA — ækvivalent med qicharts2's `show.95 = FALSE`. 68%-grænser (1σ), specification-grænser og regressions-/trend-linje SHALL ikke findes — hverken som beregning, rendering, settings eller tooltip-indhold.

#### Scenario: Default-linjer matcher qicharts2

- **WHEN** en ny visual tilføjes uden settings-ændringer
- **THEN** vises kun datalinje + centerline + UCL/LCL (3σ); ingen 95%-, 68%-, specification- eller trend-linjer

#### Scenario: 95% som opt-in

- **WHEN** brugeren aktiverer "Show 95% Lines"
- **THEN** rendres 95%-grænserne (beregning og tooltips fungerer som hidtil)

#### Scenario: 68% findes ikke

- **WHEN** formatting-panelets Lines-grupper inspiceres
- **THEN** findes ingen "68% Limits"-, "Specification Limits"- eller "Trend"-gruppe

## MODIFIED Requirements

### Requirement: Point-flag rendering (kun astronomical)

Punktfarvning på canvas SHALL alene drives af `astpoint`-flags (astronomical) og SHALL bruge én konfigurerbar farve (`ast_colour`) for alle flagede punkter uanset retning. Tooltips og summary-table-rækker SHALL ikke indeholde shift-, trend-, two-in-three- eller specification-felter. NHS variation/assurance-ikoner SHALL ikke renderes.

#### Scenario: Tooltip uden fjernede elementer

- **WHEN** brugeren hover over et datapunkt
- **THEN** viser tooltip astronomical-status (hvis flagget) men ingen shift/trend/two-in-three/specification-linjer

#### Scenario: Flagede punkter har ens farve

- **WHEN** punkter er flagget både over og under grænserne
- **THEN** rendres alle med samme `ast_colour`

#### Scenario: Stiplet centerline uberørt

- **WHEN** en data-gruppes Anhøj-signal er aktivt
- **THEN** rendres gruppens centerline-segment stiplet (per_group_signals-mekanismen er uændret)
