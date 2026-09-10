# outlier-detection Specification

## Purpose
TBD - created by archiving change add-anhoj-rules. Update Purpose after archive.
## Requirements
### Requirement: Anhøj Long Run Detection

Systemet MUST detektere "unusually long run" iht. Anhøj-metoden når brugeren har aktiveret `anhoj_long_run`-setting. Detektion sker per data-gruppe og returnerer ét boolsk seriesignal (qicharts2-parity — ingen punkt-flags).

Algoritmen er:

1. Beregn `n_useful` = antal observationer der IKKE ligger præcis på centerline (non-finite værdier ekskluderes, paritet med R's NA-håndtering)
2. Beregn `longest_run_max = round(log2(n_useful)) + 3`
3. Find længste sammenhængende sekvens af observationer på samme side af centerline
4. Hvis længste run > `longest_run_max`: signal udløses (`per_group_signals[g].long_run = true`)

#### Scenario: Run af præcis tærskel-længde udløser ej signal

- **WHEN** `n_useful = 20` og længste run = 7 (tærskel = 7)
- **THEN** signalet er `false` (operator er strikt `>`, ej `≥`)

#### Scenario: Run over tærskel-længde udløser seriesignal

- **WHEN** `n_useful = 20` og længste run = 8 (tærskel = 7)
- **THEN** signalet er `true`

#### Scenario: Observationer på centerline ignoreres

- **WHEN** serie indeholder observationer der ligger præcis på centerline
- **THEN** disse observationer tæller ikke som del af noget run og indgår ikke i `n_useful`

#### Scenario: Degenereret serie udløser ej signal

- **WHEN** `n_useful < 2`
- **THEN** signalet er `false`

### Requirement: Anhøj Few Crossings Detection

Systemet MUST detektere "unusually few crossings" iht. Anhøj-metoden når brugeren har aktiveret `anhoj_few_crossings`-setting. Few crossings er en seriesignal-egenskab per data-gruppe — samme kontrakt som long-run.

Algoritmen er:

1. Beregn `n_useful` = antal observationer der IKKE ligger på centerline
2. Beregn `n_crossings_min = qbinom(0.05, n_useful - 1, 0.5)`
3. Tæl antal transitions hvor serien skifter side af centerline
4. Hvis `n_crossings < n_crossings_min`: signal udløses (`per_group_signals[g].few_crossings = true`)

#### Scenario: Crossings præcis ved tærskel udløser ej signal

- **WHEN** `n_useful = 20` og crossings = 6 (tærskel = 6)
- **THEN** signalet er `false` (operator er strikt `<`, ej `≤`)

#### Scenario: Crossings under tærskel udløser seriesignal

- **WHEN** `n_useful = 20` og crossings = 5 (tærskel = 6)
- **THEN** signalet er `true`

#### Scenario: Degenereret serie udløser ej signal

- **WHEN** `n_useful < 2`
- **THEN** signalet er `false`

### Requirement: Per-Group Signal Channel

Systemets `outliersObject` MUST eksponere et `per_group_signals`-felt med ét element per data-gruppe (split-chart, rebaseline):

```typescript
per_group_signals: {
  long_run: boolean;         // TRUE hvis long-run-signal udløst på denne gruppe
  few_crossings: boolean;    // TRUE hvis few-crossings-signal udløst på denne gruppe
}[]
```

Signalerne MUST beregnes per gruppe — ej chart-wide aggregeret. Anhøj-signaler er retningsneutrale.

#### Scenario: Begge signaler kan være sande samtidigt

- **WHEN** gruppen har både long-run og few-crossings (typisk korreleret)
- **THEN** begge felter er `true`

#### Scenario: Signalerne er retningsneutrale

- **WHEN** en gruppes signal beregnes
- **THEN** afhænger værdien alene af serien og centerlinjen. Visualen har
  intet retningsbegreb — `improvement_direction` og `process_flag_type`
  findes ikke

### Requirement: Outlier-regelsæt (qicharts2-parity)

Systemets samlede regelsæt SHALL bestå af præcis: (1) astronomical-punktflagging (qicharts2 `sigma.signal`-ækvivalent) og (2) Anhøj-seriesignalerne long-run + few-crossings (qicharts2 `runs.signal`-ækvivalent). `outliersObject` SHALL bestå af `{ astpoint: string[], per_group_signals: { long_run, few_crossings }[] }`. Fast-n shift, trend (WE) og two-in-three (WE) SHALL ikke tilbydes.

Astronomical-flagging SHALL altid evalueres mod 3σ-grænserne (ll99/ul99) — ingen konfigurerbar limit. Flag-værdier er "upper"/"lower"/"none" internt, men farvning SHALL ske med ÉN konfigurerbar farve (`ast_colour`) uafhængigt af retning. Retningssemantik (`process_flag_type`, `improvement_direction`, direction-mapping) SHALL ikke findes.

#### Scenario: Kun qicharts2-regler eksponeres

- **WHEN** formateringsrudens Signaler-kort inspiceres
- **THEN** indeholder det grupperne "Punkter uden for kontrolgrænser" og
  "Signaldetektion" — ingen generel-, shift-, trend- eller
  two-in-three-gruppe

#### Scenario: Astronomical altid 3σ

- **WHEN** et punkt ligger udenfor ll99/ul99
- **THEN** flagges det — uden at brugeren kan vælge anden grænse (1σ/2σ/Specification findes ikke)

#### Scenario: Én farve uanset retning

- **WHEN** to punkter flagges, ét over UCL og ét under LCL
- **THEN** farves begge med samme `ast_colour`

#### Scenario: Fjernede regler beregnes ikke

- **WHEN** `flagOutliers` kører på en serie der ville have udløst fast-n shift (7 punkter samme side), trend eller two-in-three
- **THEN** produceres ingen flags for disse mønstre; kun astronomical + Anhøj-signaler beregnes

### Requirement: Beyond-Control-Limit Flagging

Visualen SKAL markere observationer, der ligger uden for 3σ-kontrolgrænserne,
når `astronomical` er slået til.

En observation ligger uden for grænserne, når `value > ul99` eller
`value < ll99`. Grænser, der ikke er reelle tal, tæller ikke som brud — en
manglende grænse er fravær af en grænse, ikke en overtrådt grænse.

Markeringen SKAL være den samme uanset om observationen ligger over eller
under, og SKAL bruge farven i `ast_colour`.

Visualen MÅ IKKE udlede, om afvigelsen er ønsket eller uønsket. Om et signal
er godt eller skidt afhænger af indikatoren og den kliniske kontekst — det er
en vurdering, klinikeren foretager, ikke en indstilling i værktøjet.

#### Scenario: Observation over øvre kontrolgrænse

- **GIVEN** et diagram med kontrolgrænser og `astronomical` slået til
- **WHEN** en observation ligger over `ul99`
- **THEN** markeres observationen med `ast_colour`

#### Scenario: Observation under nedre kontrolgrænse

- **GIVEN** samme opsætning
- **WHEN** en observation ligger under `ll99`
- **THEN** markeres observationen med `ast_colour` — samme farve som ved brud
  opad

#### Scenario: Grænserne er ikke reelle tal

- **GIVEN** en konstant serie på et i-chart, hvor grænseberegningen giver NaN
- **WHEN** flagging køres
- **THEN** markeres ingen observationer
