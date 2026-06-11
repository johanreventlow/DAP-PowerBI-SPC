# Tasks — add-anhoj-stats-display

## 1. Commit 1 — statistik-eksponering

- [x] 1.1 `anhojShared.ts`: `AnhojStats`-type + `anhojStats()`; `anhojLongRun`/`anhojFewCrossings` → wrappers
- [x] 1.2 `viewModelClass.ts`: `per_group_signals[g].stats`; flagOutliers beregner stats én gang per gruppe
- [x] 1.3 Tests: `anhojStats` mod alle fixtures (nUseful/longestRun/maks/kryds/min); flagOutliersMultiGroup asserter stats-eksponering
- [x] 1.4 tsc + vitest grøn → commit

## 2. Commit 2 — settings + rendering

- [ ] 2.1 `outliersSettings.ts`: show_anhoj_stats + font/size/colour + 2 label-tekster; `capabilities.json` synkront
- [ ] 2.2 Ny `drawAnhojStats.ts`: tekstblok per fase (2 tspans), x = fasens midtpunkt, y = top-offset; fjern ved toggle fra/grouped mode/degenereret fase
- [ ] 2.3 `visual.ts`: tilføj `.call(drawAnhojStats, this)`
- [ ] 2.4 formattingModel-test: Anhoej-gruppens slices opdateret
- [ ] 2.5 tsc + vitest grøn → commit

## 3. Commit 3 — docs + build

- [ ] 3.1 NEWS-entry (Nye features)
- [ ] 3.2 Version-bump + `pbiviz package`
- [ ] 3.3 **[MANUELT TRIN]** Power BI: toggle til → statistik vises per fase; default fra
