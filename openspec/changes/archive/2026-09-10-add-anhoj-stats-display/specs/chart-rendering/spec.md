# Chart Rendering — Spec Delta (add-anhoj-stats-display)

## ADDED Requirements

### Requirement: On-canvas Anhøj-statistik

Når `show_anhoj_stats` er aktiveret SHALL chartet rendere en tekstblok per fase, placeret centreret over fasens x-interval øverst i plotområdet, med to linjer: `<label_run>: <longestRun> (maks <longestRunMax>)` og `<label_crossings>: <nCrossings> (min <nCrossingsMin>)`. Labels, font, størrelse og farve SHALL være konfigurerbare; danske defaults ("Længste serie", "Kryds"). Default er elementet slået FRA. Faser med `nUseful < 2` renderer ingen tekstblok.

#### Scenario: Default ingen ændring

- **WHEN** en eksisterende rapport opgraderes uden settings-ændringer
- **THEN** vises ingen statistik-tekst (toggle default false)

#### Scenario: Per-fase tal

- **WHEN** chartet har to faser (rebaseline) og toggle er aktiv
- **THEN** vises to tekstblokke — én per fase — med fasens egne tal og tærskler

#### Scenario: Degenereret fase springes over

- **WHEN** en fase udelukkende har observationer på centerline
- **THEN** rendres ingen tekstblok for den fase
