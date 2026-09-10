# Tasks — Remove Non-Anhøj Rules

> **Status pr. 2026-09-10 — rettet.**
>
> Denne plan er fra 2026-05-19 og blev **revideret 2026-06-11**. Revisionen
> ligger i `../archive/2026-06-11-remove-non-anhoj-rules/` og er den, der
> gælder. Den er udført: F2 landede via PR #4 (commit `faafe95`) med præcis
> juni-revisionens afgrænsning.
>
> Juni-revisionen indsnævrede scopet på tre punkter, som denne maj-version
> stadig beskriver, og som derfor **ikke** er udestående arbejde:
>
> | Maj-planen ville | Juni-revisionen |
> |---|---|
> | slette `checkFlagDirection.ts` | **bevar den** — "bruges af astronomical" |
> | omdøbe `astronomical.ts` → `outsideControlLimits.ts` | taget ud af scope |
> | fjerne `astronomical_limit` | taget ud af scope |
>
> Det ene punkt fra maj, der **ikke** blev afgjort i juni og stadig står
> åbent, er fjernelsen af chart-typerne `i_m` og `i_mm`. Begge er stadig
> valgbare i Chart Type-dropdownen. Begrundelsen ligger i
> `specs/centerline-calculation/spec.md`, som juni-revisionen ikke har —
> det er grunden til, at denne maj-version bevares frem for at slettes.
>
> Advarslen i 1.4 blev respekteret: `calculateTrendLine.ts` og
> `lines.show_trend` er urørte. Det er trend-*linjen* (regressions-overlay),
> en anden feature end den fjernede trend-*regel*.
>
> SHA-referencerne i 1.1 nedenfor er forældede.

## 1. Pre-flight

- [ ] 1.1 **PR-strategi (Codex N4):** Vent på F1-merge til main FØR F2 åbnes som PR. Alternativ: åbn F2 som stacked-PR target `feat/anhoj-rules-f1` så reviewers ser kun F2-delta. Aktuel branch `refactor/remove-non-anhoj-f2` ligger på F1's HEAD (2cc30c2); main er a793c2b.
- [ ] 1.2 Kør baseline `npm test` — alle 274 tests skal stadig bestå før fjernelser begynder
- [ ] 1.3 Kør baseline `pbiviz package` — clean build før fjernelser
- [ ] 1.4 **Vigtigt — conflation-advarsel:** `outliers.trend`-REGEL (Western Electric, 5+ monotonic) fjernes i F2. `lines.show_trend` + `trend_line` + `calculateTrendLine` (linær regression overlay) BEVARES — det er en separat feature. F2 må IKKE fjerne dem.

## 2. Slet legacy outlier-regler

- [ ] 2.1 Slet `src/Outlier Flagging/trend.ts`
- [ ] 2.2 Slet `src/Outlier Flagging/twoInThree.ts`
- [ ] 2.3 Slet `src/Outlier Flagging/shift.ts`
- [ ] 2.4 Slet `src/Outlier Flagging/checkFlagDirection.ts`
- [ ] 2.5 Slet tests: `test-trend.ts`, `test-twoInThree.ts`, `test-shift.ts`, `test-checkFlagDirection.ts`, `test-anhojVsShift.ts` (sammenligning kan ikke køre uden shift)

## 3. Slet NHS Icons + cascade-cleanup

- [ ] 3.1 Slet `src/D3 Plotting Functions/NHS Icons/` (hele mappe — 11 ikon-filer + index.ts)
- [ ] 3.2 Slet `src/D3 Plotting Functions/drawIcons.ts`
- [ ] 3.3 Slet `src/D3 Plotting Functions/initialiseIconSVG.ts`
- [ ] 3.4 Slet `src/Outlier Flagging/assuranceIconToDraw.ts`
- [ ] 3.5 Slet `src/Outlier Flagging/variationIconsToDraw.ts`
- [ ] 3.6 Slet tests: `test-assuranceIconToDraw.ts`, `test-variationIconsToDraw.ts`
- [ ] 3.7 **(Codex H1-utvidelse):** Cleanup `src/D3 Plotting Functions/drawSummaryTable.ts`:
  - Fjern `import initialiseIconSVG` (linje 3) + `import * as nhsIcons` (linje 4)
  - Fjern `.call(initialiseIconSVG, d.value)` (linje 149) og `.call(nhsIcons[d.value])` (linje 152)
  - Beslut: drop icon-column helt fra summary-table (anbefalet — ingen Anhøj-icon-paradigm)
- [ ] 3.8 **(Codex H1-grouped-summary):** Cleanup `viewModelClass.ts:485-566` grouped summary-table-pipeline:
  - Fjern `variation`/`assurance`-kolonner fra tableColumns-setup
  - Fjern row-filter-logic baseret på icon-class
  - Fjern row-data-writes for icon-værdier
  - Verificér ingen `summary_table.filter_X`-settings refererer fjernede icons

