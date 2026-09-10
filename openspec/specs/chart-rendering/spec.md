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

Stiplet-stil MUST drives udelukkende af `per_group_signals`-felter. Den må ej afhænge af `astronomical`-toggle. Retningsbegreberne `improvement_direction` og `process_flag_type` findes ikke længere.

#### Scenario: Anhøj-signal udløser stiplet uanset andre regler

- **WHEN** `anhoj_few_crossings = true` udløser signal, men `astronomical` er slukket
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

### Requirement: Limit Surface

Diagrammet SKAL vise datalinje, centerlinje (CL/target) og 3σ-kontrolgrænser
(UCL/LCL).

Diagrammet SKAL IKKE vise andre grænseniveauer. 95%-grænser (2σ), 68%-grænser
(1σ), specifikationsgrænser og regressions-/trendlinje findes ikke — hverken
som beregning, rendering, settings eller tooltip-indhold.

#### Scenario: Default-linjer matcher qicharts2

- **WHEN** en ny visual tilføjes uden settings-ændringer
- **THEN** vises kun datalinje + centerlinje + UCL/LCL (3σ)

#### Scenario: De fjernede grænser findes ikke

- **WHEN** formateringsrudens Linjer-grupper inspiceres
- **THEN** findes hverken 95%-, 68%-, specifikations- eller trendgruppe

### Requirement: Available Chart Types

Chart Type-dropdownen SKAL tilbyde: `run`, `i`, `mr`, `p`, `pp`, `u`, `up`,
`c`, `xbar`, `s`, `g`, `t`.

`i_m` og `i_mm` SKAL IKKE fremgå af dropdownen.

Beregningerne for `i_m` og `i_mm` SKAL blive i pakken, og en gemt `chart_type`
med en af de to værdier SKAL fortsat rendere korrekt. De er skjult, ikke
fjernet: `i_m` (median centerlinje + gennemsnitligt moving range) ligger tæt på
dansk praksis og kan genindsættes ved at føje den til dropdownen igen.

#### Scenario: Brugeren vælger chart-type

- **GIVEN** formateringsruden er åben
- **WHEN** Chart Type-dropdownen foldes ud
- **THEN** vises hverken `i_m` eller `i_mm`

#### Scenario: Rapport med gemt i_m

- **GIVEN** en rapport, hvor `chart_type` er gemt som `i_m`
- **WHEN** rapporten indlæses
- **THEN** renderes diagrammet med median centerlinje og moving-range-baserede
  grænser som hidtil

### Requirement: Control Limit Band

Diagrammet SKAL kunne vise området mellem nedre og øvre 3σ-grænse som et
udfyldt bånd.

Båndet SKAL være slået fra som default. Farve og gennemsigtighed SKAL kunne
konfigureres. Båndet SKAL tegnes bag linjer og punkter, så det ikke skjuler
dem, og SKAL brydes ved faseskift, så det ikke forbinder to faser med
forskellige grænser.

#### Scenario: Faseopdelt diagram

- **GIVEN** et diagram med to faser og forskellige grænser i hver
- **WHEN** båndet er slået til
- **THEN** tegnes ét bånd per fase, uden forbindelse hen over faseskiftet

#### Scenario: Diagram uden kontrolgrænser

- **GIVEN** et run-diagram, som ikke har kontrolgrænser
- **WHEN** båndet er slået til
- **THEN** tegnes intet bånd

### Requirement: Danish User-Facing Text

Al tekst, brugeren møder, SKAL være på dansk: formateringsruden (kortnavne,
gruppenavne, indstillingsnavne og dropdown-valg), feltbrøndenes navne,
tooltips, oversigtstabellens kolonneoverskrifter og fejlbeskeder.

Terminologien SKAL følge dansk SPC-praksis som i Anhøjs litteratur og
`qicharts2`: serie, kryds, kontrolgrænser, centerlinje, faser.

Fagbegrebet "Anhøj" SKAL IKKE fremgå af den brugervendte flade. Det må gerne
bruges i kode, kommentarer og dokumentation — og i property-nøgler, som
brugeren ikke ser.

#### Scenario: Formateringsruden inspiceres

- **WHEN** hele formateringsruden læses igennem
- **THEN** er ingen kort-, gruppe-, indstillings- eller dropdown-tekst på
  engelsk, og ingen af dem indeholder "Anhøj"

### Requirement: Danish Decimal Separator

Tal, der vises for brugeren, SKAL bruge komma som decimalmarkør.

Dette gælder tooltips, oversigtstabellen, akse-etiketter, linje-etiketter og
signalpanelet.

#### Scenario: Decimaltal i tooltip

- **GIVEN** en observation med værdien 3,5
- **WHEN** tooltippet vises
- **THEN** står der `3,5`, ikke `3.5`
