# Tasks — Add Anhøj Rules

## 1. Setup

- [x] 1.1 Flyt `docs/anhoj-fixtures.json` → `test/Outlier Flagging/anhoj-fixtures.json`
- [x] 1.2 Flyt `docs/anhoj-fixtures-gen.R` → `test/Outlier Flagging/anhoj-fixtures-gen.R`
- [x] 1.3 Tilføj note øverst i R-script: "Kør fra repo-rod for at regenerere fixtures hvis Anhøj-formlerne ændres"
- [x] 1.4 Verificér `pbiviz package` stadig bygger rent

## 2. `qbinom`-implementation

- [x] 2.1 Skriv `src/Functions/qbinom.ts` med signatur `(p: number, n: number, prob: number) => number`
  - Antager `prob = 0.5` for Anhøj-use-case
  - Throw `RangeError` hvis `p ∉ (0, 1)` eller `n < 0` eller `prob ∉ [0, 1]`
  - Genbruger `lgamma` fra `src/Functions/lgamma.ts`
- [x] 2.2 Skriv `test/Functions/test-qbinom.ts`
  - Sammenlign mod R-output: `qbinom(0.05, n-1, 0.5)` for `n ∈ {10, 20, 50, 100, 500, 1000}`
  - Edge cases: `p = 0.5`, `n = 0`, ugyldige inputs
- [x] 2.3 Kør test-suite, verificér rent

## 3. `anhojLongRun`-regel

- [x] 3.1 Skriv `src/Outlier Flagging/anhojLongRun.ts`
- [x] 3.2 Skriv `test/Outlier Flagging/test-anhojLongRun.ts`
- [x] 3.3 Kør test-suite

## 4. `anhojFewCrossings`-regel

- [x] 4.1 Skriv `src/Outlier Flagging/anhojFewCrossings.ts`
- [x] 4.2 Skriv `test/Outlier Flagging/test-anhojFewCrossings.ts`
- [x] 4.3 Kør test-suite

## 5. `outliersObject`-type-udvidelse

- [x] 5.1 I `src/Classes/viewModelClass.ts:138-143`: udvid `outliersObject`-type
- [x] 5.2 Udvid `lineData`-type med `group_signal_dashed?: boolean`
- [x] 5.3 Initialisér nye felter i `flagOutliers`'s outliers-objekt
- [x] 5.4 Kør `tsc --noEmit`, fix downstream-konsumenter af `outliersObject` (rent fraset pre-existing node_modules eslint-types-konflikt)

## 6. Integration i `flagOutliers` (per-group)

- [x] 6.1 Tilføj nye settings-reads øverst i `flagOutliers`
- [x] 6.2 Inde i `for`-loop over `groupStartEndIndexes`: kald per-gruppe Anhøj-regler, OR-aggregér global_signals + stash per_group_signals
- [x] 6.3 I post-loop ved `checkFlagDirection`-mapping: skip `anhoj_long_run`, `global_signals`, `per_group_signals`
- [x] 6.4 I point-aesthetic-iteration: tilføj Anhøj-gren der pre-mapper `"upper"`/`"lower"` → `"neutral_high"`/`"neutral_low"` før `getAesthetic`-call

## 7. Settings — ny "Anhøj Rules"-blok

- [x] 7.1 I `src/settings.ts`, tilføj ny settingsgroup efter "Two-In-Three" med toggles + `createOutlierColours("anhoj_long_run", defaultColours)`
- [ ] 7.2 **[MANUELT TRIN]** Verificér Power BI formatting-panel viser nye toggles (kræver Power BI Service/Desktop)

## 8. Centerline-rendering — stiplet per data-gruppe

- [x] 8.1 I `initialiseGroupedLines`: per-segment `group_signal_dashed` baseret på `groupStartEndIndexes`-lookup mod `per_group_signals`
- [x] 8.2 I `drawLines.ts:59`: overrid `stroke-dasharray` til `"4 2"` hvis `currLine === "targets" && d.group_signal_dashed`
- [ ] 8.3 **[DEFERRED]** Multi-group karma-test kræver mock af fuld viewModel; manuel verifikation prioriteret
- [ ] 8.4 **[MANUELT TRIN]** Manuel verifikation i Power BI Service med multi-group fixture

## 9. Sammenligningstest mod eksisterende `shift`-regel

- [x] 9.1 Skriv `test/Outlier Flagging/test-anhojVsShift.ts`
- [x] 9.2 Verificér at forskellen er som forventet — boundary-tests viser kontrast mellem dynamisk og fast threshold

## 10. Build + final verification

- [x] 10.1 `npm test` — 274/274 tests bestået (40 nye + 234 eksisterende)
- [x] 10.2 `tsc --noEmit` rent for src/ + test/ (node_modules eslint-types-konflikt er pre-existing, ikke fra denne change)
- [x] 10.3 `pbiviz package` bygger uden fejl
- [ ] 10.4 **[MANUELT TRIN]** Import `.pbiviz` i Power BI Service, manuel test med fixture-data
- [ ] 10.5 **[MANUELT TRIN]** Verificér: Anhøj-toggles tændes → flags vises korrekt + centerline stiplet ved signal

## 11. Documentation

- [x] 11.1 NEWS-entry under `(development)` med Anhøj-features + qicharts2-reference
- [x] 11.2 Tilføj kort kommentar-blok over `flagOutliers` der peger på Anhøj-grenen
