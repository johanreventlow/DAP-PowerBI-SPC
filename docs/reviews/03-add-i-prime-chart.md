# Cycle 3 — Review af `add-i-prime-chart` (I′, `ip`)

**Dato:** 2026-09-16
**Reviewer:** Claude (Phase 1: code-analyzer/opus + egen verifikation)
**Target:** `feat/i-prime-chart` — `git diff main..HEAD` (6 commits, 20 filer, +1345/−8)
**Trigger:** Ny diagramtype med tredjeparts-paritetspåstand (`qicharts2` 0.8.1 `qic.ip`), ny valideringsregel, fixtures fra R. Post-implementation, pre-PR.

**Konklusion Phase 1:** 0 HIGH, 0 MEDIUM, 7 LOW. Aritmetik håndverificeret mod tre fixtures; `qicharts2`-kilden (`R/helper.functions.R`) læst direkte.

---

## L1 [LOW] — Konstanten 0,88623 mærket forkert som `√(2/π)`

**Lokation:** `test/Chart Types/ip.test.ts:57`, `openspec/changes/add-i-prime-chart/design.md` D3

**Symptom:** Kommentaren siger `√(2/π) = 0.88623`. `√(2/π) = 0.79788`. Sigma-faktoren ved `d = 1` er `√(π/2)/√2 = √π/2 = 0.88623`.

**Verifikation (R):**
```
sqrt(2/pi) = 0.7978846   sqrt(pi)/2 = 0.8862269   1/1.128 = 0.8865248
```

**Konsekvens:** Læseforvirring. Tal, tolerance (5e-4) og README's "ca. 0,03 %" er korrekte (0,034 %).

**Foreslået fix:** Skriv `√π/2 = 0.88623` begge steder. `verified`.

---

## L2 [LOW] — `runs_signal` fra fixtures asserteres kun for én fixture

**Lokation:** `test/Chart Types/ip.test.ts:186,226-232`; `ipVisual.test.ts:127`

**Symptom:** Fixture-typen indlæser `runs_signal`, men kun `extreme_difference` sammenlignes (via `Visual.update()`). De fire øvrige fixtures' `runs.signal` fra `qicharts2` er ubrugt.

**Konsekvens:** Regression i Anhøj-analysen på `ip`-serier (fx forkert centerlinje ind i `anhojRunsAnalysis`) fanges ikke, selvom referencedata ligger der.

**Foreslået fix (ipVisual.test.ts):**
```ts
fixtures.forEach(fx => fx.variants.forEach(v => {
  it(`${fx.name}: runs.signal per fase matcher qicharts2`, () => {
    const groupings = v.part.map(p => `Fase ${p}`);
    const { element, visual } = render(
      { numerators: fx.numerators, denominators: fx.denominators ?? undefined, groupings },
      { outliers_in_limits: v.outliers_in_limits });
    const stats = visual.viewModel.outliers[0].per_group_stats;
    Array.from(new Set(v.part)).forEach((part, g) => {
      const first = v.part.indexOf(part);
      expect(stats[g].long_run_signal || stats[g].few_crossings_signal).toBe(v.runs_signal[first]);
    });
    element.remove();
  });
}));
```
Bemærk: `groupings` med kun én fase giver én gruppe; `render`-hjælperen accepterer allerede `groupings`.

---

## L3 [LOW] — To tests måler kun fixture-JSON, ikke produktionskode

**Lokation:** `test/Chart Types/ip.test.ts:202-209`, `238-244`

**Symptom:** "dækker de krævede scenarier" og "extreme_difference: screening giver smallere grænser" asserterer kun på `ip-fixtures.json`.

**Konsekvens:** Ikke tautologier (låser screening-polariteten mod fejlmappet `qic.screenedmr`), men nul kodedækning. Navnet overvurderer dækningen.

**Foreslået fix:** Omdøb til "fixture-sanity: …". Ingen kodeændring.

---

## L4 [LOW] — Grænsetilfældet `s_i == ULS` er utestet

**Lokation:** `src/Limit Calculations/ip.ts:92` (`if (s[i] < uls)`)

**Symptom:** Streng `<` er korrekt (`qicharts2`: `s <- s[s < uls]`), men ingen test ligger nær grænsen. Fixturens største `s_i` = 25,70 mod ULS = 14,28.

**Konsekvens:** Et skift til `<=` opdages ikke. Eneste asymmetri mellem `ip` (3,2665) og `i` (3,267) er ulåst.

**Foreslået fix:** Enhedstest med konstruerede differencer, hvor én `s_i` rammer `uls` eksakt. Konstruktion: med `d = 1` er `s_i = k·|Δy|`, `k = √π/2`. Vælg differencer `[1, 1, 1, 1, a]` så `a = 3.2665·(4 + a)/5` ⇒ `a = 3.2665·4 / (5 − 3.2665) = 7.5369…`; flydende tal rammer ikke eksakt — test i stedet `a` en ulp over og under, og assertér at kun den ene screenes.

