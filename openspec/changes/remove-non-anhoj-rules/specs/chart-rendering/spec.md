# Chart Rendering — Spec Delta (F2)

## REMOVED Requirements

### Requirement: NHS Variation/Assurance Icons

**Reason**: NHS-ikonsystemet (variation/assurance-ikoner i chart-hjørne og summary table) er engelsk praksis drevet af de fjernede regler (shift/trend/twoInThree); det indgår ikke i dansk qicharts2-baseret SPC-formidling.

**Migration**: Ingen erstatning — Anhøj-signalet formidles via stiplet centerline. Rapporter med `show_variation_icons`/`show_assurance_icons` gemt: Power BI ignorerer ukendte properties.

### Requirement: Summary Table Icon Columns & Filters

**Reason**: Variation/assurance-kolonner og tilhørende filtre (`table_variation_filter`, `table_assurance_filter`) er NHS-ikon-afhængige.

**Migration**: Summary table består med data-kolonner (værdi, target, grænser, astronomical-flag). Ikon-kolonner og -filtre udgår.

## MODIFIED Requirements

### Requirement: Point-flag rendering

Punktfarvning på canvas SHALL alene drives af `astpoint`-flags (astronomical). Tooltips og summary-table-rækker SHALL ikke indeholde shift-, trend- eller two-in-three-felter.

#### Scenario: Tooltip uden fjernede regler

- **WHEN** brugeren hover over et datapunkt
- **THEN** viser tooltip astronomical-status (hvis flagget) men ingen shift/trend/two-in-three-linjer

#### Scenario: Stiplet centerline uberørt af F2

- **WHEN** en data-gruppes Anhøj-signal (long-run eller few-crossings) er aktivt
- **THEN** rendres gruppens centerline-segment stiplet præcis som før F2 (per_group_signals-mekanismen er uændret)
