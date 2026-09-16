# Cycle 2 — Review af `remove-non-anhoj-rules`-proposal (F2)

**Dato:** 2026-05-19
**Reviewer:** Claude (Phase 1)
**Target:** `openspec/changes/remove-non-anhoj-rules/{proposal.md, design.md, tasks.md, specs/}`
**Trigger:** Ny OpenSpec-proposal med cross-cutting fjernelser (13 filer + cascade-cleanup). Pre-implementation review.

---

## H1 [HIGH] — `drawSummaryTable.ts` bruger nhsIcons; proposal nævner ej cleanup

**Lokation:** `tasks.md` §3 (NHS Icons), §10 (frontend/visual cleanup)

**Symptom:** Proposal lister `drawIcons.ts`, `initialiseIconSVG.ts` og `visual.ts` som NHS-icon-caller-sites der skal opdateres. **Mangler:** `src/D3 Plotting Functions/drawSummaryTable.ts` importerer + bruger både `initialiseIconSVG` og `nhsIcons`.

**Verifikation:**

```typescript
// src/D3 Plotting Functions/drawSummaryTable.ts:3-4
import initialiseIconSVG from "./initialiseIconSVG";
import * as nhsIcons from "./NHS Icons"

// drawSummaryTable.ts:149-152
.call(initialiseIconSVG, d.value)
...
.call(nhsIcons[d.value]);
```

**Konsekvens:** Når NHS Icons-mappe + initialiseIconSVG.ts slettes (§3.1-3.3), vil `drawSummaryTable.ts` ej kompilere. Compile-error blokerer hele build. Implementer vil opdage det ved `tsc --noEmit`, men det forsinker apply-cycle og kræver ad-hoc beslutning om hvorvidt summary-table-ikoner også skal væk eller erstattes.

**Foreslået fix:** Tilføj task §3.7 + §3.8:

```
[ ] 3.7 Fjern NHS-icon-imports + brug i src/D3 Plotting Functions/drawSummaryTable.ts:3-4
        Beslut: drop hele icon-column i summary-table, eller erstat med ren tekst-version?
[ ] 3.8 Hvis drop icon-column: fjern relateret kode i tableColumns-setup (viewModelClass.ts)
```

Decision needed: hvad sker der med summary-table's icon-kolonne efter F2? Drop helt? Behold som direction-agnostisk indicator?

---

## H2 [HIGH] — `outliersObject` har downstream-konsumenter ud over flagOutliers

**Lokation:** `tasks.md` §7.3, §7.4, §8

**Symptom:** Proposal §7.3 + §7.4 dækker `flagOutliers` + `outliersObject`-type. **Mangler:** den fulde liste af kalde-sites for de fjernede outlier-felter (`astpoint`, `trend`, `two_in_three`, `shift`).

**Verifikation:** `grep -n outliers\.astpoint src/Classes/viewModelClass.ts` finder kalde-sites på:

```
Line 643: if (settings.outliers.trend) { tableColumns.push({name: "trend", ...}) }
Line 646: if (settings.outliers.shift) { tableColumns.push({name: "shift", ...}) }
Line 656-672: 4 coloring-grene for shift/trend/two_in_three/astpoint
Line 709-712: summaryTableRowData population (astpoint, trend, shift, two_in_three felter)
```

Plus:

```
Line 65, 66, 68:    summaryTableRowData type-felter (astpoint, trend, two_in_three)
Line 145-148:       outliersObject type-felter
Line 641:           tableColumns.push({name: "astpoint", label: "Ast. Point"})
```

**Konsekvens:** §7.4 nævner `outliersObject`-type-cleanup men ej `summaryTableRowData`. §8 nævner point-aesthetic-iteration men ej tableColumns-builder + summaryTableRowData-population. Implementer vil opdage compile-errors fra disse — men der vil være MANGE.

**Foreslået fix:** Eksplicit udvid task-listen:

```
[ ] 7.4 Opdater outliersObject-type (linje 145-148):
        Fjern: astpoint, trend, two_in_three, shift
        Tilføj: outside_control_limits: string[]
[ ] 7.5 Opdater summaryTableRowData-type (linje 65-68):
        Fjern: astpoint, trend, two_in_three (linje 65, 66, 68)
        Bevar: shift hvis Anhøj long-run flag-værdier eksporteres til tabel?
        Tilføj: outside_control_limits, anhoj_long_run
[ ] 7.6 tableColumns-builder (linje 633-650): omdøb astpoint-entry + fjern trend/shift-entries
[ ] 7.7 summaryTableRowData-population (linje 705-715): opdater field-set
```