## 4. Slet i_m + i_mm chart-typer

- [ ] 4.1 Slet `src/Limit Calculations/i_m.ts`
- [ ] 4.2 Slet `src/Limit Calculations/i_mm.ts`
- [ ] 4.3 Fjern fra `src/Limit Calculations/index.ts`: `export { default as i_m } ...` + `export { default as i_mm } ...`
- [ ] 4.4 Fjern fra `src/Classes/derivedSettingsClass.ts`: `valueNames["i_m"]` + `valueNames["i_mm"]` + alle `.includes(["i_m", "i_mm", ...])`-arrays
- [ ] 4.5 Fjern tests for i_m, i_mm hvis de findes (formodentlig i `test/Chart Types/`)

## 5. Omdøb `astronomical` → `outsideControlLimits`

- [ ] 5.1 Omdøb fil: `src/Outlier Flagging/astronomical.ts` → `outsideControlLimits.ts`
- [ ] 5.2 Omdøb default export `astronomical` → `outsideControlLimits`
- [ ] 5.3 Opdater signatur-comments/JSDoc til at reflektere "outside control limits"-terminologi + qicharts2-attribution
- [ ] 5.4 **(Codex H4-utvidelse):** I `src/Outlier Flagging/index.ts` (barrel): opdater exports
  - Fjern: `astronomical`, `shift`, `trend`, `twoInThree`
  - Tilføj: `outsideControlLimits` (omdøbt fra astronomical)
  - Beslut: tilføj `anhojLongRun` + `anhojFewCrossings` for konsistens, eller fjern barrel helt (direct-path-import er allerede etableret pattern i viewModelClass)
- [ ] 5.5 Omdøb test: `test-astronomical.ts` → `test-outsideControlLimits.ts`; opdater imports + describe-block

## 6. Modificér `outsideControlLimits` til direction-agnostisk

- [ ] 6.1 Funktionen returnerer fortsat `"upper"`/`"lower"`/`"none"` (uændret signatur). Side-information bevares for at understøtte to-color-rendering (above/below).
- [ ] 6.2 Tilføj kommentar i header: "Direction-agnostic — coloring uses neutral_high/neutral_low keys (set by viewModelClass at render time, not by checkFlagDirection)"

## 7. Cleanup `viewModelClass.ts` flagOutliers

- [ ] 7.1 Fjern imports: `trend`, `twoInThree`, `shift`, `checkFlagDirection`, `astronomical` (gen-imported som outsideControlLimits), `variationIconsToDraw`, `assuranceIconToDraw`
- [ ] 7.2 Tilføj import: `outsideControlLimits from "../Outlier Flagging/outsideControlLimits"`
- [ ] 7.3 I `flagOutliers`-funktion:
  - Fjern reads: `process_flag_type`, `improvement_direction`, `trend_n`, `shift_n`, `ast_specification`, `two_in_three_specification`
  - Fjern fra outliers-object: `astpoint`, `trend`, `two_in_three`, `shift` (alle erstattes af `outside_control_limits`)
  - Fjern grene: `astronomical`, `twoInThree`, `trend`, `shift`-kald
  - Tilføj gren: `outsideControlLimits(group_values, ll99_slice, ul99_slice)` med hardcoded 3σ-grænser
  - Fjern hele `limit_map` (multi-sigma + Specification) — kun 3σ-keys (`ll99`/`ul99`) bruges
  - Fjern post-loop `Object.keys(outliers).forEach`-mapping
- [ ] 7.4 Opdater `outliersObject`-type i samme fil:
  - Fjern: `astpoint`, `trend`, `two_in_three`, `shift`
  - Tilføj: `outside_control_limits: string[]`
- [ ] 7.5 Opdater `summaryTableRowData`-type: fjern `astpoint`, `trend`, `two_in_three`; tilføj `outside_control_limits`

## 8. Cleanup `viewModelClass.ts` point-aesthetic-iteration

- [ ] 8.1 Fjern coloring-grene: `outliers.shift[i]`, `outliers.trend[i]`, `outliers.two_in_three[i]`, `outliers.astpoint[i]`
- [ ] 8.2 Tilføj coloring-gren for `outliers.outside_control_limits[i]` med pre-mapping til `"neutral_high"`/`"neutral_low"` (samme pattern som `anhoj_long_run` fra F1)
- [ ] 8.3 Fjern `summaryTableRow.astpoint`/`.trend`/`.two_in_three`/`.shift`; tilføj `summaryTableRow.outside_control_limits`
- [ ] 8.4 **(Codex M1):** Coloring-præcedens-beslutning når både `outside_control_limits` OG `anhoj_long_run` fires på samme punkt
  - Anbefaling: lad `outside_control_limits`-coloring vinde (sidste branch i loop). 3σ-overskridelse er stærkere signal end mønster-baseret long-run
  - Dokumentér i comment over coloring-grenene

