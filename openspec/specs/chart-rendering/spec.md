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

Punktfarvning på canvas SHALL alene drives af `astpoint`-flags (astronomical). Tooltips og summary-table-rækker SHALL ikke indeholde shift-, trend- eller two-in-three-felter. NHS variation/assurance-ikoner SHALL ikke renderes — hverken i chart-hjørne eller som summary-table-kolonner/-filtre.

#### Scenario: Tooltip uden fjernede regler

- **WHEN** brugeren hover over et datapunkt
- **THEN** viser tooltip astronomical-status (hvis flagget) men ingen shift/trend/two-in-three-linjer

#### Scenario: Stiplet centerline uberørt af F2

- **WHEN** en data-gruppes Anhøj-signal (long-run eller few-crossings) er aktivt
- **THEN** rendres gruppens centerline-segment stiplet præcis som før F2 (per_group_signals-mekanismen er uændret)

