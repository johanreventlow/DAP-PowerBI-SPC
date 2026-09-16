# Proposal: add-i-prime-chart

## Why

I-kortet antager, at alle observationer har samme usikkerhed. Når hver
observation er et gennemsnit eller en ratio over et varierende antal enheder
(patienter, dage, prøver), er det forkert: en periode med få enheder varierer
mere end en periode med mange. `p'` og `u'` løser det for andele og rater,
men der findes ingen tilsvarende type for kontinuerte målinger og aggregerede
gennemsnit. Anhøj/Taylors normaliserede individkort (I′) er den generelle
løsning og findes i `qicharts2` ≥ 0.8 som `chart = "ip"`.

## What Changes

- Ny diagramtype `ip` — "i' - Normaliseret individkort (varierende nævner)" —
  i diagramtypevælgeren. Nævner er valgfri; uden nævner er `d_i = 1`, og kortet
  reduceres til et I-kort (med den eksakte konstant `√(π/2)` i stedet for
  `1.128`).
- Vægtet centerlinje `Σn/Σd`, punktvise kontrolgrænser `CL ± 3·s̄/√d_i`, hvor
  `s̄` er gennemsnittet af de `o−1` normaliserede successive differencer
  `s_i = √(π/2)·|y_i − y_{i−1}| / √(1/d_i + 1/d_{i−1})`.
- `outliers_in_limits` genbruges: `false` screener `s_i ≥ 3.2665·s̄_raw` bort,
  før `s̄` genberegnes (som `qicharts2`).
- Ingen automatisk afskæring ved 0 eller 1 — I′ er et generelt kort.
  Brugerens `ll_truncate`/`ul_truncate` virker som før.
- Ny validering kun for `ip`: en leveret nævner skal være endelig og > 0.
- Reference-fixtures fra `qicharts2` 0.8.1 med tilhørende R-generator.
- README og NEWS beskriver kortet, antagelsen `Var(y_i) ≈ σ²/d_i` og hvordan
  aggregerede gennemsnit indlæses (tæller = gennemsnit × n, nævner = n).

Ikke-breaking: eksisterende typer (`i`, `p'`, `u'` m.fl.) er urørte. Ingen
ændring af `capabilities.json` — `chart_type`-enumerationen fyldes fra
settings-modellen. Intet versionsbump.

## Capabilities

### New Capabilities

- `limit-calculation`: kontrolgrænseberegning for diagramtyper. Første
  requirement dækker I′; øvrige typers regler er endnu ikke spec'et og
  tilføjes ved behov.

### Modified Capabilities

(ingen — rendering og runs-analyse genbruges uændret)

## Impact

- Ny `src/Limit Calculations/ip.ts` + eksport i `index.ts`
- `src/Settings Model/spcSettings.ts`: `ip` i `valid` + dansk label
- `src/Classes/derivedSettingsClass.ts`: chart-egenskaber og `value_name`
- `src/Functions/validateInputData.ts`: `denominator_positive`-regel
- Tests: `test/Chart Types/ip.test.ts`, fixtures + R-generator, tilføjelser
  i `denominators`, `hiddenChartTypes` og `chartTypeRoundTrip`
- README, NEWS
