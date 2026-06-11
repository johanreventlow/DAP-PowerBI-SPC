# Tasks — align-limits-qicharts2

Hvert nummereret afsnit = ét atomisk commit, grønt på tsc + vitest.
Settings + capabilities ændres ALTID synkront i samme commit.

## 1. Commit 1 — fjern 68%-grænser (1σ)

- [x] 1.1 `linesSettings.ts`: slet "68% Limits"-gruppen; `capabilities.json`: slet alle `*_68`-properties synkront
- [x] 1.2 `Limit Calculations/*.ts` (14 filer): fjern ll68/ul68-beregning; `controlLimitsObject`: fjern ll68/ul68-felter
- [x] 1.3 `viewModelClass.ts`: `["68","95","99"]`-loops → `["95","99"]`; tabel-kolonner, truncate/scale-lister, `summaryTableRowData.ll68/ul68` + grouped `ucl68/lcl68`
- [x] 1.4 Ryd 68-referencer i `plotPropertiesClass.ts`, `drawLineLabels.ts`, `getAesthetic.ts`, `buildTooltip.ts`, `drawLines`-line-keys
- [x] 1.5 Verifikation: tsc rent + vitest grøn → commit

## 2. Commit 2 — 95% default fra

- [x] 2.1 `linesSettings.ts`: `show_95` default `true` → `false` (matcher qicharts2 `show.95=FALSE`)
- [x] 2.2 Verifikation + commit (lille, men selvstændig adfærdsændring)

## 3. Commit 3 — astronomical: fast 3σ + én farve, direction-mapping ud

- [x] 3.1 `outliersSettings.ts`: fjern `astronomical_limit` + "General"-gruppen (process_flag_type, improvement_direction); erstat 4 colour-pickers med én `ast_colour`; capabilities synkront
- [x] 3.2 `flagOutliers`: kald `astronomical(values, ll99, ul99)` direkte (limit_map/ast_specification ud); fjern direction-mapping-loop
- [x] 3.3 Slet `checkFlagDirection.ts` + test; dot-farvning læser `settings.outliers.ast_colour` direkte (getAesthetic-flag-mapping ud)
- [x] 3.4 Opdatér `flagOutliersMultiGroup.test.ts`-stub + formattingModel-asserts (2 outlier-grupper)
- [x] 3.5 Verifikation + commit

## 4. Commit 4 — fjern Specification Limits

- [x] 4.1 `linesSettings.ts`: "Specification Limits"-gruppen ud; capabilities synkront
- [x] 4.2 Plumbing: `extractInputData`, `controlLimitsObject.speclimits_*`, `summaryTableRowData.speclimits_*`, drawLines-line-keys, tooltips
- [x] 4.3 Verifikation + commit

## 5. Commit 5 — fjern trend-linje (regression)

- [ ] 5.1 `linesSettings.ts`: "Trend"-gruppen ud; capabilities synkront
- [ ] 5.2 Slet `calculateTrendLine.ts` + test; fjern `trend_line`-felt + kald i `calculateLimits` + tooltip/tabel-referencer
- [ ] 5.3 Verifikation + commit

## 6. Commit 6 — docs + afsluttende verifikation

- [ ] 6.1 NEWS-entry (Breaking changes med migration-hints)
- [ ] 6.2 Grep-sweep: ingen rester af `_68`, `ll68/ul68`, `speclimit`, `specification`, `trend_line`, `checkFlagDirection`, `improvement_direction`, `process_flag_type`, `astronomical_limit`
- [ ] 6.3 `pbiviz package` bygger; version-bump
- [ ] 6.4 **[MANUELT TRIN]** Power BI: Lines-grupper = Main/Target/95/99 (95 default fra); Outlier-grupper = Astronomical + Anhoej; én ast-farve
