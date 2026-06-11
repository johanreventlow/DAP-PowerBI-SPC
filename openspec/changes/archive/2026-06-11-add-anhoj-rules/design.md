# Design — Add Anhøj Rules

## Context

Eksisterende `flagOutliers` i `src/Classes/viewModelClass.ts` har en ren API: hver regel er en funktion `(val, ...) => ("upper" | "lower" | "none")[]` af samme længde som input. Resultatet samles i `outliersObject` med ét felt per regel. Flags farves bagefter via `checkFlagDirection`-mapping baseret på `improvement_direction`-setting.

Anhøj-reglerne passer **delvist** i denne model:

| Regel | Naturlig form | Passer i punkt-API? |
|-------|---------------|---------------------|
| Long run | Punkter i det specifikke run flagges | ✓ Ja |
| Few crossings | Global egenskab ved hele serien | ✗ Nej |

Derudover er Anhøj-reglerne **direktionsagnostiske** — de signalerer "uventet mønster", ikke "forbedring/forværring". `checkFlagDirection`-mappingen er filosofisk inkompatibel med Anhøj.

## Goals / Non-Goals

### Goals

- Implementér long-run + few-crossings korrekt iht. `qicharts2`-referencen
- Bevar punkt-flag-API for long-run (genbruger eksisterende rendering)
- Etablér global-signal-kanal for few-crossings (ny mekanisme)
- Bevar fungerende eksisterende regler og UI uændret
- TypeScript-output skal matche `qicharts2`-fixture-output eksakt på 14 reference-cases

### Non-Goals

- Fjernelse af eksisterende regler (separat F2-change)
- Differentiering af stiplet-stil baseret på hvilken global signal der fires (signalerne er korrelerede; visuel ensartethed prioriteres)
- Konfigurerbar tærskel for long-run / few-crossings (formler er fastlagte i Anhøj-metoden)

## Decisions

### Decision 1: `qbinom`-implementation — egen via `lgamma`

**Hvad:** Implementér `qbinom(p, n, prob)` for fast `prob=0.5` (det eneste case Anhøj bruger) ved at:
1. Beregne kumulativ CDF via `lgamma`-baseret binomialkoefficient
2. Lineær søgning op fra `k=0` indtil `P(X ≤ k) ≥ p`

**Hvorfor:** Repo'et har allerede `src/Functions/lgamma.ts` + `gamma.ts` + statistiske helpers. Tilføjelse af `jstat`-dep er overkill (>200KB bundle-impact for én funktion). For `n_useful ≤ ~200` (kliniske SPC-datasæt) er lineær søgning langt under 1ms.

**Alternativer overvejet:**
- Lookup-tabel for `n=10..1000` — fungerer men gemmer "magi-tal" uden formel-evidens
- `jstat`-dep — bundle-vægt + dependency-risiko
- Approksimation via Wilson-interval — mindre præcis ved små `n`

**Risiko:** Numerisk præcision for store `n` (>500). Mitigation: test mod `qbinom` i R med `n=100, 500, 1000`.

### Decision 2: Global signal-kanal i `outliersObject` (per-group)

**Hvad:** Udvid `outliersObject` med nyt felt (snake_case for konsistens):

```typescript
type outliersObject = {
  // eksisterende felter
  astpoint: string[];
  two_in_three: string[];
  trend: string[];
  shift: string[];
  // nye felter
  anhoj_long_run: string[];         // punkt-flags ("upper"/"lower"/"none")
  global_signals: {
    long_run: boolean;                // global per gruppe
    few_crossings: boolean;
  };
};
```

**Per-group-semantik:** `viewModelClass.outliers` er allerede `outliersObject[]` med én entry per data-gruppe (linje 157, 319). `global_signals` lever på SAMME niveau som punkt-flag-arrays — én værdi per gruppe, ej chart-wide aggregeret.

**Hvorfor:** Few-crossings er ej naturligt punkt-baseret. Per-group lagring matcher eksisterende outlier-array-struktur og giver drawLines-laget mulighed for at dashe centerline KUN for de gruppers segmenter der har signal — uden at over-dashe andre gruppers segmenter (multi-group/rebaseline-charts).

**Konsekvens:** `flagOutliers`-loop bevarer eksisterende per-group-iteration via `groupStartEndIndexes`. Hver gruppe får sit eget `global_signals`-objekt beregnet over kun den gruppes punkter.

### Decision 2b: Per-segment signal-state i `lineData`

**Hvad:** Udvid `lineData`-type (viewModelClass.ts:33-42) med valgfrit felt:

```typescript
type lineData = {
  x: number;
  line_value: number;
  group: string;                          // linje-TYPE ("targets", "ll99", etc.)
  aesthetics: ...;
  group_signal_dashed?: boolean;          // NYT: er segmentets data-gruppe i signal-state?
};
```

