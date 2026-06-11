# Proposal: align-limits-qicharts2

## Why

F2 fjernede ikke-qicharts2-*regler*; settings-audit (2026-06-11, verificeret mod `formals(qic)` + docs i qicharts2 0.8.1) viste at også *linje- og farve-fladen* tilbyder muligheder uden qicharts2-modstykke. De forvirrer danske klinikere og strider mod forkens kerneprincip: qicharts2's adfærd ER spec'en.

## What Changes

- **BREAKING** Fjern 68%-grænser (1σ) helt: settings-gruppe, limit-beregninger (ll68/ul68), rendering, tooltips, tabel-kolonner. qicharts2 har intet 1σ-koncept.
- **BREAKING** 95%-grænser (2σ) ændres til opt-in med default FRA (`show_95: false`) — matcher qicharts2's `show.95 = FALSE`. Beregning + rendering beholdes.
- **BREAKING** `astronomical_limit`-dropdown fjernes — flagging sker altid mod 3σ (ll99/ul99), som qicharts2's `sigma.signal`.
- **BREAKING** Retningsfarver fjernes: `process_flag_type`, `improvement_direction`, `checkFlagDirection` og de 4 retningsbaserede colour-pickers udgår. Astronomical-punkter får ÉN konfigurerbar farve (`ast_colour`), ens for over/under (beslutning: Johan, 2026-06-11).
- **BREAKING** "Specification Limits"-gruppen fjernes inkl. speclimits-plumbing. Findes ikke i qicharts2.
- **BREAKING** Trend-linjen (regression) fjernes: `calculateTrendLine`, `trend_line`-felt, "Trend"-linjegruppe, tooltip. Findes ikke i qicharts2.
- **Behold:** centerline/target, 99%-grænser (= UCL/LCL 3σ), multiplier, freeze/subset, part/split, chart-typerne.

Pre-1.0-fork; gemte settings for fjernede properties ignoreres af Power BI — ingen migration.

## Capabilities

### New Capabilities

(ingen)

### Modified Capabilities

- `outlier-detection`: astronomical altid 3σ, én farve, ingen direction-mapping. Delta: `specs/outlier-detection/spec.md`.
- `chart-rendering`: linje-fladen reduceret til qicharts2-paritet (CL + 3σ default; 95% opt-in; intet 68%/spec/trend). Delta: `specs/chart-rendering/spec.md`.

## Impact

- `src/Settings Model/linesSettings.ts`: grupper "68% Limits", "Specification Limits", "Trend" ud; `show_95` default → false
- `src/Settings Model/outliersSettings.ts`: "General"-gruppen (process_flag_type + improvement_direction) ud; astronomical_limit ud; 4 colour-pickers → 1 `ast_colour`
- `capabilities.json`: alle tilsvarende properties synkront
- `src/Limit Calculations/*.ts` (14 filer): ll68/ul68 ud
- `src/Classes/viewModelClass.ts`: limit-loops, tabel-kolonner, truncate/scale-lister, flagOutliers-forenkling
- `src/Classes/plotPropertiesClass.ts`, `drawLineLabels.ts`, `getAesthetic.ts`, `buildTooltip.ts`, `extractInputData.ts`: 68/spec/trend/direction-referencer
- Slettes: `checkFlagDirection.ts`, `calculateTrendLine.ts` + deres tests
- Tests: flagOutliersMultiGroup-stub, formattingModel-asserts opdateres
