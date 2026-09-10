# Tasks — complete-qicharts2-alignment

Ét trin per PR. Hvert trin afsluttes grønt (`npm test`, `npx tsc --noEmit`,
`pbiviz lint`, `pbiviz package`) før næste påbegyndes.

**Gennemgående regel:** settings og `capabilities.json` ryddes synkront. En
property, der kun fjernes ét af stederne, fejler tavst — det har kostet tid før.

---

## Trin 1 — Fire uafhængige fjernelser

> **Udført 2026-09-10.** Én rettelse undervejs: 1.4 kunne ikke løses ved blot
> at fjerne typerne fra dropdown-listen. `valid` er hvidlisten i
> `extractConditionalFormatting`, så en gemt værdi udenfor den erstattes af
> default og udløser en fejlbesked. `dropdownOption` har derfor fået et
> `hiddenValues`-argument, så en værdi kan blive gyldig uden at blive tilbudt.

### 1.1 Download-knap

- [x] Slet `src/D3 Plotting Functions/drawDownloadButton.ts`
- [x] Slet `src/Settings Model/downloadSettings.ts`
- [x] Fjern kortet fra `src/settings.ts`
- [x] Fjern kald og gruppe fra `src/visual.ts`
- [x] Fjern `download_options` fra `capabilities.json`

### 1.2 Specifikationsgrænser

- [x] Fjern "Specification Limits"-gruppen fra `src/Settings Model/linesSettings.ts`
- [x] Fjern `"Specification"` som valg i `astronomical_limit`
      (`src/Settings Model/outliersSettings.ts`) — dropdownen selv fjernes i trin 2
- [x] Ryd referencer i `plotPropertiesClass.ts`, `viewModelClass.ts`,
      `drawLineLabels.ts`, `buildTooltip.ts`, `extractInputData.ts`, `getAesthetic.ts`
- [x] Fjern properties fra `capabilities.json`

### 1.3 Trendlinje

> Dette er trend-**linjen** (regressionsoverlay), ikke trend-**reglen**, som
> blev fjernet i F2. Navnene ligner hinanden; det er to forskellige features.

- [x] Slet `src/Functions/calculateTrendLine.ts` og dens test
- [x] Fjern "Trend"-gruppen fra `src/Settings Model/linesSettings.ts`
- [x] Fjern `trend_line` fra `viewModelClass.ts` (`summaryTableRowData`,
      linje-opsætning) og fra `buildTooltip.ts`, `getAesthetic.ts`
- [x] ~~Fjern `trend_line`-dataroller~~ — `trend_line` var beregnet, ikke en datarolle
- [x] Fjern properties fra `capabilities.json` (19 stk.)

### 1.4 Skjul `i_m` og `i_mm`

- [x] Fjern de to fra `items` via `dropdownOption`'s nye `hiddenValues`.
      **Ikke** fra `valid` — se noten øverst
- [x] Behold `src/Limit Calculations/i_m.ts` og `i_mm.ts` uændret
- [x] Behold deres registrering i `derivedSettingsClass.ts`, så en gemt
      `chart_type` stadig renderer
- [x] Test: en gemt `chart_type: "i_m"` renderer fortsat korrekt

---

## Trin 2 — Grænsefladen

> **Udført 2026-09-10.** Fundet undervejs: `buildTooltip` skrev
> `["99", "95", "65"]` hvor indstillingerne hedder `_68`, så 1σ-rækken i
> tooltip aldrig kunne vises. Upstream-fejl; moot her, men den findes stadig
> i AUS-DOH og bør meldes videre.

Ét gennemløb af de 14 filer i `src/Limit Calculations/`, frem for tre.

### 2.1 Beregning

- [x] Fjern `ll95`/`ul95` og `ll68`/`ul68` fra `controlLimitsObject`
      (`src/Classes/viewModelClass.ts`)
- [x] Fjern dem fra alle limit-beregninger: `c.ts`, `g.ts`, `i.ts`, `i_m.ts`,
      `i_mm.ts`, `mr.ts`, `p.ts`, `pprime.ts`, `s.ts`, `t.ts`, `u.ts`,
      `uprime.ts`, `xbar.ts`

### 2.2 Rendering og visning

- [x] Fjern 95%- og 68%-grupperne fra `src/Settings Model/linesSettings.ts`
- [x] Ryd `drawLineLabels.ts` og `getAesthetic.ts`
- [x] Fjern rækker fra `buildTooltip.ts` og kolonner fra oversigtstabellen
- [x] Fjern alle `*_95`- og `*_68`-properties fra `capabilities.json`

