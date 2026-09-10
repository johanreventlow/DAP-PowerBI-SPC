# Proposal: add-anhoj-stats-display

## Why

Klinikere skal kunne aflæse runs-analysens grundlag direkte på dashboardet — ikke kun se den stiplede centerline. qicharts2 eksponerer samme tal via `summary()`/caption: længste serie + forventet maks, antal kryds + forventet minimum, per chart-del. Ønske fra Johan (2026-06-11): persistent element på canvas, ikke hover-baseret.

## What Changes

- Ny statistik-eksponering: `anhojStats()` i `anhojShared.ts` returnerer `{ nUseful, longestRun, longestRunMax, nCrossings, nCrossingsMin, longRunSignal, fewCrossingsSignal }`; reglerne bliver tynde wrappers (uændret kontrakt).
- `per_group_signals` udvides med `stats` per fase/gruppe.
- Ny on-canvas-rendering `drawAnhojStats.ts`: tekstblok per fase, centreret over fasens x-interval, øverst i plotområdet. Format (dansk default, konfigurerbart): "Længste serie: 8 (maks 6)" / "Kryds: 3 (min 5)".
- Nye settings under "Anhoej Rules": toggle (default fra) + font/størrelse/farve + to label-tekster. Capabilities synkront.

Ikke-breaking — ren tilføjelse, default slået fra.

## Capabilities

### New Capabilities

(ingen)

### Modified Capabilities

- `outlier-detection`: per_group_signals eksponerer fuld Anhøj-statistik. Delta: `specs/outlier-detection/spec.md`.
- `chart-rendering`: on-canvas statistik-element per fase. Delta: `specs/chart-rendering/spec.md`.

## Impact

- `src/Outlier Flagging/anhojShared.ts` (+ wrappers i anhojLongRun/anhojFewCrossings)
- `src/Classes/viewModelClass.ts`: per_group_signals-type + flagOutliers
- Ny: `src/D3 Plotting Functions/drawAnhojStats.ts`; `src/visual.ts` call-kæde
- `src/Settings Model/outliersSettings.ts` + `capabilities.json` (synkront)
- Tests: anhojStats mod qicharts2-fixtures, flagOutliers-eksponering, formattingModel