Subtask om Anhøj-eksport til tabel: skal `outside_control_limits` + `anhoj_long_run` vises i summary-tabel-kolonner som de gamle regler gjorde? Eller drop helt?

---

## H3 [HIGH] — Conflation: `settings.lines.show_trend` ≠ `outliers.trend`-regel

**Lokation:** `tasks.md` §11.6 + `proposal.md` "Filer fjernet"

**Symptom:** Proposal taler om at fjerne "Trends" settingsgroup (§11.6) og refererer trend-reglen. **Risiko:** implementer kan forveksle `settings.lines.show_trend` (trend-LINJE — linær regression overlay) med `settings.outliers.trend` (trend-REGEL — 5+ consecutive monotonic). De er to forskellige features.

**Verifikation:**

```typescript
// settings.outliers.trend (fjernes — Western Electric-regel)
"Trends": {
  trend: ToggleSwitch (default: false),
  trend_n: NumUpDown (default: 5),
  ...
}

// settings.lines.show_trend (BEVARES — trend-linje overlay)
// viewModelClass.ts:624
if (settings.lines.show_trend) {
  this.tableColumns[0].push({ name: "trend_line", label: "Trend Line" });
}
// viewModelClass.ts:425
controlLimits.trend_line = calculateTrendLine(controlLimits.values);
```

`calculateTrendLine` (i `src/Functions/calculateTrendLine.ts`) er en separat feature — beregner linær regression. Ej en outlier-regel.

**Konsekvens:** Hvis implementer fortolker "fjern trend" bredt og fjerner både outliers.trend + lines.show_trend + trend_line + calculateTrendLine, mister pakken trend-linje-overlay-feature. Det er IKKE intentionen.

**Foreslået fix:** Eksplicit tilføj note øverst i tasks.md eller i §11.6:

```markdown
**Vigtigt:** `outliers.trend`-REGEL (Western Electric, 5+ monotonic) fjernes.
`lines.show_trend` + `trend_line` (linær regression overlay) BEVARES — det er en
separat feature der visualiserer en regression-linje over data, ej en
outlier-regel.
```

---

## H4 [MEDIUM] — `Outlier Flagging/index.ts` barrel-cleanup mangler i tasks

**Lokation:** `tasks.md` §2 + §5

**Symptom:** Barrel-fil `src/Outlier Flagging/index.ts` eksporterer aktuelt:

```typescript
export { default as astronomical } from "./astronomical"
export { default as shift } from "./shift"
export { default as trend } from "./trend"
export { default as twoInThree } from "./twoInThree"
```

Proposal §2 sletter filerne. §5 omdøber astronomical → outsideControlLimits. Men ingen task siger eksplicit at barrel'en skal opdateres til at:
- Fjerne shift, trend, twoInThree exports
- Omdøbe astronomical-export → outsideControlLimits
- Tilføje anhojLongRun + anhojFewCrossings exports (eller bevare current pattern hvor de imports via direct path)

**Verifikation:** F1's anhojLongRun + anhojFewCrossings tilføjede ej til barrel (direct-path-import-pattern). Konsistens-overvejelse for F2.

**Konsekvens:** Tilbageblevet dead-export i barrel ville være en linter-warning, ej fejl. Implementer kan glemme barrel hvis ej eksplicit i tasks.

**Foreslået fix:** Tilføj task §5.4.b:

```
[ ] 5.4 I src/Outlier Flagging/index.ts: opdater barrel-exports
        - Fjern: astronomical, shift, trend, twoInThree
        - Tilføj: outsideControlLimits (omdøbt fra astronomical)
        - Beslut: tilføj anhojLongRun + anhojFewCrossings for konsistens?
                  (Eller fjern barrel helt — direct-path-import er allerede etableret pattern.)
```

---

## H5 [MEDIUM] — `settingsClass.ts` improvement_direction-block er allerede commented-out

**Lokation:** `tasks.md` §13.1

