# Remove Non-Anhøj Rules (Phase 2)

## Why

F2 fjerner alt der ikke er en del af `qicharts2`'s signal-detektion. F1 tilføjede Anhøj-runs-rules (long-run + few-crossings) oven på det eksisterende AUS-DOH-framework. F2 stripper alt det der **ikke** er qicharts2-parity, så pakken er en ren Anhøj-implementation matchende referencen.

qicharts2 emitter to signal-typer (verificeret empirisk 2026-05-19):

```r
sigma.signal:  per-punkt boolean — TRUE hvis y < lcl eller y > ucl
runs.signal:   per-part boolean  — TRUE hvis long-run eller few-crossings
```

PowerBI-SPC's eksisterende `astronomical`-regel matcher `sigma.signal`. F1 implementerede `runs.signal`-komponenterne. F2 fjerner alt der ligger uden for de to: legacy-regler (`trend`, `two_in_three`, `shift`), NHS Making Data Count-ikoner, robust-I-chart-varianter (`i_m`, `i_mm`), og det tilknyttede direction-mapping-system.

BFH-konteksten har INGEN eksisterende produktionsrapporter med denne pakke (bekræftet 2026-05-19). Breaking changes er acceptable.

## What Changes

### Filer fjernet

```
src/Outlier Flagging/
  trend.ts                       (ej i qicharts2)
  twoInThree.ts                  (ej i qicharts2)
  shift.ts                       (Anhøj long-run dækker statistisk samme problem)
  checkFlagDirection.ts          (ingen kaldere efter cleanup)
  assuranceIconToDraw.ts         (NHS-specifik)
  variationIconsToDraw.ts        (NHS-specifik)

src/D3 Plotting Functions/
  NHS Icons/                     (11 ikon-filer + index.ts)
  drawIcons.ts                   (kun NHS-callers)
  initialiseIconSVG.ts           (NHS-only init)

src/Limit Calculations/
  i_m.ts                         (PowerBI-SPC innovation, ej i qicharts2)
  i_mm.ts                        (PowerBI-SPC innovation, ej i qicharts2)
```

### Filer omdøbt + adfærdsændret

```
src/Outlier Flagging/
  astronomical.ts → outsideControlLimits.ts
    + direction-agnostisk (pre-map "upper"/"lower" → neutral_high/neutral_low,
      samme bypass-pattern som anhojLongRun i F1)
    + hardcoded 3σ-grænser (dropdown med "1 Sigma"/"2 Sigma"/"Specification"
      fjernet — Anhøj bruger kun 3σ)
```

### Settings simplificeret

```
src/settings.ts:
  REMOVE outliers.process_flag_type
  REMOVE outliers.improvement_direction
  REMOVE outliers.{astronomical_limit, two_in_three_*, trend_*, shift_*}
  REMOVE outliers.{trend, two_in_three, shift} toggles
  REMOVE entire "nhs_icons" section
  REMOVE lines.show_95, lines.show_68 (warning-limits — Anhøj bruger kun 3σ)
  RENAME outliers "Astronomical Points" → "Outside Control Limits"
  ADD per-color-suffix for neutral-only Anhøj-style coloring
```

### Chart-typer reduceret

```
chart_type dropdown: 14 typer → 12 typer
  REMOVE: "i_m" (median CL + mean MR)
  REMOVE: "i_mm" (median CL + MMR — user-decision F1-cycle)
  KEEP:   run, i, mr, p, pp, u, up, c, xbar, s, g, t  (alle i qicharts2)
```

### viewModelClass.ts cleanup