## 9. Cleanup `viewModelClass.ts` icon-callers

- [ ] 9.1 Fjern `variationIconsToDraw`-kald (linje ~515)
- [ ] 9.2 Fjern `assuranceIconToDraw`-kald (linje ~533)
- [ ] 9.3 Verificér ingen andre kaldere af de slettede funktioner

## 10. Cleanup `frontend.ts` / `visual.ts` icon-pipeline

- [ ] 10.1 Find + fjern `initialiseIconSVG`-kald
- [ ] 10.2 Find + fjern `drawIcons`-kald
- [ ] 10.3 Fjern eventuelle SVG-icon-related state-felter på Visual

## 11. Settings.ts cleanup

- [ ] 11.1 Fjern `outliers.process_flag_type`-setting (linje ~264)
- [ ] 11.2 Fjern `outliers.improvement_direction`-setting (linje ~275)
- [ ] 11.3 Omdøb settings-key + displayName: `astronomical` → `outside_control_limits`; "Highlight Astronomical Points" → "Highlight Outside Control Limits"
- [ ] 11.4 Fjern `astronomical_limit`-dropdown helt (hardcoded 3σ)
- [ ] 11.5 Fjern hele "Shifts" settingsgroup
- [ ] 11.6 Fjern hele "Trends" settingsgroup
- [ ] 11.7 Fjern hele "Two-In-Three" settingsgroup
- [ ] 11.8 Fjern hele `nhs_icons` section (linje ~362+)
- [ ] 11.9 Fjern `lines.show_95` + `lines.show_68` settings (warning-limits)
- [ ] 11.10 Opdater `createOutlierColours("ast", ...)` → `createOutlierColours("outside_control_limits", ...)` i nyt settingsgroup

## 12. Chart-type valid-list cleanup

- [ ] 12.1 I `src/settings.ts:140`: fjern `"i_m"`, `"i_mm"` fra `valid`-array
- [ ] 12.2 Fjern tilhørende `items`-entries (display-tekst for i_m + i_mm)
- [ ] 12.3 I `capabilities.json`: chart_type-enumeration er tom (`[]`) — Power BI populerer dynamisk fra settings.ts. Verificér ingen statisk liste skal opdateres.

## 12b. capabilities.json schema-cleanup (Codex N3 — NEW)

`capabilities.json` indeholder fuld schema for fjernede settings (Power BI persisted schema, separat fra settings.ts TypeScript-config). Stale schema → unknown settings i Power BI runtime-binding.

- [ ] 12b.1 Fjern fra `capabilities.json` outliers-objektet:
  - `process_flag_type` (linje 102)
  - `improvement_direction` (linje 105)
  - `astronomical` (linje 108) — eller omdøb til `outside_control_limits`
  - `astronomical_limit` (linje 111) — fjern helt (hardcoded 3σ)
  - Alle `astronomical_colour_*` keys (4 farver)
  - `shift` (linje 128), `shift_n` (linje 131), 4 `shift_colour_*` keys
  - `trend` (linje 146), `trend_n` (linje 149), 4 `trend_colour_*` keys
  - `two_in_three` + variants (linje 164-170) + 4 farve-keys
- [ ] 12b.2 Fjern hele `nhs_icons` section (linje 189+)
- [ ] 12b.3 Fjern fra `capabilities.json` lines-objektet:
  - `show_95` (linje 295), `show_68` (linje 298)
  - `ttip_show_95` (linje 391), `ttip_show_68` (linje 394)
  - Alle tilhørende `width_95`/`width_68`/`type_95`/`type_68`/`colour_95`/`colour_68`/`ttip_label_95`/`ttip_label_68` osv.
  - **BEVAR:** `show_trend` (linje 313), `ttip_show_trend` (linje 406), `ttip_label_trend` (linje 451), `width_trend`, `type_trend`, `colour_trend` — alle trend-LINJE (regression), IKKE trend-rule
- [ ] 12b.4 Verificér capabilities.json validerer mod Power BI's schema

## 13. Settings consumer cleanup

- [ ] 13.1 **(Codex N2 + H5 recalibreret):** I `src/Classes/settingsClass.ts`: cleanup begge validation-blocks
  - Linje 96-102 (AKTIV — bryder compile uden cleanup): fjern hele `if (nhs_icons.show_variation_icons)`-blok. Den refererer `nhs_icons` + legacy outlier-patterns (`astronomical`, `shift`, `trend`, `two_in_three`) — alle fjernes i F2
  - Linje 104-113 (commented out): fjern dead-code-blok (improvementDirection-assurance-validation)
