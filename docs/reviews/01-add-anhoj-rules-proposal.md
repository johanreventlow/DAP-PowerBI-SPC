# Cycle 1 — Review af `add-anhoj-rules`-proposal

**Dato:** 2026-05-19
**Reviewer:** Claude (Phase 1)
**Target:** `openspec/changes/add-anhoj-rules/{proposal.md, design.md, tasks.md, specs/}`
**Trigger for cycle:** Ny OpenSpec-proposal; first-pass-review før implementation begynder.

---

## H1 [HIGH] — I-chart default-skift peger på forkert mekanisme

**Lokation:** `design.md` Decision 5 + `tasks.md` §8

**Symptom:** Proposal beskriver at "I-chart default skiftes til `i_mm`" ved at "I `src/Limit Calculations/index.ts`: route I-chart-requests til `immLimits` i stedet for `iLimits`." Men `Limit Calculations/index.ts` er en pur barrel-export, ikke en routing-fil. Routing-mekanismen er ej hvad proposal beskriver.

**Verifikation:**

```typescript
// src/Limit Calculations/index.ts (faktisk indhold)
export { default as i } from "./i"
export { default as i_m } from "./i_m"
export { default as i_mm } from "./i_mm"

// src/settings.ts:136-140 (chart_type er en USER-FACING DROPDOWN)
chart_type: {
  default: "i",
  valid: ["run", "i", "i_m", "i_mm", "mr", "p", "pp", "u", "up", "c", ...],
  items: [
    { displayName : "i - Individual Measurements",                       value : "i" },
    { displayName : "i_m - Individual Measurements: Median centerline",  value : "i_m" },
    { displayName : "i_mm - Individual Measurements: Median centerline, Median MR Limits",  value : "i_mm" },
    ...
  ]
}

// src/Classes/viewModelClass.ts:370-371 (dispatch)
const limitFunction = limitFunctions[inputSettings.spc.chart_type];
```

Brugeren vælger eksplicit `"i"` vs `"i_m"` vs `"i_mm"` fra en dropdown. De er co-equal chart-typer, ej alternative impls af samme chart.

**Konsekvens:** Proposal har to inkompatible fortolkninger der ej er adskilt:

| Fortolkning | Hvor | Impact |
|-------------|------|--------|
| (A) Skift dropdown-default fra `"i"` til `"i_mm"` (settings.ts:139) | `tasks.md` §8.1 antyder dette | Kun nye visuals. Eksisterende rapporter med eksplicit `chart_type = "i"` beholder mean-centerline |
| (B) Lav `"i"`-key til alias for `immLimits` | `design.md` "Migration" antyder dette ("eksisterende rapporter ser ny centerline ved næste åbning") | Silent runtime-breakage af eksisterende rapporter |

Proposal er inkonsistent: design.md-migration-tekst matcher (B), tasks.md matcher (A).

**Foreslået fix:** Vælg eksplicit (A). Lav design.md §5 + tasks.md §8 entydige:

- Tasks.md §8.1: "I `src/settings.ts:139`: ændr `chart_type.default` fra `"i"` til `"i_mm"`. Ingen routing-ændringer."
- Design.md §5: omskriv migration-sektion: "Kun nye visuals affecteres. Eksisterende rapporter med `chart_type = "i"` beholder mean-centerline indtil F2 fjerner `"i"` + `"i_m"` fra valid-listen."

---

## H2 [HIGH] — Centerline-rendering peger på forkert fil

**Lokation:** `design.md` Decision 3 + `tasks.md` §9

**Symptom:** Proposal siger "Find centerline-renderer i `src/D3 Plotting Functions/D3 Modules/`". `D3 Modules/` indeholder kun en re-export af d3-libs — ingen rendering-logik.

**Verifikation:**

```typescript
// src/D3 Plotting Functions/D3 Modules/index.ts (eneste fil)
export { select, selectAll, type Selection, type BaseType } from "d3-selection";
export { line, symbol, ... } from "d3-shape"
export { type Axis, axisBottom, axisLeft } from "d3-axis"
export { type ScaleLinear, scaleLinear, ... } from "d3-scale"
export { drag } from "d3-drag"

// src/D3 Plotting Functions/drawLines.ts:59 (faktisk centerline-rendering)
.attr("stroke-dasharray", (d: lineData) =>
  getAesthetic(currLine, "lines", "type",
               { lines: d.aesthetics } as defaultSettingsType))
```