### 2.3 `astronomical_limit`

- [x] Fjern dropdownen fra `src/Settings Model/outliersSettings.ts`
- [x] `astronomical` sammenligner altid mod `ll99`/`ul99`
- [x] Fjern property fra `capabilities.json`

---

## Trin 3 — Retningsfarver

> **Udført 2026-09-10.** Panelets tredje række var allerede dækket af
> `flagOutliersGroupStats.test.ts` ("counts limits independently of the
> astronomical toggle"), så den planlagte test ville have været et svagere
> duplikat. I stedet er `astpoint`-kontrakten låst: feltet bærer nu siden
> (`upper`/`lower`), ikke en vurdering.

- [x] Slet `src/Outlier Flagging/checkFlagDirection.ts` og dens test
- [x] Fjern kald i `viewModelClass.ts`; `astronomical` returnerer et brud, der
      ikke oversættes til en vurdering
- [x] Fjern "General"-gruppen (`process_flag_type`, `improvement_direction`)
      fra `src/Settings Model/outliersSettings.ts`
- [x] Erstat de fire farvevælgere med én `ast_colour`
- [x] Ryd direction-keys i `getAesthetic.ts`
- [x] Opdatér `capabilities.json` synkront
- [x] Test: punkt over og punkt under grænsen får samme farve
- [x] ~~Test: signalpanelets tredje række er uændret~~ — allerede dækket af
      `flagOutliersGroupStats.test.ts`; låste i stedet `astpoint`-kontrakten

---

## Trin 4 — 3σ-bånd

> **Udført 2026-09-10.** Mutationstest afslørede, at den planlagte
> `has_control_limits`-guard og en `!!limits?.ll99`-kontrol var ækvivalente:
> `run` er den eneste chart-type uden kontrolgrænser, og `run.ts` er den
> eneste limit-beregning, der ikke producerer `ll99`. Den ene er fjernet.
> Run-diagram-testen kan derfor ikke isolere hvilken guard der virker — den
> verificerer udfaldet, ikke mekanismen.

Reference: `git show arkiv/f1-2026-06-17:"src/D3 Plotting Functions/drawLimitBand.ts"`.
Skrives om mod nuværende kodebase — den gamle er fra før Vitest og
signalpanelet.

- [x] Ny `src/D3 Plotting Functions/drawLimitBand.ts`
- [x] SVG-gruppe bag linjer og punkter i tegnerækkefølgen
- [x] Ét bånd per fase, brudt ved faseskift
- [x] Intet bånd på chart-typer uden kontrolgrænser
- [x] Indstillinger i `linesSettings.ts`: vis/skjul (**default fra**), farve,
      gennemsigtighed — synkront i `capabilities.json`
- [x] Test: faseopdelt diagram giver to adskilte bånd
- [x] Test: run-diagram giver intet bånd

---

## Trin 5 — Dansk UI

Reference for terminologien: `arkiv/f1-2026-06-17` har fladen oversat.

- [ ] `src/Functions/toFixedComma.ts` — dansk decimalkomma
- [ ] Anvend den alle steder tal vises: tooltips, oversigtstabel,
      akse-etiketter, linje-etiketter, signalpanel
- [ ] Oversæt alle `src/Settings Model/*.ts`: kortnavne, gruppenavne,
      indstillingsnavne, dropdown-labels
- [ ] Oversæt feltbrøndenes navne i `capabilities.json`
- [ ] Oversæt tooltip-labels og tabelkolonner
- [ ] Oversæt fejl- og valideringsbeskeder
- [ ] Verificér: "Anhøj" fremgår ikke af den brugervendte flade
- [ ] **[MANUELT TRIN]** Johan læser terminologien igennem. Oversættelsen kan
      laves; om ordvalget er det rigtige i huset, er en faglig vurdering

---

## Afslutning

- [ ] `NEWS.md`-entry, der samler alle fem trin
- [ ] `README.md`: opdatér afsnittene om hvad forken tilføjer og har fjernet
- [ ] **[MANUELT TRIN]** Verificér i Power BI Desktop — visualen er stadig
      aldrig set i en rigtig rude
- [ ] **[MANUELT TRIN]** Skær `v1.0.0.0` når alle fem trin er inde