**Symptom:** Proposal §13.1 siger "I `src/Classes/settingsClass.ts:107`: fjern `improvementDirection`-read". Men koden på linje 104-113 er ALLEREDE en `/* ... */` block-comment.

**Verifikation:**

```typescript
// settingsClass.ts:104-113
/*
    if (this.settings[0].nhs_icons.show_assurance_icons) {
      const altTargetPresent: boolean = !isNullOrUndefined(this.settings[0].lines.alt_target);
      const improvementDirection: string = this.settings[0].outliers.improvement_direction;
      if (!altTargetPresent || improvementDirection === "neutral") {
        this.validationStatus.status = 1;
        ...
      }
    }
*/
```

Hele blokken er dead code allerede.

**Konsekvens:** Lav risiko, men proposal-tekst er teknisk forkert. Implementer kan blive forvirret når koden allerede er kommenteret ud.

**Foreslået fix:** Korriger task §13.1:

```
[ ] 13.1 I src/Classes/settingsClass.ts:104-113: fjern den udkommenterede 
        improvementDirection-validation-block (dead code; bliver irrelevant
        når improvement_direction-setting fjernes).
```

---

## H6 [MEDIUM] — Warning-limits-cascade rammer 13 chart-impls

**Lokation:** `tasks.md` §14 + `design.md` Decision 3

**Symptom:** Decision 3 siger "ll95/ul95/ll68/ul68 kan beholdes som beregning (de er trivielle)". Task §14.1 nævner kun `drawLines.ts`. **Risiko:** misforståelse om at ALLE 13 chart-impls (`c.ts`, `g.ts`, `i.ts`, `mr.ts`, `p.ts`, `pp.ts`, `s.ts`, `t.ts`, `u.ts`, `up.ts`, `xbar.ts`) skriver til `ll95`/`ul95`/`ll68`/`ul68`-felter i `controlLimitsObject`. Hvis beregningen beholdes, er felterne uændrede; men proposal-tekst antyder mulig cleanup.

**Verifikation:**

```
$ grep -l "ll95\|ll68\|ul95\|ul68" src/Limit\ Calculations/*.ts
src/Limit Calculations/c.ts
src/Limit Calculations/g.ts
src/Limit Calculations/i.ts
src/Limit Calculations/mr.ts
src/Limit Calculations/p.ts
src/Limit Calculations/pprime.ts
src/Limit Calculations/s.ts
src/Limit Calculations/t.ts
src/Limit Calculations/u.ts
src/Limit Calculations/uprime.ts
src/Limit Calculations/xbar.ts
(+ i_m.ts og i_mm.ts som slettes)
```

Plus 205 referencer totalt på tværs af src/.

**Konsekvens:** Hvis implementer fortolker "fjern warning-limits" bredt og rydder op i chart-impls, bryder de eksisterende beregninger (test-cases for de 13 chart-typer asserter ll95/ul95-værdier).

**Foreslået fix:** Skærp Decision 3 + task §14:

```
[ ] 14.1 Fjern fra src/D3 Plotting Functions/drawLines.ts: labels-push for "ll95",
        "ul95", "ll68", "ul68" i initialiseGroupedLines (linje 766-771).
        Fjern fra tableColumns-builder (viewModelClass.ts:632-635).
[ ] 14.2 BEHOLD ll95/ul95/ll68/ul68-felter i controlLimitsObject + de 13
        chart-impls' output. Beregningen er trivial og ændring ville bryde
        eksisterende test-asserts. Felterne bliver "computed-but-unrendered".
[ ] 14.3 Skriv kommentar i drawLines.ts der noterer at warning-limits computed
        men ej renderes (F2-design-decision).
```

---

## M1 [MEDIUM] — Anhøj long-run + outside_control_limits race-condition i coloring

**Lokation:** `tasks.md` §8.2

**Symptom:** F2 fjerner shift/trend/two_in_three-coloring-grene og erstatter astpoint-coloring med outside_control_limits-coloring. F1 tilføjede anhoj_long_run-coloring (separat gren). Efter F2 er der to coloring-grene tilbage:

```typescript
if (outliers.outside_control_limits[i] !== "none") { ... colour = ... }
if (outliers.anhoj_long_run[i] !== "none")        { ... colour = ... }
```