Stiplet-stil styres allerede dynamisk per linje-type via `getAesthetic`-lookup mod brugerens `lines.type`-setting (solid/dashed/dotted). Eksisterende mekanisme.

**Konsekvens:** Implementer leder forkert sted. Worse: forstår ej at stiplet allerede er en konfigurerbar per-linje-aesthetic — så foreslået "tilføj `dashed: boolean`-parameter" duplikerer eksisterende mekanisme.

**Foreslået fix:**

- Tasks.md §9.1: ret til `src/D3 Plotting Functions/drawLines.ts:59`
- Implementations-strategi: efter eksisterende `stroke-dasharray`-assignment, tilføj override:

```typescript
// Pseudo, ej committet kode:
.attr("stroke-dasharray", (d: lineData) => {
  const userSetting = getAesthetic(currLine, "lines", "type", ...);
  if (currLine === "targets") {
    const globalSignals = visualObj.viewModel.outliers?.[i]?.globalSignals;
    if (globalSignals?.longRun || globalSignals?.fewCrossings) {
      return "4 2";  // tving stiplet uanset bruger-valg
    }
  }
  return userSetting;
})
```

(Behov for at `outliers[i]` er tilgængelig i scope — verificér i drawLines.ts hvor `currLine` itererer.)

---

## H3 [MEDIUM] — Tasks mangler eksport af nye regler i `Outlier Flagging/index.ts`

**Lokation:** `tasks.md` §3 + §4

**Symptom:** Tasks beskriver oprettelse af `anhojLongRun.ts` + `anhojFewCrossings.ts` filer + tests, men ingen task siger at de skal tilføjes til `src/Outlier Flagging/index.ts` (barrel-export).

**Verifikation:**

```typescript
// src/Outlier Flagging/index.ts (current)
export { default as astronomical } from "./astronomical"
export { default as shift } from "./shift"
export { default as trend } from "./trend"
export { default as twoInThree } from "./twoInThree"
```

Eksisterende regler er alle barrel-eksporteret. `viewModelClass.ts` importerer dem som named imports via denne barrel.

**Konsekvens:** Uden tilføjelse til barrel kan Anhøj-reglerne ej importeres med standard-pattern. Implementer skal selv opdage hullet — risk for inconsistent import-stil.

**Foreslået fix:** Tilføj task §3.1.b og §4.1.b:

```
[ ] 3.1.b Tilføj eksport i src/Outlier Flagging/index.ts:
        export { default as anhojLongRun } from "./anhojLongRun"
[ ] 4.1.b Tilføj eksport i src/Outlier Flagging/index.ts:
        export { default as anhojFewCrossings } from "./anhojFewCrossings"
```

---

## H4 [HIGH] — Bypass af direction-mapping løser ej coloring-problemet

**Lokation:** `outlier-detection/spec.md` "Anhøj Flags Bypass Direction Mapping" + `design.md` Decision 4

**Symptom:** Spec siger Anhøj-flags MUST NOT mappes gennem `checkFlagDirection`, og dermed bevarer `"upper"/"lower"`-værdier. Men coloring drives af `getAesthetic(flag, "outliers", ...)`-kald i `viewModelClass.ts:640-658`, og `getAesthetic` look'er farve op baseret på flag-string. Flag-værdier `"upper"`/`"lower"` matcher ej eksisterende farve-keys.

**Verifikation:**

```typescript
// src/Classes/viewModelClass.ts:640-658
if (outliers.shift[i] !== "none") {
  aesthetics.colour = getAesthetic(outliers.shift[i], "outliers",
                                    `shift_${process_flag_type}`, ...);
}
if (outliers.trend[i] !== "none") {
  aesthetics.colour = getAesthetic(outliers.trend[i], "outliers",
                                    `trend_${process_flag_type}`, ...);
}
// outliers.shift[i] er allerede mappet til "improvement"/"deterioration"/"neutral_high"/...
// af checkFlagDirection — det er disse strings getAesthetic look'er op
```