```
flagOutliers:
  REMOVE: imports for trend, twoInThree, shift, checkFlagDirection
  REMOVE: process_flag_type/improvement_direction settings reads
  REMOVE: trend/two_in_three/shift loop-grene
  REMOVE: post-loop checkFlagDirection mapping-Object.keys-forEach
  MODIFY: astronomical-call: ny direction-agnostisk farvelægning
          (pre-map upper/lower → neutral_high/neutral_low samme pattern som F1's anhoj_long_run)
  SIMPLIFY: 3σ hardcoded — fjern limit_map + ast_specification-grene

drawIcons-import + initialiseIconSVG-import: REMOVE
variationIconsToDraw/assuranceIconToDraw-calls: REMOVE
```

### outliersObject simplificeret

```typescript
// Før (efter F1):
outliersObject = {
  astpoint: string[];
  trend: string[];
  two_in_three: string[];
  shift: string[];
  anhoj_long_run: string[];
  global_signals: { long_run, few_crossings };
  per_group_signals?: ...;
}

// Efter F2:
outliersObject = {
  outside_control_limits: string[];   // renamed fra astpoint
  anhoj_long_run: string[];
  global_signals: { long_run, few_crossings };
  per_group_signals?: ...;
}
```

### Ud af scope (planlagt til F3)

```
F3 = rebrand:
  pbiviz.json: visual.guid, visual.name, visual.displayName, supportUrl
  README + attribution-credit til AUS-DOH/qicharts2
  Visual icon
  Distribution-channel-beslutning
```

## Impact

### Affected capabilities

- `outlier-detection` — 3 regler fjernet (REMOVED), 1 modificeret + omdøbt (RENAMED + MODIFIED)
- `chart-rendering` — NHS Icons-rendering fjernet (REMOVED)
- `centerline-calculation` — 2 chart-typer fjernet (REMOVED)

### Affected code

```
Slettet:    13 filer (~1500 linjer)
Modificeret:
  src/Classes/viewModelClass.ts         (flagOutliers + types + coloring +
                                          grouped summary table icon-pipeline)
  src/Classes/settingsClass.ts          (active validation block linje 96-102
                                          + commented block linje 104-113)
  src/settings.ts                        (5 settingsgroups + 2 fields + chart_type)
  src/Functions/buildTooltip.ts          (pattern-block linje 27-127 — outdated
                                          rule-text + table_row-fields)
  src/Outlier Flagging/index.ts          (barrel cleanup)
  src/Limit Calculations/index.ts        (barrel cleanup)
  capabilities.json                      (full schema-cleanup: process_flag_type,
                                          improvement_direction, astronomical,
                                          shift, trend, two_in_three, nhs_icons,
                                          show_95, show_68 + tilhørende ttip-keys)
  src/visual.ts                          (drawIcons-import + call ved linje 12, 116)
  src/D3 Plotting Functions/drawSummaryTable.ts  (NHS-icon-imports linje 3-4 +
                                          calls linje 149-152)
Tests:       Fjern test-astronomical.ts, test-shift.ts, test-trend.ts,
              test-twoInThree.ts, test-checkFlagDirection.ts,
              test-variationIconsToDraw.ts, test-assuranceIconToDraw.ts,
              test-anhojVsShift.ts (F1-tilføjet, shift væk)
             Tilføj test-outsideControlLimits.ts (ny direction-agnostisk impl)
```

### Backwards compatibility

**Eksplicit breaking change.** Bekræftet 2026-05-19: BFH har INGEN produktionsrapporter med denne pakke. Konsekvenser:

```
Eksisterende rapporter (hvis nogen eksisterer udenfor BFH-scope):
  - chart_type = "i_m" eller "i_mm"           → unknown chart_type ved load
  - improvement_direction-setting gemt         → ignoreres (dead key)
  - astronomical_limit = "1 Sigma" gemt        → ignoreres (kun 3σ tilbage)
  - trend/two_in_three/shift-toggles aktive    → ignoreres
  - NHS-icon-toggles aktive                    → ignoreres
```

Migration-path: ingen — F2 er fresh-start-compatible. Power BI's håndtering af unknown chart_type vil sandsynligvis crashe visualet eller falde tilbage til default. Acceptabelt da pakken er pre-prod for BFH.