Hvis BÅDE er sande på samme punkt, **rækkefølgen** afgør final color. Aktuel kode-rækkefølge (efter F1) er anhoj_long_run SIDST → vinder. Efter F2 (når astronomical → outside_control_limits) er det uklart hvor i rækkefølgen den ender.

**Verifikation:** F1's nuværende coloring-loop (viewModelClass.ts:649-686): shift → trend → two_in_three → astpoint → anhoj_long_run. Med fjernelser efter F2: outside_control_limits → anhoj_long_run. Sidste vinder.

**Konsekvens:** Visuel beslutning: skal "outside-control-limits" eller "anhoj-long-run" vinde når begge fires på samme punkt? Et punkt der både er > UCL OG del af en long-run vil typisk være vigtigere som outlier (3σ-overskridelse er kraftigere signal end mønster-baseret run).

**Foreslået fix:** Tilføj task §8.4 + design-decision:

```
[ ] 8.4 Coloring-præcedens: bestem rækkefølge mellem outside_control_limits og
        anhoj_long_run når begge fires. Anbefaling: outside_control_limits
        SIDST (vinder) — 3σ-overskridelse er stærkere signal end Anhøj-run.
        Dokumentér i comment.
```

---

## M2 [LOW] — Test-anhojVsShift.ts skal slettes (proposal-implicit)

**Lokation:** `tasks.md` §2.5

**Symptom:** §2.5 nævner sletning af test-shift.ts m.fl. men ej eksplicit `test/Outlier Flagging/test-anhojVsShift.ts` som blev tilføjet i F1. Den importerer både shift + anhojLongRun og falder uden shift.

**Verifikation:** F1 commit 78beccd tilføjede `test-anhojVsShift.ts`. Filen findes nu i `test/Outlier Flagging/`.

**Konsekvens:** Glemt-sletning → karma vil fejle ved import-error.

**Foreslået fix:** Eksplicit nævn i §2.5 (er allerede delvist nævnt i §15.2 — bare flyt frem eller dedupliker).

---

## L1 [LOW] — `process_flag_type` referencer ud over settings + flagOutliers

**Lokation:** `tasks.md` §13.2

**Symptom:** §13.2 siger "Søg hele codebase for `process_flag_type` + `improvement_direction`". Proaktiv guidance, men ingen konkret liste. Verifikation:

```
src/Classes/settingsClass.ts:107  (commented-out — H5)
src/Outlier Flagging/assuranceIconToDraw.ts:26  (slettes — §3.4)
src/Outlier Flagging/variationIconsToDraw.ts:17  (slettes — §3.5)
src/Classes/viewModelClass.ts:836+ (flagOutliers — §7.3)
```

Alle hits enten i filer der allerede slettes eller i flagOutliers (§7.3). Ej overflow.

**Konsekvens:** Ingen — informativ note.

**Foreslået fix:** Erstat §13.2 med konkret liste eller drop (allerede dækket).

---

## Sammenfatning

| ID | Severity | Krav før implementation |
|----|----------|------------------------|
| H1 | HIGH | Tilføj drawSummaryTable.ts cleanup-task + beslut summary-table-icon-skæbne |
| H2 | HIGH | Eksplicit udvid §7.4 + §8 med summaryTableRowData + tableColumns-cleanup |
| H3 | HIGH | Tilføj advarsel om `lines.show_trend` ≠ `outliers.trend`-rule |
| H4 | MEDIUM | Tilføj barrel-cleanup-task §5.4 |
| H5 | MEDIUM | Korriger §13.1 — koden er allerede commented-out |
| H6 | MEDIUM | Skærp §14 — bevar beregning, fjern kun rendering |
| M1 | MEDIUM | Tilføj coloring-præcedens-beslutning §8.4 |
| M2 | LOW | Dedup §2.5 vs §15.2 — test-anhojVsShift.ts |
| L1 | LOW | Drop §13.2 eller udskift med konkret liste |

**Status:** 3 HIGH-fund blocker apply-precision. Proposal kræver mindre revision før implementation kan begynde.

**Næste skridt:** Codex adversarial-review trigger fired på multiple kriterier (file-list claims med line-numbers, cross-component contracts, executable cleanup-recipes, downstream-consumer-mapping).

---

## Codex adversarial-review konsekvens (2026-05-19)

