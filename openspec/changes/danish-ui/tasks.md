# Tasks — danish-ui

## 1. Commit 1 — Settings Model

- [x] 1.1 Oversæt alle 12 Settings Model-filer: kort-titler, gruppe-nøgler, option-labels, tooltip-defaults
- [x] 1.2 Dropdown-display-labels via `displayNames`-parameter (values urørte); chart-type-listen oversat
- [x] 1.3 tsc + vitest (forventede label-assert-fejl rettes i 1.4)
- [x] 1.4 Opdatér tests der asserter engelske gruppe-/label-navne
- [x] 1.5 Verifikation grøn → commit

## 2. Commit 2 — øvrige bruger-flader

- [x] 2.1 capabilities.json dataRoles displayNames
- [x] 2.2 viewModel tabel-kolonne-labels + buildTooltip faste tekster + derivedSettings dynamiske navne
- [x] 2.3 Validerings-/fejlbeskeder (validateInputData, extractInputData, validateDataViewColumns, drawErrors)
- [x] 2.4 Verifikation grøn → commit

## 3. Commit 3 — afslutning

- [x] 3.1 Grep-sweep for oversete engelske labels i bruger-vendte filer
- [x] 3.2 NEWS + version-bump + `pbiviz package`
- [ ] 3.3 **[MANUELT TRIN]** Power BI: panel/felt-brønde/tooltip/tabel/fejl på dansk; æøå rendres korrekt; gemte settings virker

## 4. Opfølgning 2026-06-11 — dansk talformat

- [x] 4.1 Ny `toFixedComma`-helper; anvendt i valueFormatter (tooltips/tabel), drawSummaryTable og drawYAxis — alle viste tal bruger komma som decimalmarkør
