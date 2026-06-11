# Tasks — danish-ui

## 1. Commit 1 — Settings Model

- [ ] 1.1 Oversæt alle 12 Settings Model-filer: kort-titler, gruppe-nøgler, option-labels, tooltip-defaults
- [ ] 1.2 Dropdown-display-labels via `displayNames`-parameter (values urørte); chart-type-listen oversat
- [ ] 1.3 tsc + vitest (forventede label-assert-fejl rettes i 1.4)
- [ ] 1.4 Opdatér tests der asserter engelske gruppe-/label-navne
- [ ] 1.5 Verifikation grøn → commit

## 2. Commit 2 — øvrige bruger-flader

- [ ] 2.1 capabilities.json dataRoles displayNames
- [ ] 2.2 viewModel tabel-kolonne-labels + buildTooltip faste tekster + derivedSettings dynamiske navne
- [ ] 2.3 Validerings-/fejlbeskeder (validateInputData, extractInputData, validateDataViewColumns, drawErrors)
- [ ] 2.4 Verifikation grøn → commit

## 3. Commit 3 — afslutning

- [ ] 3.1 Grep-sweep for oversete engelske labels i bruger-vendte filer
- [ ] 3.2 NEWS + version-bump + `pbiviz package`
- [ ] 3.3 **[MANUELT TRIN]** Power BI: panel/felt-brønde/tooltip/tabel/fejl på dansk; æøå rendres korrekt; gemte settings virker
