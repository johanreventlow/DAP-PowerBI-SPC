# Outlier Detection — Spec Delta

> **Revision 2026-06-11:** Per-punkt-flagging (oprindeligt "Lag 2") fjernet
> efter empirisk qicharts2-review og beslutning fra Johan. Anhøj-metoden
> flagger ikke enkeltpunkter — runs-analysen giver ét seriesignal per
> data-gruppe, rendret som stiplet centerline. Begge regler er nu rene
> seriesignaler med identisk kontrakt.

## ADDED Requirements

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

Signalerne MUST beregnes per gruppe — ej chart-wide aggregeret — og må ej være afhængige af `improvement_direction` eller `process_flag_type` settings (Anhøj-signaler er retningsneutrale).

#### Scenario: Begge signaler kan være sande samtidigt

- **WHEN** gruppen har både long-run og few-crossings (typisk korreleret)
- **THEN** begge felter er `true`

#### Scenario: Signaler bypasser direction-mapping

- **WHEN** `improvement_direction` er `"increase"` eller `"decrease"`
- **THEN** signal-feltværdier ændres ikke
