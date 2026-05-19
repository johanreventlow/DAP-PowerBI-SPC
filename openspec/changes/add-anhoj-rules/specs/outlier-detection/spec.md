# Outlier Detection — Spec Delta

## ADDED Requirements

### Requirement: Anhøj Long Run Detection

Systemet MUST detektere "unusually long run" iht. Anhøj-metoden når brugeren har aktiveret `anhoj_long_run`-setting. Detektion sker per data-gruppe.

**Contract-lag:**
- Lag 1 (qicharts2-parity): global signal-udløsning baseret på `longest_run > longest_run_max`
- Lag 2 (PowerBI-SPC-specifik): hvilke specifikke punkter flagges med `"upper"`/`"lower"`

Algoritmen (Lag 1 — qicharts2-parity):

1. Beregn `n_useful` = antal observationer der IKKE ligger præcis på centerline
2. Beregn `longest_run_max = round(log2(n_useful)) + 3`
3. Find længste sammenhængende sekvens af observationer på samme side af centerline
4. Hvis længste run > `longest_run_max`: global signal udløses (`global_signals.long_run = true`)

Flagging (Lag 2 — egen contract; qicharts2 leverer ej point-level data):

5. Når global signal udløses: alle observationer i ALLE runs af længde `longest_run` (max-length-runs) flagges. Hvis flere runs har samme max-length, flagges punkter i dem alle. Hvert flagget punkt får sin side-værdi (`"upper"` hvis over centerline, `"lower"` hvis under). Observationer der ligger præcis på centerline springes over (de er ej del af noget run).
6. Når global signal IKKE udløses: alle punkter flagges `"none"`.

#### Scenario: Run af præcis tærskel-længde udløser ej signal

- **WHEN** `n_useful = 20` og længste run = 7 (tærskel = 7)
- **THEN** ingen punkt-flag udløses (operator er strikt `>`, ej `≥`)

#### Scenario: Run over tærskel-længde udløser signal på de specifikke punkter

- **WHEN** `n_useful = 20` og længste run = 8 over centerline (tærskel = 7)
- **THEN** præcis de 8 punkter i runet flagges med `"upper"`; øvrige punkter flagges `"none"`

#### Scenario: Observationer på centerline ignoreres

- **WHEN** serie indeholder observationer der ligger præcis på centerline
- **THEN** disse observationer tæller ikke som del af noget run og indgår ikke i `n_useful`

#### Scenario: Degenereret serie returnerer ingen flags

- **WHEN** `n_useful < 2`
- **THEN** alle punkter flagges `"none"` og ingen signal udløses

### Requirement: Anhøj Few Crossings Detection

Systemet MUST detektere "unusually few crossings" iht. Anhøj-metoden når brugeren har aktiveret `anhoj_few_crossings`-setting. Few crossings er en **global** egenskab ved serien — ikke en punkt-egenskab — og rapporteres via en separat signal-kanal.

Algoritmen er:

1. Beregn `n_useful` = antal observationer der IKKE ligger på centerline
2. Beregn `n_crossings_min = qbinom(0.05, n_useful - 1, 0.5)`
3. Tæl antal transitions hvor serien skifter side af centerline
4. Hvis `n_crossings < n_crossings_min`: global signal udløses

#### Scenario: Crossings præcis ved tærskel udløser ej signal

- **WHEN** `n_useful = 20` og crossings = 6 (tærskel = 6)
- **THEN** `global_signals.fewCrossings` er `false` (operator er strikt `<`, ej `≤`)

#### Scenario: Crossings under tærskel udløser global signal

- **WHEN** `n_useful = 20` og crossings = 5 (tærskel = 6)
- **THEN** `global_signals.fewCrossings` er `true`

#### Scenario: Degenereret serie returnerer falsk

- **WHEN** `n_useful < 2`
- **THEN** `global_signals.fewCrossings` er `false`

### Requirement: Global Signal Channel (per group)

Systemets `outliersObject` MUST eksponere et `global_signals`-felt der indeholder boolske flag for serie-niveau-signaler. Felter er:

```typescript
global_signals: {
  long_run: boolean;         // TRUE hvis long-run-signal udløst på denne gruppe
  few_crossings: boolean;    // TRUE hvis few-crossings-signal udløst på denne gruppe
}
```

`outliers` er allerede `outliersObject[]` med én entry per data-gruppe (split-chart, rebaseline). `global_signals` MUST beregnes per gruppe — ej chart-wide aggregeret. `global_signals` opdateres af `flagOutliers` parallelt med eksisterende punkt-flags og må ej være afhængigt af `improvement_direction` eller `process_flag_type` settings.

#### Scenario: Begge globale signaler kan være sande samtidigt

- **WHEN** serien har både long-run og few-crossings (typisk korreleret)
- **THEN** begge felter er `true`

#### Scenario: Globale signaler bypasser direction-mapping

- **WHEN** `improvement_direction` er `"increase"` eller `"decrease"`
- **THEN** `global_signals`-feltværdier ændres ikke (de er retningsneutrale)

### Requirement: Anhøj Flags Bypass Direction Mapping

Punkt-flags fra `anhoj_long_run` MUST ikke mappes gennem `checkFlagDirection`. De forbliver i deres oprindelige `"upper"`/`"lower"`/`"none"`-form og farves via separat `anhoj_long_run_colour`-setting uafhængigt af `improvement_direction`.

#### Scenario: Anhøj-flags bevarer side-information uanset direction-setting

- **WHEN** et long-run-signal flagger punkter som `"upper"` og `improvement_direction = "decrease"`
- **THEN** flag-værdierne forbliver `"upper"` (ej omdøbt til `"deterioration"`)