---

## L5 [LOW] — Konstant-serie-afvigelse fra `qicharts2` ikke dokumenteret i README

**Lokation:** `src/Limit Calculations/ip.ts:87` vs. README §"i' — normaliseret individkort"

**Symptom:** Guarden `sbar > 0` springer screening over. `qicharts2` har ingen guard: `uls = 0`, `s[s < 0]` tom, `mean(numeric(0)) = NaN` → NA-grænser.

**Verifikation (R, qicharts2 0.8.1):**
```
options(qic.screenedmr=TRUE);  qic(1:5, rep(5,5), chart="ip", return.data=TRUE)$lcl[1]  # NA
options(qic.screenedmr=FALSE); qic(1:5, rep(5,5), chart="ip", return.data=TRUE)$lcl[1]  # 5
```

**Konsekvens:** Konstant `ip`-serie med screening: visualen viser grænser = CL, `qicharts2` ingen grænser. 0 signaler begge veje. Konsistent med `i.ts` (samme guard, porteret fra upstream). Står kun i `design.md` D4.

**Foreslået fix:** Én sætning i README ved siden af baseline-afvigelsen. `verified`.

---

## L6 [LOW] — Uendelig tæller slipper igennem, uendelig nævner afvises

**Lokation:** `src/Functions/validateInputData.ts:37-50` vs. `:68`

**Symptom:** Ny nævnerregel bruger `Number.isFinite`; tælleren tjekkes kun med `isNaN`. `numerator = Infinity` passerer for alle typer.

**Konsekvens:** For `ip`: alle grænser `±Infinity` → `isValidNumber` mapper til `undefined`; intet når SVG. Nedarvet asymmetri, ikke ny.

**Foreslået fix:** Ingen i denne PR. Senere: `!Number.isFinite(numerator)` → `NumeratorNaN` for alle typer (kræver regressionstests).

---

## L7 [LOW] — Nævnere vises med `sig_figs` decimaler ("3,00")

**Lokation:** `src/Classes/derivedSettingsClass.ts:74` (`integer_num_den`), `src/Functions/valueFormatter.ts:18`

**Symptom:** `integer_num_den` er false for `ip`, så en heltallig gruppestørrelse vises "3,00" i tooltip/tabel.

**Konsekvens:** Kosmetisk; identisk med `u`, `up`, `xbar`, `s`. Bevidst valg: `ip` tillader ikke-heltallige nævnere (sengedage), så `integer_num_den` ville afrunde reelle værdier.

**Foreslået fix:** Ingen. Design-bemærkning.

---

## Verificeret OK (Phase 1)

