# Chart Rendering — Spec Delta

## ADDED Requirements

### Requirement: Dashed Centerline on Per-Group Global Signal

Centerline-segmenter MUST renderes med stiplet stroke når deres data-gruppes `global_signals.long_run || global_signals.few_crossings` er sand. Segmenter fra grupper uden signal renderes som solid linje (eksisterende adfærd).

**Per-segment-evaluering kritisk:** Multi-group charts (split-charts, rebaseline efter intervention) MUST ej over-dashe segmenter fra grupper uden signal. Implementeret via `group_signal_dashed: boolean`-felt på `lineData` (én værdi per segment).

Stiplet stil følger eksisterende repo-konvention (D3 `stroke-dasharray`). Samme stiplet-stil bruges uanset hvilken global signal der udløste den — signalerne er statistisk korrelerede, og visuel differentiering vil tilføje støj uden semantisk værdi.

#### Scenario: Ingen globale signaler giver solid centerline

- **WHEN** `global_signals.long_run = false` og `global_signals.few_crossings = false`
- **THEN** centerline renderes solid (eksisterende stil)

#### Scenario: Long run-signal udløser stiplet centerline

- **WHEN** `global_signals.long_run = true` og `global_signals.few_crossings = false`
- **THEN** centerline renderes stiplet

#### Scenario: Few crossings-signal udløser stiplet centerline

- **WHEN** `global_signals.long_run = false` og `global_signals.few_crossings = true`
- **THEN** centerline renderes stiplet

#### Scenario: Begge signaler giver samme stiplet stil

- **WHEN** `global_signals.long_run = true` og `global_signals.few_crossings = true`
- **THEN** centerline renderes stiplet (samme stil som ved ét signal — ej dobbelt-stiplet eller anderledes)

### Requirement: Centerline Rendering Independent of Outlier Settings

Stiplet-stil MUST drives udelukkende af `globalSignals`-felter. Den må ej afhænge af `improvement_direction`, `process_flag_type` eller individuelle outlier-toggles (`astronomical`, `trend`, etc.).

#### Scenario: Anhøj-signal udløser stiplet uanset andre regler

- **WHEN** `anhoj_few_crossings = true` udløser signal, men `astronomical`, `trend`, `shift` er alle slukket
- **THEN** centerline renderes stiplet
