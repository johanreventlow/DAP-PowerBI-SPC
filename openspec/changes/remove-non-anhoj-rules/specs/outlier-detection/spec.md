# Outlier Detection — Spec Delta

## REMOVED Requirements

### Requirement: Trend Detection (n-consecutive-monotonic)

**Reason:** Ej en del af `qicharts2`'s signal-detektion. qicharts2's vedligeholder (Anhoej) har eksplicit valgt at IKKE implementere trend-reglen pga. dårlige statistiske egenskaber (høj false-positive-rate). F2 fjerner reglen for at matche qicharts2-kontrakten.

**Migration:** Ingen — Anhøj long-run dækker visse trend-lignende patterns. Brugere der ønsker trend-detektion må bruge upstream AUS-DOH-pakken.

### Requirement: Two-In-Three Detection (2 ud af 3 over 2σ)

**Reason:** Western-Electric-regel; ej en del af Anhøj-metoden eller qicharts2's signal-detektion. F2 fjerner reglen.

**Migration:** Ingen.

### Requirement: Shift Detection (fixed-n consecutive same-side)

**Reason:** Western-Electric-regel med fast `n` (typisk 7 eller 8). Anhøj long-run dækker statistisk samme problem med dynamisk threshold `round(log2(n_useful)) + 3`. F2 fjerner shift for at undgå redundans og matche qicharts2's pure runs-baserede tilgang.

**Migration:** Brug `anhoj_long_run` i stedet. Threshold er dynamisk og kontekst-tilpasset.

### Requirement: Improvement Direction Mapping

**Reason:** `checkFlagDirection` mapper "upper"/"lower" til "improvement"/"deterioration"/"neutral_high"/"neutral_low" baseret på `improvement_direction`-setting. Det er NHS Making Data Count-paradigmet — modsætning til Anhøj-filosofien (signal = invitation til undersøgelse, ej dom). Med direction-agnostiske regler tilbage (outside_control_limits + anhoj_long_run) er mapping-systemet dead code.

**Migration:** Coloring sker nu direkte via "above" (neutral_high) / "below" (neutral_low) color-pickers. `process_flag_type`-filter ("vis kun improvements") forsvinder — brugeren kan ej længere filtrere på direction.

## MODIFIED Requirements

### Requirement: Outside Control Limits Detection

Systemet MUST detektere punkter der ligger uden for 3σ-kontrol-grænserne. Dette matcher `qicharts2`'s `sigma.signal`-output: per-punkt boolean — TRUE hvis `y < lcl` eller `y > ucl`, hvor `lcl`/`ucl` er ±3σ fra centerlinen.

**Tidligere navngivning:** Reglen hed `astronomical` (efter Western-Electric / Anhøj-papers' brug af termen).

**Nye krav:**

- Filnavn: `src/Outlier Flagging/outsideControlLimits.ts` (omdøbt fra `astronomical.ts`)
- outliersObject-felt: `outside_control_limits: string[]` (omdøbt fra `astpoint`)
- Settings-key: `outliers.outside_control_limits` (omdøbt fra `outliers.astronomical`)
- Display-tekst: "Outside Control Limits" (omdøbt fra "Astronomical Points")
- Grænser MUST altid være 3σ (`ll99` + `ul99`). Multi-sigma-options (1σ, 2σ) + Specification-limits fjernes som valgmuligheder i `astronomical_limit`-dropdown — dropdown'en fjernes helt.
- Detektion MUST være **direction-agnostisk**: returnerer fortsat `"upper"`/`"lower"`/`"none"` per punkt (side-information bevares), men flag-værdier MUST IKKE mappes gennem `checkFlagDirection`. Coloring sker via pre-map `"upper"` → `"neutral_high"` og `"lower"` → `"neutral_low"` ved render-time (samme pattern som F1's `anhoj_long_run`).

#### Scenario: Punkt over UCL flages "upper"

- **WHEN** `y[i] > ucl[i]` på et givent punkt
- **THEN** `outside_control_limits[i] = "upper"`

#### Scenario: Punkt under LCL flages "lower"

- **WHEN** `y[i] < lcl[i]` på et givent punkt
- **THEN** `outside_control_limits[i] = "lower"`

#### Scenario: Punkt inden for grænser flages "none"

- **WHEN** `lcl[i] <= y[i] <= ucl[i]`
- **THEN** `outside_control_limits[i] = "none"`

#### Scenario: Coloring bypasser direction-mapping

- **WHEN** `outside_control_limits[i]` er `"upper"` eller `"lower"`
- **THEN** punktets farve hentes via `getAesthetic(neutral_flag, "outliers", "outside_control_limits_colour", settings)` hvor `neutral_flag` er pre-mappet fra `"upper"` → `"neutral_high"` og `"lower"` → `"neutral_low"`. `improvement_direction`-setting MUST IKKE påvirke farve-lookup'et.

#### Scenario: Hardcoded 3σ — ingen multi-sigma-config

- **WHEN** brugeren konfigurerer chart-typer der har control-limits
- **THEN** `outsideControlLimits` MUST ALTID kaldes med `ll99`/`ul99`-grænserne — uanset om brugeren tidligere havde valgt 1σ eller 2σ eller Specification.

#### Scenario: Run-chart har ingen outside-control-limits-flags

- **WHEN** `chart_type = "run"` (ingen control limits)
- **THEN** `outside_control_limits` MUST returnere alle `"none"`. `outsideControlLimits` kaldes ikke for run-charts (gating sker via `derivedSettings.chart_type_props.has_control_limits`).
