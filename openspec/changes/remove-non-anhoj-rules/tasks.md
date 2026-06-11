# Tasks — remove-non-anhoj-rules (F2)

Rækkefølge jf. design-beslutning 1: ikoner (konsument) før regler (producent);
hvert nummereret afsnit = ét atomisk commit, grønt på tsc + vitest.

## 1. Commit 1 — fjern NHS-ikonsystemet

- [x] 1.1 Slet `src/D3 Plotting Functions/drawIcons.ts`, `initialiseIconSVG.ts`, `NHS Icons/`-mappen; ryd referencer i `src/visual.ts`/`drawSummaryTable.ts`
- [x] 1.2 Slet `src/Outlier Flagging/variationIconsToDraw.ts` + `assuranceIconToDraw.ts`; ryd `index.ts`-exports + viewModel-imports/-kald (`summaryTableRowDataGrouped.variation/assurance` m.m.)
- [x] 1.3 Slet `src/Settings Model/nhsIconsSettings.ts`; fjern `nhs_icons` fra `settings.ts`-modellen + ikon-logik i `settingsClass.ts`; fjern `table_variation_filter`/`table_assurance_filter` fra `summaryTableSettings.ts`
- [x] 1.4 Fjern `nhs_icons`-objekt + ikon-filter-properties fra `capabilities.json` (synkront med 1.3)
- [x] 1.5 Slet `variationIconsToDraw.test.ts` + `assuranceIconToDraw.test.ts`; opdatér berørte initialisation-/formattingModel-tests
- [x] 1.6 Verifikation: `tsc --noEmit` rent + `npm test` grøn → commit

## 2. Commit 2 — fjern shift/trend/twoInThree-reglerne

- [x] 2.1 Slet `src/Outlier Flagging/shift.ts`, `trend.ts`, `twoInThree.ts`; ryd `index.ts`
- [x] 2.2 `viewModelClass.ts`: reducér `outliersObject` til `{ astpoint, per_group_signals }`; fjern regel-grene i `flagOutliers` (inkl. `trend_n`/`shift_n`/two-in-three-reads); forenkl direction-mapping til kun `astpoint`; fjern felter fra `summaryTableRowData` + tabel-kolonnedefinitioner
- [x] 2.3 Ryd referencer i `buildTooltip.ts` + `getAesthetic.ts` (+ evt. conditional-formatting-paths fundet ved grep-sweep: `shift`, `trend`(regel), `two_in_three`, `twointhree`)
- [x] 2.4 Slet `shift.test.ts`, `trend.test.ts`, `twoInThree.test.ts`, `anhojVsShift.test.ts`; opdatér `flagOutliersMultiGroup.test.ts` (stub-settings uden fjernede toggles) + `checkFlagDirection.test.ts` hvis den refererer fjernede regler
- [x] 2.5 Verifikation: `tsc --noEmit` rent + `npm test` grøn → commit

## 3. Commit 3 — settings/capabilities-oprydning + docs

- [x] 3.1 Fjern Shifts/Trends/Two-In-Three-grupper fra `outliersSettings.ts`; verificér General + Astronomical Points + Anhoej Rules består
- [x] 3.2 Fjern tilsvarende properties fra `capabilities.json` (synkront med 3.1)
- [x] 3.3 Opdatér formattingModel-test: outliers-kort indeholder præcis 3 grupper
- [x] 3.4 NEWS-entry (F2, Breaking changes-sektion med migration-hints) + CLAUDE.md-faseplan opdateret (F2-scope: astronomical beholdt, shift fjernet — afvigelse fra oprindelig plan begrundet med qicharts2-parity)
- [x] 3.5 Verifikation: `tsc --noEmit` + `npm test` + `pbiviz package` bygger → commit

## 4. Afsluttende verifikation

- [x] 4.1 Grep-sweep: ingen resterende referencer til `nhs_icons`, `variation`, `assurance`, `shift` (regel), `trend` (regel), `two_in_three`, `twointhree` i `src/` (fraset `calculateTrendLine`/`trend_line` = regressionslinjen)
- [x] 4.2 Manuel panel-sanity via formattingModel-test-output (Power BI-verifikation følger F1-gate på Windows — se add-anhoj-rules 7.2/8.4/10.4)
- [ ] 4.3 **[MANUELT TRIN]** Windows: importér ny `.pbiviz`, verificér 3 settings-grupper + astronomical + Anhøj-dashing virker