- **Aritmetik** håndregnet mod `extreme_difference` (screenet + uscreenet), `aggregated_means` (CL = 718,32/61), `two_phases` (fase 2's `s̄` over 7 differencer — ingen difference krydser fasegrænsen).
- **`qicharts2`-kilde:** `qic.ip` diff over hele fasen (D1-afvigelsen reel); `qic.i` baseline-only; `qic.screenedmr`-navn og `3.2665` korrekt; R-scriptets mapping rigtig.
- **Baseline-indeksering:** `seq(subsetStart, …)` stigende, sammenhængende, 0-baseret inden for fasens slice; `n_sub ≥ 1` garanteret.
- **`n_sub = 1`:** `NaN` → `undefined`; `astronomical` og `nBeyondLimits` giver 0 signaler.
- **Feltrækkefølge:** identisk med `i.ts` på begge kodestier; låst af test.
- **Validering:** else-if-kæde korrekt ordnet for 0/−1/−Inf/Inf/NaN/null/string; kun `ip` berørt.
- **Chart-type-lister:** kun `derivedSettingsClass` special-caser typer; alle consumers (tooltip, signalpanel, linjer, bånd, tabel, plotProperties) er type-agnostiske.
- **capabilities.json** korrekt uændret: enumeration `[]` fyldes fra `spcSettings` i `settingsClass.getFormattingModel()`; `extractConditionalFormatting` validerer mod `valid`.
- **Rendering:** negativ LCL OK (`plotPropertiesClass` klipper kun ved `percentLabels`); `drawLimitBand` springer ikke-endelige over; grænser i en fase er enten alle endelige eller alle `undefined`.
- **Fixture-binding:** `toBeCloseTo(…, 10)` = abs 5e-11 på værdier 0,06–25,7 — reelt bindende.
- **R-script:** `set.seed` før eneste `rnorm`; `digits = NA`; `stopifnot` fanger fejlmappet option.
- **Nedarvet, uden for diff:** `drawLines:78-81` kan skrive `y1="NaN"` ved to ugyldige nabopunkter i betinget-formatering-grenen.

---

## Phase 2 — Codex-trigger

**YES.** Draft indeholder executable fix-recipes (L2, L4), empiriske claims om tredjepartspakke (L5, D1), cross-package contract (`qicharts2`-paritet), og severity-vurdering (0 HIGH/MEDIUM) der driver "klar til PR"-beslutningen.

---

## Codex adversarial-review konsekvens (2026-09-16)

Codex-run: `review-mu4akmvs-9onfpo`, 8 min 48 s, session `01a0aaf6-fbe6-76e1-a564-ca4ef4881ba6`.
Codex' egne kørsler: `tsc --noEmit` + OpenSpec strict-validation OK; Vitest/R miljøblokeret hos Codex (`listen EPERM`, `R_TempDir`) — alt genkørt her.

Verdict (Codex): **needs-attention** → efter implementation: **approve**.

**Bekræftet (verified empirisk):**
- **NEW [MEDIUM→implementeret]** Negativ `ip`-nævner ramte `denominator < 0`-grenen før `denominator_positive`: `-1` → "Nævner er negativ", `[-1, 0, …]` → generisk "Ingen gyldige data fundet.". Spec-scenariet "Nul eller negativ nævner" kræver "Nævner skal være større end 0". Reproduktion: min egen test `ipVisual.test.ts:254,266` låste netop den afvigende adfærd. Fix: grenen flyttet før negativ-tjekket; `i`-regressionstest uændret grøn. Bucket: **false-confidence / spec-drift** (ingen crash, ingen forkert beregning; spec og implementation var uenige, og testen bekræftede implementationen).
- **L1** Konstantnavn: `sqrt(2/pi) = 0.7979`, `sqrt(pi)/2 = 0.8862` (R). Codex fandt en tredje forekomst i `spec.md:17`, som Phase 1 overså. Rettet tre steder.
- **L4 [recalibreret]** Min ulp-opskrift var forkert: `<` og `<=` er kun forskellige *i* lighedspunktet, så "en ulp over/under" tester ingenting. Codex' konstruktion `a = 3.2665·4/(5 − 3.2665)`, serie `[0,1,2,3,4,4+a]`, giver `s_last === ULS` eksakt — verificeret i node, **men kun med produktionens operationsorden** (`√(π/2)·|Δ|/√2`); testens første udgave brugte `k·a` og afveg 1 ulp. Mutation `<` → `<=` gør testen rød (kørt).
- **L2** Fix-opskriften passer til `render()`-signaturen; alle 5 fixtures × 2 varianter × faser matcher `runs.signal` (10 nye tests grønne). Codex nedtonede: de fleste forventninger er `false`, og Anhøj-algoritmen har egne qicharts2-tests. Accepteret som dækningsforbedring, ikke bugfix.
- **L3** Omdøbt til `fixture-sanity`.
- **L5** `qicharts2` giver `NA` ved konstant serie + screening (R-kørsel ovenfor). Codex: bevidst normativ adfærd (D4), README-note valgfri. Note tilføjet alligevel — begge divergenser står nu samme sted.

**Dismissed (enig):**
- **L6** Uendelig tæller: nedarvet fra main, uden for diffen. Noteret som tværgående opgave.
- **L7** Nævner vist som "3,00": `integer_num_den = false` er bevidst (brøknævnere). Ingen ændring.

**Impact-bucketing (Codex-pass):**
| Bucket | Antal | Fund |
|---|---|---|
| Hard runtime-crash | 0 | — |
| Silent-corruption / semantic drift | 0 | — |
| False-confidence / process guard | 2 | NEW (spec-drift låst af egen test), L4 (forkert testopskrift) |
| Sub-optimal / cleanup | 2 | L1 (tredje forekomst), L2 (nedtonet) |

**Læring:**
1. En test, der *bekræfter* implementationen, er ikke en test af spec'en. NEW blev skrevet ind i testen som forventet adfærd, fordi jeg læste koden, ikke spec-scenariet. Ved validering: skriv forventningen fra spec-scenariet FØR koden læses.
2. Flydende-tal-grænsetests skal genbruge produktionens operationsorden — `a·b/c` og `(a/c)·b` afviger med 1 ulp, og en lighedstest på grænsen falder.
3. Ulp-forskydning kan ikke skelne `<` fra `<=`; kun eksakt lighed kan. Konstruér ligheden, og verificér den med `toBe`, før den bruges som mutation-fælde.

**Commits:** `0a631d2` (NEW + L2), `64be788` (L1/L3/L4), `081b401` (L1/L5).
**Gate efter fix:** 42 filer / 508 tests grønne, eslint ren, tsc exit 0.