I `initialiseGroupedLines` (linje 753-782): for hver `controlLimits.keys[i]`, find data-gruppe-idx via `groupStartEndIndexes`, slå `outliers[groupIdx].global_signals` op, og sæt `group_signal_dashed = global_signals.long_run || global_signals.few_crossings` på hver pushed `lineData`-entry.

**Hvorfor:** `groupedLines` flattener alle gruppers `targets`-segmenter ind i ét flat array per linje-type. drawLines.ts har ingen reference tilbage til hvilken data-gruppe et givet segment kommer fra. Embed signal-state direkte på segment-niveau.

**Alternativer overvejet:**
- Aggregér global_signals chart-wide → multi-group-charts over-rapporterer signal (afvist)
- Tilføj `group_idx`-felt til lineData + lookup i drawLines → komplekserer drawLines-scope (afvist)
- Embed `group_signal_dashed` direkte → minimal drawLines-ændring (valgt)

### Decision 3: Stiplet centerline override i drawLines

**Hvad:** I `src/D3 Plotting Functions/drawLines.ts:59` overrider `stroke-dasharray`-callback bruger-aesthetic for `targets`-linje hvis segmentets `group_signal_dashed === true`:

```typescript
.attr("stroke-dasharray", (d: lineData) => {
  const userSetting = getAesthetic(currLine, "lines", "type",
                                    { lines: d.aesthetics } as defaultSettingsType);
  if (currLine === "targets" && d.group_signal_dashed) {
    return "4 2";  // tving stiplet uanset bruger-valg
  }
  return userSetting;
})
```

**Hvorfor:** Matcher `qicharts2`-konvention + BFH's tradition ("stiplet linje signalerer ikke-tilfældig variation"). Per-segment-evaluering via `lineData.group_signal_dashed` sikrer at multi-group-charts kun dasher de segmenter hvor signal faktisk er udløst.

**Alternativer overvejet:**
- Tilføj separat `dashed`-parameter til hele drawLines-funktionen — kollapser per-segment-information til chart-wide flag (afvist)
- Banner/badge ovenfor chart — bryder eksisterende layout
- Farve centerline rødt — kolliderer med outlier-farver
- Forskellig stil for long-run vs few-crossings — signalerne korrelerer naturligt; visuel støj uden semantisk værdi

### Decision 4: Bypass `checkFlagDirection` + pre-map til neutral keys

**Hvad:** To koordinerede ændringer:

**(a) Bypass mapping i `flagOutliers`'s post-loop:**

```typescript
Object.keys(outliers).forEach(key => {
  if (key === "anhoj_long_run" || key === "global_signals") return;
  // eksisterende mapping for andre regler...
});
```

**(b) Pre-map `"upper"`/`"lower"` til neutral keys ved coloring-lookup** (i drawDots- el. tilsvarende point-aesthetic-iteration, viewModelClass.ts:640-660 nær eksisterende outlier-grene):

```typescript
if (outliers.anhoj_long_run[i] !== "none") {
  const neutralFlag = outliers.anhoj_long_run[i] === "upper"
                        ? "neutral_high"
                        : "neutral_low";
  aesthetics.colour = getAesthetic(neutralFlag, "outliers", "anhoj_long_run_colour", settings);
  aesthetics.colour_outline = getAesthetic(neutralFlag, "outliers", "anhoj_long_run_colour", settings);
}
```

**Hvorfor:** Anhøj-reglerne er direktionsagnostiske, men bevarer side-information (`"upper"`/`"lower"`) for at brugeren kan farve over- og under-median-punkter forskelligt hvis ønsket. `getAesthetic` look'er farve op via `${flag}` som suffix på den color-key-base (`anhoj_long_run_colour_${flag}`). Hvis `flag = "upper"`, leder den efter `anhoj_long_run_colour_upper` — som ej eksisterer i `createOutlierColours` (kun `_improvement`/`_deterioration`/`_neutral_high`/`_neutral_low` suffixes findes).

Pre-mapping til `"neutral_high"`/`"neutral_low"` genbruger EKSISTERENDE color-suffix-system og kræver ingen ændringer i `createOutlierColours`.

**Alternativer overvejet:**
- Udvid `createOutlierColours` med `_upper`/`_lower`-suffixes — kræver settings-skema-ændring og inkonsistens med andre regler (afvist)
- Lad Anhøj-flags falde gennem til default-farve — silent visual bug (afvist)
- Pre-map til `"neutral_high"`/`"neutral_low"` — genbruger eksisterende keys, minimal impact (valgt)

**UI-konsekvens:** Bruger ser to color-pickers under "Anhøj Rules": "Above centerline" (neutral_high) og "Below centerline" (neutral_low). Direction-agnostisk men side-bevarende.

### Decision 5: Ingen ændring af chart-type-defaults eller centerline-beregninger i F1

