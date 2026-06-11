# chart-rendering Specification

## Purpose
TBD - created by archiving change add-anhoj-rules. Update Purpose after archive.
## Requirements
### Requirement: Dashed Centerline on Per-Group Global Signal

Centerline-segmenter MUST renderes med stiplet stroke når deres data-gruppes `per_group_signals[g].long_run || per_group_signals[g].few_crossings` er sand. Segmenter fra grupper uden signal renderes som solid linje (eksisterende adfærd).

**Per-segment-evaluering kritisk:** Multi-group charts (split-charts, rebaseline efter intervention) MUST ej over-dashe segmenter fra grupper uden signal. Implementeret via `group_signal_dashed: boolean`-felt på `lineData` (én værdi per segment).

Stiplet stil følger eksisterende repo-konvention (D3 `stroke-dasharray`). Samme stiplet-stil bruges uanset hvilken global signal der udløste den — signalerne er statistisk korrelerede, og visuel differentiering vil tilføje støj uden semantisk værdi.

#### Scenario: Ingen globale signaler giver solid centerline

- **WHEN** `per_group_signals[g].long_run = false` og `per_group_signals[g].few_crossings = false`
- **THEN** centerline renderes solid (eksisterende stil)

#### Scenario: Long run-signal udløser stiplet centerline

- **WHEN** `per_group_signals[g].long_run = true` og `per_group_signals[g].few_crossings = false`
- **THEN** centerline renderes stiplet

#### Scenario: Few crossings-signal udløser stiplet centerline

- **WHEN** `per_group_signals[g].long_run = false` og `per_group_signals[g].few_crossings = true`
- **THEN** centerline renderes stiplet

#### Scenario: Begge signaler giver samme stiplet stil

- **WHEN** `per_group_signals[g].long_run = true` og `per_group_signals[g].few_crossings = true`
- **THEN** centerline renderes stiplet (samme stil som ved ét signal — ej dobbelt-stiplet eller anderledes)

### Requirement: Centerline Rendering Independent of Outlier Settings

Stiplet-stil MUST drives udelukkende af `per_group_signals`-felter. Den må ej afhænge af `improvement_direction`, `process_flag_type` eller individuelle outlier-toggles (`astronomical`, `trend`, etc.).

#### Scenario: Anhøj-signal udløser stiplet uanset andre regler

- **WHEN** `anhoj_few_crossings = true` udløser signal, men `astronomical`, `trend`, `shift` er alle slukket
- **THEN** centerline renderes stiplet

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