**Verdict:** no-ship. Codex confirmed H1, H6, M1, M2; recalibrated H2 + H5; dismissed H3; tilføjede 2 nye HIGH-fund + 1 process-flag.

### Bekræftet (verified empirisk denne reconcile)

**Codex N1 (NEW HIGH) — `buildTooltip.ts` er missed consumer:**

Verificeret via grep:

```typescript
// src/Functions/buildTooltip.ts
27: const ast_limit: string = inputSettings.outliers.astronomical_limit;
28: const two_in_three_limit: string = inputSettings.outliers.two_in_three_limit;
60: displayName: inputSettings.lines.ttip_label_trend,
61: value: formatValues(table_row.trend_line, "value")      // trend_line = OK (lines.show_trend)
111: if ([table_row.astpoint, table_row.trend, table_row.shift, table_row.two_in_three].some(d => d !== "none")) {
113:   if (table_row.astpoint !== "none") { ... }
121:   if (table_row.trend !== "none") { patterns.push("Trend") }
122:   if (table_row.shift !== "none") { patterns.push("Shift") }
123:   if (table_row.two_in_three !== "none") { ... }
126:   if (two_in_three_limit !== "2 Sigma") { ... }
127:   flag_text = `${flag_text} (${two_in_three_limit})`;
```

**Konsekvens:** Min H2 missede tooltip-laget helt. Uden cleanup vil tooltips enten:
- Fejle TypeScript-compile (referencer fjernede settings + table_row-felter)
- Vise outdated rule-navne ("Astronomical Point", "Shift", "Trend", "Two-In-Three") som ej længere fires

Pattern-detection-blokken (linje 111-127) skal omskrives til Anhøj-rules (outside_control_limits + anhoj_long_run).

**Codex N2 (NEW HIGH) — `settingsClass.ts:96-102` ACTIVE validation, ej commented:**

Verificeret:

```typescript
// settingsClass.ts:96-102 (NOT commented out)
if (this.settings[0].nhs_icons.show_variation_icons) {
  const patterns: string[] = ["astronomical", "shift", "trend", "two_in_three"];
  const anyOutlierPatterns: boolean = patterns.some(d => this.settings[0].outliers[d]);
  if (!anyOutlierPatterns) {
    this.validationStatus.status = 1;
    this.validationStatus.error = "Variation icons require at least one outlier pattern to be selected";
  }
}
```

Min H5 var **forkert** — jeg så kun den commented-out blok ved linje 104-113 og missede den AKTIVE validation-blok lige over. F2-fjernelser bryder denne kompile/runtime.

**Konsekvens:** Når `nhs_icons` + `outliers.{shift, trend, two_in_three}`-toggles fjernes fra settings.ts, vil settingsClass.ts:96-102 give compile-fejl (manglende settings.nhs_icons + outliers-felter) eller silent stale-validation.

**H1 CONFIRMED + utdypet — grouped summary-table icon-pipeline større end forventet:**

Codex: viewModelClass.ts:485-566 har grouped-summary-table-logic der:
- Tilføjer `variation`/`assurance`-kolonner fra `nhs_icons`-settings
- Kalder `variationIconsToDraw` + `assuranceIconToDraw`
- Filtrerer rows baseret på icon-class
- Skriver icon-værdier ind i row-data

Bekræftet ved at sammenligne med min tidligere read af viewModelClass.ts:515 + 533 (kun kalde-sites). Selve grouped-summary-pipelinen er ej mit H1's primære fokus. Større cleanup end §3 + §9 i proposal antyder.

**Codex N3 (NEW MEDIUM) — capabilities.json indeholder fuld schema for fjernede settings:**

Verificeret via grep i capabilities.json:

```
102:  process_flag_type
105:  improvement_direction
108:  astronomical, 111: astronomical_limit
128-143: shift + shift_n + 4 farve-keys
146-161: trend + trend_n + 4 farve-keys
164-170: two_in_three + variants
189:  nhs_icons section
295:  show_95
298:  show_68
391:  ttip_show_95
394:  ttip_show_68
406:  ttip_show_trend  ← BEVARES (trend-line, ej trend-rule)
451:  ttip_label_trend ← BEVARES
```

Min proposal §12.3 sagde "if listed" — turns out fully listed. capabilities.json's schema-rensning er en separat større task.

