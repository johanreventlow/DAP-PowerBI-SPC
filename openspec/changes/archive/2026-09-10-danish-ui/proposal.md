# Proposal: danish-ui

## Why

Målgruppen er danske klinikere; de engelske begreber i formatting-panel, felt-brønde, tooltips, tabel og fejlbeskeder er en reel barriere (Johan, 2026-06-11). Terminologien skal følge dansk SPC-praksis som i Anhøjs litteratur/qicharts2: serie, kryds, kontrolgrænser, centerlinje, faser.

## What Changes

- Alle bruger-vendte strenge oversættes til dansk: settings-kort/grupper/options (inkl. dropdown-display-labels), dataRoles (felt-brønde), tooltip-defaults, summary-table-kolonner, canvas-fejlbeskeder, chart-type-beskrivelser.
- Interne værdier røres IKKE: property-navne, dropdown-values (kode-sammenlignede, fx "Automatic", "Start"), chart-type-koder, gemte settings. Ikke-breaking — eksisterende rapporter beholder værdier.
- Terminologi-nøgle: run → serie, crossings → kryds, control limits → kontrolgrænser, centerline → centerlinje, astronomical point → punkt uden for kontrolgrænser, rebaseline → fase, target (alt) → mål.

## Capabilities

### New Capabilities

(ingen)

### Modified Capabilities

- `chart-rendering`: bruger-vendt tekst på dansk. Delta: `specs/chart-rendering/spec.md`.

## Impact

- `src/Settings Model/*.ts` (alle 12), `capabilities.json` (dataRoles), `viewModelClass.ts` (tabel-labels), `buildTooltip.ts`, `validateInputData.ts`/`extractInputData.ts`/`validateDataViewColumns.ts` (beskeder), `derivedSettingsClass.ts` (dynamiske navne)
- Tests der asserter engelske labels opdateres