**Konsekvens:** Bypass'en bevarer `"upper"/"lower"`-flag-værdier, men `getAesthetic` har ingen farve-mapping for disse keys. Anhøj-flags risikerer at blive ufarvet (fallback til default) eller crash hvis `getAesthetic` throw'er på ukendt key.

**Foreslået fix:** To muligheder:

**(a) Map `"upper"/"lower"` til neutral-direction-strings før getAesthetic:**

```typescript
const neutralMap = { upper: "neutral_high", lower: "neutral_low" } as const;
if (outliers.anhoj_long_run[i] !== "none") {
  const flagKey = neutralMap[outliers.anhoj_long_run[i] as "upper" | "lower"];
  aesthetics.colour = getAesthetic(flagKey, "outliers", "anhoj_long_run", ...);
}
```

**(b) Lav `getAesthetic` `outliers`-config med eksplicit `"upper"`/`"lower"`-keys for anhoj-regler.** Kræver settings.ts color-factory-extension.

Begge løser problemet. (a) er minimal-impact. Vælg (a) som default + dokumentér i design.md.

**Yderligere konsekvens:** Tasks.md §6.3 ("bypass direction-mapping") er ufuldstændig — den må også inkludere coloring-strategien. Tilføj eksplicit task §6.4.

---

## M1 [MEDIUM] — Spec-scenario for I-chart har placeholder-tekst

**Lokation:** `centerline-calculation/spec.md`

**Symptom:**

```markdown
#### Scenario: I-chart bruger median centerline
- **WHEN** brugeren konfigurerer en I-chart med observationer `[3, 5, 7, 9, 11]`
- **THEN** centerline er `7` (medianen), ej `7` (som tilfældigvis også er mean i dette eksempel — vælg testdata hvor de adskiller sig)
```

Scenariet indeholder "vælg testdata hvor de adskiller sig" — instruktion til mig selv, ej færdig spec.

**Konsekvens:** Scenariet er ikke test-skrivbart som det står. Mean = median = 7 i `[3,5,7,9,11]` → ingen empirisk forskel at teste mod.

**Foreslået fix:** Erstat med konkret skæv-fordelt dataset:

```markdown
- **WHEN** brugeren konfigurerer en I-chart med observationer `[1, 2, 3, 4, 100]`
- **THEN** centerline er `3` (medianen), IKKE `22` (gennemsnittet)
```

---

## M2 [MEDIUM] — Backwards-compat-claim modsiger sig selv

**Lokation:** `proposal.md` "Impact > Backwards compatibility"

**Symptom:**

```
Backwards compatibility:
Additivt: alle eksisterende regler + UI fungerer uændret.
Eksisterende Power BI-rapporter kan åbnes uden datatab.
Brugere skal eksplicit aktivere Anhøj-regler via nye toggles for at se ny adfærd.

Undtagelse: I-chart skifter default-implementation fra mean til median.
Eksisterende rapporter der bruger I-chart vil se ny centerline + nye limits ved næste åbning.
```

"Alle eksisterende uændret" + "Undtagelse: I-chart skifter" — internt modsætningsfyldt.

**Konsekvens:** Læser bliver i tvivl om scope. Hvis H1's fortolkning (A) vælges, bortfalder undtagelsen — så hele undtagelses-tekst kan fjernes.

**Foreslået fix:** Sammenkobl med H1-fix. Hvis (A) vælges: fjern undtagelses-paragraf. Hvis (B) vælges: omformulér "alle uændret" til "alle outlier-regler uændret" + dokumentér I-chart-skift som forventet adfærd.

---

## M3 [LOW] — `qbinom` lineær-søgning ved store n

**Lokation:** `design.md` Decision 1

**Symptom:** Foreslået impl er "lineær søgning op fra k=0 indtil P(X ≤ k) ≥ p". For `n=1000, p=0.5` søger op til ~500 iterationer. Hver iteration akkumulerer binomial-PMF via `lgamma` — fp-fejl kan akkumulere over 500 termer.