**Konsekvens:** Stale capabilities.json deklarerer settings der ej eksisterer i settings.ts → Power BI's runtime-binding kan fejle eller markere settings som "unknown".

**Codex N4 (NEW PROCESS) — PR-strategi: F2 stacked on F1 = review-risk:**

Verificeret via `git log`: F2-branch er på commit 2cc30c2 (F1's HEAD). main er på a793c2b. F2 PR mod main ville inkludere F1's 4 commits.

**Konsekvens:**
- Reviewers ser F1 + F2 sammenblandet
- F2-specific regressioner masked
- CI kører på F1 + F2 kombineret, så F2 alone ej testet

### Recalibreret

**H2 RECALIBRATED — udvid med `buildTooltip` + `settingsClass`:**

Min H2 fandt downstream-consumers i `viewModelClass.ts` men missede `buildTooltip.ts` + den aktive validation-blok i `settingsClass.ts`. Total downstream-set er bredere end først rapporteret.

**H5 RECALIBRATED — proposal-fix vendt om:**

Jeg sagde "code allerede commented out". Korrektion: KUN linje 104-113 er commented. Linje 96-102 er AKTIV og kræver eksplicit task.

### Dismissed

**H3 — `lines.show_trend` ej i risiko, men advarsel bevares:**

Codex bekræfter at `lines.show_trend` + `trend_line` + `calculateTrendLine` skal forblive. Min H3 var korrekt at advare om conflation. Status: confirmed pedagogically.

### Impact-bucketing

| Bucket | Findings |
|--------|----------|
| **Hard runtime-crash** | Codex N2 (settingsClass active validation breaks compile) |
| **Silent semantic-drift** | Codex N1 (buildTooltip viser outdated rule-navne), Codex N3 (stale capabilities.json) |
| **False-confidence / process** | Codex N4 (PR-strategi — review-risk), H1 (grouped-summary-table-cleanup-scope) |
| **Sub-optimal / cleanup** | H5 recalibrered (kun teknisk fejl i proposal-tekst) |

2 hard/silent + 2 process = solid ROI for én Codex-pass. Empirical verification reproduced all 5 new claims.

### Læring (capture for memory)

1. **Tooltip-laget er en separat consumer-overflade**. Når jeg lister "downstream-consumers af outliersObject", søger jeg typisk efter `outliers\.X` i src/Classes/. Tooltip-koden læser via `table_row.X` + `inputSettings.outliers.X` — to forskellige patterns jeg ej fangede.

2. **Active vs commented validation-blocks: tjek SCAN, ej kun blockes jeg "ser"**. Da jeg så `/* ... */` ved linje 104-113 antog jeg HELE improvement_direction-blokken var commented. Den AKTIVE blok lige over var en separat enhed.

3. **capabilities.json er en separat schema-overflade**. Settings.ts er TypeScript-driven UI; capabilities.json er Power BI's persisted schema. De er separate dokumenter med deres egne cleanup-cycles. Husk altid begge.

### Sammenfatning post-Codex

| ID | Severity (post-Codex) | Status |
|----|----------------------|--------|
| H1 | HIGH | Confirmed — udvid scope til grouped-summary-table-pipeline |
| H2 | HIGH | Recalibreret — tilføj buildTooltip + settingsClass:96-102 |
| H3 | LOW (warning) | Dismissed som blocker; bevares som pedagogical note |
| H4 | MEDIUM | Confirmed — barrel cleanup task |
| H5 | LOW | Recalibreret — proposal-tekst-fejl; aktiv-blok-fix flyttet til Codex N2 |
| H6 | MEDIUM | Confirmed — bevar beregning, fjern kun rendering + verify tests |
| M1 | MEDIUM | Confirmed — coloring-præcedens-beslutning |
| M2 | LOW | Confirmed — dedup |
| Codex N1 | HIGH | Verified — buildTooltip cleanup nødvendig |
| Codex N2 | HIGH | Verified — settingsClass:96-102 active validation cleanup |
| Codex N3 | MEDIUM | Verified — capabilities.json schema-cleanup |
| Codex N4 | PROCESS | F2 PR-strategi: vent på F1-merge eller stacked-PR |

**Proposal-revision nødvendig før apply.** 4 HIGH (H1/H2 udvidet + N1/N2) udvider scope betragteligt.
