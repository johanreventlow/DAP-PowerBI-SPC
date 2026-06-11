# Proposal: remove-non-anhoj-rules (F2)

## Why

Forkens formål er en SPC-visual der følger dansk analysepraksis som defineret af qicharts2 (Anhøj). Upstream (AUS-DOH) medbringer engelske/NHS-specifikke regler og ikoner — fast-n shift, trend (WE-regel), two-in-three (WE-regel) og NHS variation/assurance-ikoner — som ikke findes i qicharts2 og forvirrer danske klinikere. F1 tilføjede Anhøj-reglerne; F2 fjerner det ikke-danske, så visualen kun tilbyder qicharts2-semantik.

## What Changes

- **BREAKING** Fjern `shift`-reglen (fast-n, default 7): Anhøj long-run med dynamisk tærskel `round(log2(n_useful)) + 3` ER den danske shift-detektion. qicharts2 har ingen fast-n-regel (verificeret empirisk 2026-06-11).
- **BREAKING** Fjern `trend`-reglen (n stigende/faldende punkter): Walker-Evans-regel, findes ikke i qicharts2.
- **BREAKING** Fjern `twoInThree`-reglen (2 af 3 udenfor warning-limits): WE-regel, findes ikke i qicharts2.
- **BREAKING** Fjern NHS variation/assurance-ikoner inkl. settings-kort, SVG-assets, summary-table-ikon-kolonner og -filtre.
- **Behold** `astronomical` (punkter udenfor kontrolgrænser): matcher qicharts2's `sigma.signal` i control charts (verificeret empirisk 2026-06-11 — qic i-chart flagger outliers).
- **Behold** Anhøj-reglerne (long-run + few-crossings → stiplet centerline), `calculateTrendLine` (regressionslinje, ikke regel), `checkFlagDirection` (bruges af astronomical).
- Settings/capabilities ryddes synkront (begge surfaces — jf. kendt tavs-fejl-faldgrube).

Breaking er acceptabelt: pre-1.0-fork, bevidst divergens fra upstream er selve formålet med F2. Eksisterende .pbix-rapporter der bruger fjernede toggles falder tilbage til defaults (ingen flagging) — ingen datatab.

## Capabilities

### New Capabilities

(ingen)

### Modified Capabilities

- `outlier-detection`: shift/trend/twoInThree-requirements fjernes; astronomical + Anhøj-regler består. Delta-spec: `specs/outlier-detection/spec.md`.
- `chart-rendering`: NHS-ikon-rendering (variation/assurance) fjernes inkl. summary-table-ikon-kolonner. Delta-spec: `specs/chart-rendering/spec.md`.

## Impact

- `src/Outlier Flagging/`: slet `shift.ts`, `trend.ts`, `twoInThree.ts`, `variationIconsToDraw.ts`, `assuranceIconToDraw.ts` (+ `index.ts`-exports)
- `src/Classes/viewModelClass.ts`: `outliersObject` (felter `shift`/`trend`/`two_in_three`), `flagOutliers`-grene, `summaryTableRowData`, ikon-relateret logik
- `src/Settings Model/`: slet `nhsIconsSettings.ts`; fjern Shifts/Trends/Two-In-Three-grupper fra `outliersSettings.ts`; ikon-filtre fra `summaryTableSettings.ts`
- `src/settings.ts` + `src/Classes/settingsClass.ts`: nhs_icons-kort + ikon-logik
- `capabilities.json`: shift/trend/two_in_three/nhs_icons-properties (synkront med settings)
- `src/D3 Plotting Functions/`: slet `drawIcons.ts`, `initialiseIconSVG.ts`, `NHS Icons/`-mappen; ryd referencer i `drawSummaryTable.ts`
- `src/Functions/`: ryd referencer i `buildTooltip.ts`, `getAesthetic.ts`, `extractInputData.ts`
- Tests: slet `shift.test.ts`, `trend.test.ts`, `twoInThree.test.ts`, `variationIconsToDraw.test.ts`, `assuranceIconToDraw.test.ts`, `anhojVsShift.test.ts` (kontrast-test mod fjernet regel); opdatér `flagOutliersMultiGroup.test.ts` + formattingModel-/initialisation-tests
- Upstream-merge bliver sværere fremover — accepteret konsekvens af F2 (dokumenteret i CLAUDE.md-faseplan)