**Konsekvens:** Numerisk korrekthed for store n er ej garanteret med naiv impl. Anhøj-use-case er typisk n < 200 så praktisk impact er lav, men spec-claim "test mod R med n=100, 500, 1000" risikerer false-failure.

**Foreslået fix:** Tilføj note i design.md §1: "Brug log-space-akkumulering for PMF eller normal-approximation for n > 100. Verificér mod R-output."

Lav-prioritet — kan udskydes til implementation-tid.

---

## L1 [LOW] — `globalSignals`-felt-navn skifter konvention

**Lokation:** `outlier-detection/spec.md` + `design.md`

**Symptom:** Andre felter i `outliersObject` er `snake_case` (`astpoint`, `two_in_three`, `trend`, `shift`, `anhoj_long_run`). Det nye felt `globalSignals` er `camelCase`.

**Konsekvens:** Inkonsistent navngivning forvirrer downstream-konsumenter.

**Foreslået fix:** Omdøb til `global_signals`. Konsekvent med eksisterende pattern. Indvendige felter (`longRun`, `fewCrossings`) er en separat sub-stylet sag, men `snake_case` (`long_run`, `few_crossings`) ville være mest konsekvent.

---

## Sammenfatning

| ID | Severity | Krav før implementation |
|----|----------|------------------------|
| H1 | HIGH | Ret design.md §5 + tasks.md §8 — vælg fortolkning (A) |
| H2 | HIGH | Ret tasks.md §9 til drawLines.ts:59 + implementations-skitse |
| H3 | MEDIUM | Tilføj barrel-export-tasks |
| H4 | HIGH | Tilføj coloring-mapping for `"upper"/"lower"` Anhøj-flags |
| M1 | MEDIUM | Erstat placeholder-data i I-chart scenario |
| M2 | MEDIUM | Sammenkobl med H1-fix |
| M3 | LOW | Note om numerisk præcision |
| L1 | LOW | Omdøb `globalSignals` → `global_signals` |

**Status:** 4 HIGH-fund blocker apply. Proposal kræver revision.

**Næste skridt:** Codex adversarial-review (trigger fired på flere kriterier: TS-kode-claims, line-numre, algoritme-formler, cross-component contracts).

---

## Codex adversarial-review konsekvens (2026-05-19)

**Verdict:** no-ship. Codex confirmed H1/H2/H4, dismissed H3, identificerede én ny HIGH-bug (point-level long-run-flagging strider mod qicharts2-kontrakt) + én severe scope-bug (per-group signal-aggregation).

### Bekræftet (verified empirisk denne reconcile)

**H1 RECALIBRATED — proposal indeholder falsk qicharts2-claim:**

Codex hævdede at qicharts2's `qic.i` bruger `mean()`, ej median. Verificeret via R-session 2026-05-19:

```r
> qicharts2:::qic.i
function (x) {
    base <- x$baseline & x$include
    if (anyNA(x$cl)) x$cl <- mean(x$y[base], na.rm = TRUE)    # MEAN, ej median
    mr <- abs(diff(x$y[base] - x$cl[base]))
    amr <- mean(mr, na.rm = TRUE)                               # MEAN MR, ej MMR
    ...
}
```

Min proposal claimer "I-chart median = Anhøj-method per qicharts2". Det er FALSK. qicharts2's `chart='i'` bruger mean-centerline + mean-MR-baseret 3-sigma. Min `i_mm.ts`-præference er en DESIGN-PRÆFERENCE, ej qicharts2-parity.

**Konsekvens:** H1-fix skal udvides:
- Tasks.md §8: ret default-skift mekanisme (settings.ts:139)
- Design.md §5: omformulér "Anhøj-method" → "robust I-chart variant" (PowerBI-SPC-specifik design-præference). Drop qicharts2-claim.
- Migration-paragraf: omformulér til (A)-fortolkning.

**H2 CONFIRMED + missed bug verified — multi-group dashed centerline:**

Codex's claim om at `lineData` mangler per-group-ref verificeret via `viewModelClass.ts:745-782`:

```typescript
formattedLines.push({
  x: controlLimits.keys[i].x,
  line_value: controlLimits[label]?.[i],
  group: label,                          // line-type ("targets"), ej data-group
  aesthetics: inputData.line_formatting[i]
})
this.groupedLines = groupBy(formattedLines, "group");  // grupperer per linje-type
```