- [ ] 13.2 **(Codex N1 — NEW HIGH):** Cleanup `src/Functions/buildTooltip.ts`
  - Fjern `astronomical_limit`-read (linje 27) + `two_in_three_limit`-read (linje 28)
  - Omskriv pattern-detection-block (linje 111-127):
    - Fjern referencer til `table_row.astpoint`, `table_row.trend`, `table_row.shift`, `table_row.two_in_three`
    - Tilføj referencer til `table_row.outside_control_limits` (nyt felt) og evt. `table_row.anhoj_long_run`
    - Beslut: skal Anhøj-long-run vises i tooltip-pattern-block? Hvis ja, opdater også pattern-tekst
  - Bevar `inputSettings.lines.ttip_show_trend` + `table_row.trend_line`-block (linje 58-62) — trend-linje (regression), ej trend-rule
- [ ] 13.3 Verificér ingen andre filer importerer fjernede settings — søg `process_flag_type|improvement_direction|astronomical_limit|two_in_three_limit|trend_n|shift_n` på tværs af src/

## 14. Warning-limits rendering cleanup (Codex H6)

**Decision (Codex-recalibreret):** Behold beregningen i de 13 chart-impls (`ll95`, `ul95`, `ll68`, `ul68`-felter i `controlLimitsObject`); fjern KUN rendering + UI. Existing tests asserter ll95/ul95 — at fjerne beregning bryder dem.

- [ ] 14.1 I `src/Classes/viewModelClass.ts`: fjern labels-push for "ll95"/"ul95"/"ll68"/"ul68" i `initialiseGroupedLines` (linje 766-771)
- [ ] 14.2 I `src/Classes/viewModelClass.ts`: fjern tableColumns-builder-grene for `show_95`/`show_68` (linje 632-635)
- [ ] 14.3 Tilføj comment i `drawLines.ts` der noterer: "Warning-limits (ll95/ul95/ll68/ul68) er computed-but-unrendered efter F2 — fjernet fra UI fordi two_in_three-reglen er væk; beregningen bevares for at undgå at bryde chart-impl-tests"
- [ ] 14.4 Verificér `lineNameMap`-objekt mapper kun de bevarede linjer (ej ll95/ul95/ll68/ul68)

## 15. Tests opdatering

- [ ] 15.1 Slet alle test-filer for fjernede regler/funktioner:
  - `test-astronomical.ts` (omdøbes til test-outsideControlLimits.ts — §15.3)
  - `test-shift.ts`, `test-trend.ts`, `test-twoInThree.ts`
  - `test-checkFlagDirection.ts`
  - `test-variationIconsToDraw.ts`, `test-assuranceIconToDraw.ts`
  - `test-anhojVsShift.ts` (F1-tilføjet, shift fjernes så sammenligning ej giver mening)
- [ ] 15.2 (Konsolideret med 15.1 — dedup gennemført)
- [ ] 15.3 Skriv `test/Outlier Flagging/test-outsideControlLimits.ts` (porterer eksisterende test-astronomical.ts-cases + tilføjer direction-agnostisk coloring-test)
- [ ] 15.4 Opdater integration-tests hvis nogen forventer fjernede outliersObject-felter
- [ ] 15.5 (Codex H6-verifikation): Bekræft ingen chart-impl-tests fjernes pga warning-limits-cleanup. Test-asserts for `ll95`/`ul95`/`ll68`/`ul68` skal stadig passere (beregningen bevares)

## 16. Build + verification

- [ ] 16.1 `tsc --noEmit` rent for `src/` + `test/`
- [ ] 16.2 `npm test` — alle resterende tests bestået
- [ ] 16.3 `pbiviz package` bygger uden fejl
- [ ] 16.4 Manuel inspektion: settings-panel i Power BI Service viser kun "Outside Control Limits" + "Anhøj Rules" under outliers (ingen Astronomical/Trends/Two-In-Three/Shifts/NHS Icons)
- [ ] 16.5 Manuel verifikation: fixture-data udløser outside-control-limit-flags + Anhøj-regler korrekt

## 17. Documentation

- [ ] 17.1 NEWS-entry under `(development)` med:
  - **Breaking changes** sektion: chart_type-fjernelse, regel-fjernelse, settings-rename, NHS-fjernelse
  - **Internal changes**: type-cleanup, direction-mapping-fjernelse
  - Attribution: AUS-DOH-Safety-and-Quality (upstream) + qicharts2 (algoritme-reference)
- [ ] 17.2 Tilføj attribution-kommentar i `outsideControlLimits.ts` (qicharts2's sigma.signal-kontrakt)
- [ ] 17.3 Opdater kommentar i `flagOutliers` (F1's reference er nu eneste outlier-orchestration-doc)