**Hvad:** F1 ændrer INTET ved chart-typer eller centerline-beregninger. Alle 14 chart-typer (`run`, `i`, `i_m`, `i_mm`, `mr`, `p`, `pp`, `u`, `up`, `c`, `xbar`, `s`, `g`, `t`) beholder deres eksisterende impl. `chart_type.default = "i"` forbliver. Brugeren picker fortsat eksplicit fra dropdown.

**Hvorfor:**

1. **qicharts2-parity:** Verificeret 2026-05-19 via R-session: qicharts2 har KUN `i` (mean-CL + mean-MR + 3σ) og `ip` (prime-corrected mean). Ingen `i_m` eller `i_mm` findes i qicharts2 — de er PowerBI-SPC-innovationer fra AUS-DOH. Hvis F1 default-skiftede til `i_mm`, ville BFH-brugere få et chart der hverken matcher qicharts2 eller Anhøj's originale I-MR-chart (som også bruger mean-CL).

2. **Anhøj-rules er centerline-agnostiske:** `runs.analysis` tæller "over/under centerline" uanset hvordan centerline blev beregnet. Mean-CL I-chart + Anhøj-regler er en valid og naturlig Anhøj-implementation.

3. **Minimal-impact-princip:** F1's mål er at tilføje Anhøj-rules som signal-detektion. At ændre I-chart-defaults samtidig blander design-præference-debatten (median vs mean robusthed) ind i en regel-tilføjelse. Adskil bekymringer.

4. **`i_mm`-fjernelse er user-decision:** Brugeren har valgt at `i_mm` IKKE behøves i F1. Hvis senere relevant, kan beslutningen tages som separat change.

**Konsekvens:** `centerline-calculation`-capability har INGEN spec-delta i F1. Mappen er fjernet fra `specs/`.

### Decision 6: Fixtures opdelt i 2 contract-lag

**Hvad:** `docs/anhoj-fixtures.json` + `docs/anhoj-fixtures-gen.R` flyttes til `test/Outlier Flagging/`. JSON læses direkte af karma-tests. Tests opdeles i to lag:

**Lag 1 — qicharts2-parity (kanonisk):**
- `n_useful`, `longest_run`, `longest_run_max`, `n_crossings`, `n_crossings_min`, `long_run_signal`, `few_crossings_signal`
- Disse er skalarværdier returneret af qicharts2's `runs.analysis` (verificeret 2026-05-19). TypeScript-implementationens output asserteres direkte mod disse.

**Lag 2 — PowerBI-SPC-specifik (egen contract):**
- Hvilke specifikke punkter `anhojLongRun` flagger med `"upper"`/`"lower"`
- Tie-handling (flere runs af max-length → flag dem alle? Kun første? Sidste?)
- Centerline-tie-handling (punkter præcis på median springes over i run-counting, men hvad med segmenterne omkring?)
- Per-group-aggregation af global_signals

qicharts2 leverer GLOBAL skalar `runs.signal` per chart-part — ingen point-level run-membership-data. Punkt-flagging er en PowerBI-SPC-udvidelse.

**Hvorfor:** Fixture-output fra qicharts2 kan ej legitimere claims om hvilke specifikke punkter flagges. Adskillelse forhindrer at "ej-derefereret-i-qicharts2" detalje (tie-handling) bliver fejlagtigt asserteret som "qicharts2-parity".

**Spec-konsekvens:** `outlier-detection/spec.md` skal eksplicit markere hvilke requirements er Lag 1 (qicharts2-parity) vs Lag 2 (egen contract).

## Risks / Trade-offs

| Risiko | Mitigation |
|--------|-----------|
| I-chart default-skifte bryder eksisterende rapporter | Eksplicit NEWS-note. Kunne tilføje toggle "use_mean_centerline" som fallback, men det udskyder F2-konsolidering. Accepteres som bevidst F1-konsekvens. |
| `qbinom`-implementation numerisk forkert ved store `n` | Test mod R-output ved `n=100, 500, 1000` som del af `qbinom.test.ts`. |
| Global-signal-felt forvirrer downstream-kode der antager flat outlier-struktur | TypeScript-typer fanger mismatch ved compile. Mapping-loops opdateres til at filtrere objekter ud. |
| Korrelation mellem long-run + few-crossings ser ud som "samme regel to gange" for bruger | Documentér i settings-tooltip: "Anhøj's to regler er statistisk korrelerede — begge bør være tændt for fuld Anhøj-analyse". |

## Migration Plan

Phase 1 er additivt. Aktivering kræver eksplicit setting-toggle. Migration består af:

1. NEWS-entry beskriver:
   - Nye Anhøj-toggles + hvor de findes
   - I-chart default-skift + visuel konsekvens
2. README-update (Phase 3) forklarer Anhøj vs Making Data Count-paradigmet
3. Ingen automatisk omkonfigurering af eksisterende rapporter

## Open Questions

Ingen åbne tekniske spørgsmål. Alle design-valg afgjort i explore-sessionen 2026-05-19.