`group`-feltet betegner linje-TYPE (`"targets"`, `"ll99"`, etc.), ej data-gruppe. Multi-group charts (split-charts, rebaseline) får ALLE segmenter af `targets`-linjen i samme flade array. drawLines har ingen mekanisme til at vide hvilken data-gruppe et givent segment tilhører.

**Konsekvens:** Hvis `outliers[0].globalSignals.fewCrossings = true` men `outliers[1].globalSignals.fewCrossings = false`, dasher proposal-strategien BEGGE gruppers centerlines. Multi-group-kontrol-charts (rebaseline efter intervention — kerne-use-case for BFH) over-rapporterer signal.

**H4 CONFIRMED — `getAesthetic` lookup-mismatch verificeret:**

Codex's claim: `getAesthetic("upper", "outliers", "anhoj_long_run_colour", ...)` konstruerer key `anhoj_long_run_colour_upper` som ej eksisterer i `createOutlierColours` (kun `_improvement`, `_deterioration`, `_neutral_low`, `_neutral_high`).

Verificeret tidligere via `getAesthetic.ts:18-21` + `settingsFactories.ts:193-217` (inspiceret af Codex).

**Konsekvens:** Anhøj-flags vil ej crash men fall through til default-farve (undefined eller fallback). Bruger-konfigureret Anhøj-farve har ingen effekt på `"upper"/"lower"`-flags.

**Codex M1 (ny finding) — qicharts2 leverer ej point-level long-run-data:**

Verificeret via R-session:

```r
> qicharts2:::runs.analysis
function (x, method) {
    ...
    runs.signal <- crsignal(n.useful, n.crossings, longest.run, method = method)
    ...
    x$runs.signal <- runs.signal           # SCALAR per part
    x$longest.run <- longest.run           # SCALAR
    x$n.crossings <- n.crossings           # SCALAR
    return(x)
}
```

qicharts2 returnerer GLOBALE skalarværdier per chart-part. Ingen point-level run-membership-data. Min spec siger "MUST flag de specifikke run-punkter med deres side" — det er en PowerBI-SPC-specifik UDVIDELSE, ej qicharts2-parity.

**Konsekvens:** Mit fixture-set kan ej canonically asserte hvilke specifikke punkter tilhører "det længste run" — qicharts2 leverer ej den info. Tie-cases (flere runs af samme længde 8) er specielt udefineret.

### Recalibreret

**H3 DISMISSED af Codex — verified denne reconcile:**

Codex sagde "current imports do not depend on the barrel". Verificeret via `grep ^import src/Classes/viewModelClass.ts`:

```typescript
import astronomical from "../Outlier Flagging/astronomical";  // direct path, ej barrel
import trend from "../Outlier Flagging/trend";
import shift from "../Outlier Flagging/shift";
import twoInThree from "../Outlier Flagging/twoInThree";
```

Barrel `Outlier Flagging/index.ts` eksisterer men bruges ej af `viewModelClass.ts`. Min H3 var korrekt på faktum (barrel mangler eksports) men forkert på severity — det er IKKE blocker.

H3 → LOW (dropped fra implementation-task; nice-to-have for fremtidig refactor).

**M1 + M2 — afhænger af H1:**

Hvis H1-fix vælger (A) entydigt, bortfalder M2 (backwards-compat-modsigelse) automatisk. M1 er stadig en konkret tekst-fix.

### Recalibrerede fix-strategier

**Ny strategi for centerline-dashing (erstatter H2 fix):**

Tilføj per-segment-signal-info til `lineData`:

```typescript
type lineData = {
  x: number;
  line_value: number;
  group: string;
  aesthetics: ...;
  group_signal_dashed?: boolean;   // ny: per-segment dashed-state
}
```

I `initialiseGroupedLines` (linje 753): map controlLimits.keys[i] → data-gruppe-idx via groupStartEndIndexes, slå `outliers[groupIdx].globalSignals` op, og embed `group_signal_dashed` for hvert segment. drawLines.ts:59 ser så signal-state direkte i `d`.

