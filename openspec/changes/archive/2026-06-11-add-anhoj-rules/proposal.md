# Add Anhøj Rules (Phase 1)

## Why

BFH's analytikerservice bruger den oprindelige PowerBI-SPC visual fra AUS-DOH. Den implementerer NHS Making Data Count-tilgangen (3-sigma-baserede regler + improvement/deterioration-aestetik). BFH har brug for samme distribution + UI, men med **Anhøj-reglerne** som signal-detektion: median centerline, "unusually long run", "unusually few crossings". Reference-implementation: `qicharts2` (R).

Denne change er **Phase 1 (additivt)** i en tre-fasers plan beskrevet i `docs/spc-anhoj-context.md`:

- **F1 (denne change):** tilføj Anhøj-regler parallelt med eksisterende regler. Ingen breaking changes. Sammenligningstest validerer korrekthed.
- **F2 (senere change):** fjern ikke-Anhøj-regler (`astronomical`, `trend`, `twoInThree`), NHS-ikoner, improvement/deterioration-coloring.
- **F3 (senere change):** rebrand + dokumentation.

Den additive rækkefølge bevarer fungerende pakke gennem hele forløbet og gør det muligt at sammenligne Anhøj-output mod eksisterende regler på samme data.

## What Changes

### Nye filer

- `src/Functions/qbinom.ts` — kvantilfunktion for binomialfordeling (egen impl via cumulativ CDF + `lgamma`)
- `src/Outlier Flagging/anhojLongRun.ts` — punkt-flag-baseret long-run-regel
- `src/Outlier Flagging/anhojFewCrossings.ts` — global-signal-baseret few-crossings-regel
- `test/Outlier Flagging/anhoj-fixtures.json` — flyttes fra `docs/` (reference-output fra `qicharts2`)
- `test/Outlier Flagging/anhojLongRun.test.ts`
- `test/Outlier Flagging/anhojFewCrossings.test.ts`
- `test/Functions/qbinom.test.ts`

### Modificerede filer

- `src/Classes/viewModelClass.ts`
  - `outliersObject`-type får nyt felt `global_signals: { long_run: boolean, few_crossings: boolean }` (snake_case konsistent med eksisterende felter)
  - `flagOutliers` kalder Anhøj-regler gated bag nye settings
  - Anhøj-flags bypasser `checkFlagDirection`; flag-værdier (`"upper"`/`"lower"`) pre-mappes til `"neutral_high"`/`"neutral_low"` ved coloring-lookup (genbruger eksisterende `createOutlierColours`-keys)
- `src/settings.ts` — ny outlier-settingsgroup "Anhøj Rules" med to ToggleSwitches + farver
- `src/D3 Plotting Functions/drawLines.ts` linje 59 — `stroke-dasharray` overrider bruger-aesthetic for `targets`-linje hvis aktuelt segments gruppe har global signal
- `src/Classes/viewModelClass.ts` `initialiseGroupedLines` (linje 745-782) — `lineData` udvides med `group_signal_dashed?: boolean` så drawLines kan se per-segment-signal-state

### Ud af scope (separate changes)

- Fjernelse af eksisterende regler (`astronomical`, `trend`, `twoInThree`) → F2
- Fjernelse af NHS-ikoner → F2
- Fjernelse af `improvement_direction`/`process_flag_type` settings → F2
- Rebrand (`pbiviz.json` navn, ikon, README) → F3

## Impact

### Affected capabilities

- `outlier-detection` — to nye regler, ny global-signal-kanal
- `chart-rendering` — stiplet centerline ved global signal

Chart-typer + centerline-beregning er UÆNDREDE i F1. Anhøj-reglerne anvendes oven på den eksisterende centerline (mean for `i`, vægtet mean for `p`/`u`, median for `run`, etc.) — Anhøj's algorithm tæller kun "over/under centerline" og er centerline-agnostisk.

### Affected code

- `src/Classes/viewModelClass.ts` (signatur-udvidelse af `outliersObject`)
- `src/Outlier Flagging/` (2 nye filer)
- `src/Functions/` (1 ny fil)
- `src/settings.ts` (ny settings-blok)
- `src/D3 Plotting Functions/D3 Modules/` (centerline-rendering)

### Backwards compatibility

Strikt additiv: alle eksisterende regler, UI, chart-typer + centerline-beregninger fungerer uændret. Eksisterende Power BI-rapporter kan åbnes uden datatab. Brugere skal eksplicit aktivere Anhøj-regler via nye toggles for at se ny adfærd. Ingen runtime-adfærdsændring uden bruger-action.