**Ny strategi for Anhøj-coloring (erstatter H4 fix):**

Pre-map `"upper"/"lower"` til `"neutral_high"/"neutral_low"` FØR `getAesthetic`-call:

```typescript
// I viewModelClass.ts, ny gren for Anhøj-flags i drawDots-loop:
if (outliers.anhoj_long_run[i] !== "none") {
  const neutralFlag = outliers.anhoj_long_run[i] === "upper" ? "neutral_high" : "neutral_low";
  aesthetics.colour = getAesthetic(neutralFlag, "outliers", "anhoj_long_run_colour", settings);
  aesthetics.colour_outline = getAesthetic(neutralFlag, "outliers", "anhoj_long_run_colour", settings);
}
```

Bruger eksisterende `_neutral_high` / `_neutral_low` farve-keys (allerede defineret i `createOutlierColours`).

**Ny rammesætning for fixture-contract (Codex M1):**

Split fixtures i to lag:

- **Lag 1 (qicharts2-parity):** `n_useful`, `longest_run`, `longest_run_max`, `n_crossings`, `n_crossings_min`, `long_run_signal`, `few_crossings_signal`. Disse kan asserteres direkte mod qicharts2-output.
- **Lag 2 (PowerBI-SPC-specifik):** Hvilke punkter flagges af `anhojLongRun`. Egen contract — ej qicharts2-parity. Spec skal definere tie-handling (multiple runs af max-length → flag alle? Kun første?), centerline-ties (punkter på median skipped men hvad med segmenter omkring?).

Specs skal opdateres til at adskille de to lag.

### Impact-bucketing

| Bucket | Findings |
|--------|----------|
| **Hard runtime-crash** | Ingen (alle fund er semantic/silent) |
| **Silent semantic-drift** | H1 (forkert qicharts2-claim leder til forkert test-baseline), H2 (multi-group over-dashing), Codex M1 (point-level fixture-claims) |
| **False-confidence / process guard** | H4 (coloring uden visuel feedback at noget er forkert) |
| **Sub-optimal / cleanup** | H3 (barrel ikke brugt), L1 (camelCase-inconsistens) |

3 silent-drift + 1 false-confidence = blocker-set. H3/L1 = post-implementation cleanup.

### Læring (fanget for fremtid)

1. **Verificér tredjeparts-referencer EMPIRISK, ej ved hukommelse.** Min claim "qicharts2 bruger median for I-chart" var falsk og var letverificerbar via R-session. Kør referenceimpl FØR proposal-claims om dens adfærd.

2. **lineData-struktur lærer: groupBy efter line-TYPE, ej data-GROUP.** Når ny signal-state skal renderes per data-gruppe, kræver det embed i lineData (eller separat per-gruppe metadata-array). Cross-cutting concern.

3. **Trigger-baseret Codex var korrekt valg:** 4 confirmed + 1 ny bug er high-ROI for én ~5min-pass. Specifikt: empiriske claims om tredjeparts-bibliotek (qicharts2) + cross-component contracts (lineData → drawLines → outliers) er klassiske Codex-styrkeområder.

### Sammenfatning post-Codex

| ID | Severity (post-Codex) | Status |
|----|----------------------|--------|
| H1 | HIGH | Recalibreret — udvid fix til at fjerne falsk qicharts2-claim |
| H2 | HIGH | Confirmed + missed bug (multi-group) — kræver lineData-extension |
| H3 | LOW | Dismissed som blocker (barrel ej brugt) |
| H4 | HIGH | Confirmed — pre-map til neutral keys |
| Codex M1 | HIGH | Ny — split fixture-contract i 2 lag |
| M1 (placeholder-tekst) | MEDIUM | Uændret — konkret fix klar |
| M2 (backwards-compat-modsigelse) | MEDIUM | Bortfalder ved H1 (A)-fix |
| M3 (qbinom numerik) | LOW | Note tilføjes ved implementation |
| L1 (camelCase) | LOW | Cleanup ved revision |

**Proposal-revision nødvendig før apply.** 4 HIGH (H1/H2/H4/Codex M1) ændrer arkitektoniske beslutninger.
