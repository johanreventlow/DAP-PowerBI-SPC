# Design: add-i-prime-chart

## Context

`viewModelClass.calculateLimits()` deler serien i faser og kalder limit-
funktionen `(args: controlLimitsArgs) => controlLimitsObject` én gang per
fase med fasens egne `subset_points` (baseline). Resultaterne konkateneres
felt for felt efter `Object.entries`-**index**. Rendering (linjer, bånd,
tooltips, tabel) læser kun `values/targets/ll99/ul99` og håndterer allerede
punktvist varierende grænser (p, u, p', u').

Referencen er `qicharts2` 0.8.1 `qic.ip`. Den blev læst i R, ikke porteret:

```
cl    = Σ(y·n)/Σn                          (baseline)
s     = √(π/2)·|diff(y)| / √(1/n[i-1] + 1/n[i])
scr.: uls = 3.2665·mean(s); s = s[s < uls]  (option qic.screenedmr)
sd_i  = mean(s)·√(1/n_i);  lcl/ucl = cl ∓ 3·sd_i
```

## Goals / Non-Goals

**Goals:** I′ som selvstændig type, der passer i den eksisterende fase-/
baseline-struktur og genbruger al rendering. Numerisk overensstemmelse med
`qicharts2` på serier uden baseline-frysning.

**Non-Goals:** Ændring af `i`, `p'`, `u'`. Særskilt tegnekode. Ændret
validering for andre typer. Versionsbump/release.

## Decisions

**D1 — Baseline styrer CL, moving-S og s̄; ikke grænsebredden.**
`qicharts2::qic.ip` beregner `diff(y)` over *alle* punkter i fasen, mens
`qic.i` kun bruger baseline. Opgaven (og Taylor) siger baseline-only, som
`qic.i`. Vi følger det. Konsekvens: med `num_points_subset` sat vil
`qicharts2` med `freeze` give andre grænser end visualen. Fixtures bruger
derfor ingen `freeze`; baseline-tests har håndberegnede forventninger.
Dokumenteres i README.

**D2 — `o−1` i nævneren.** Manuskriptet skriver `Σs/o`; det er en fejl.
`qicharts2` bruger `mean(s)` over de `o−1` differencer, spc4hc skriver
`Σs/(o−1)`. Implementeret som gennemsnit af de faktiske differencer.

**D3 — Eksakt `√(π/2)`, ikke `1.128`.** `1/1.128 = 0.88652`,
`√(π/2)/... ` giver `√(2/π) = 0.88623`. Relativ forskel ≈ 3,3·10⁻⁴ på sigma.
Testen "I′ med d=1 ≈ I" bruger den tolerance og kører med
`outliers_in_limits = true`, så screeningens `3.267` vs `3.2665` ikke kan
flippe en grænseværdi.

**D4 — Konstant serie og screening.** Hvis `s̄_raw = 0`, springes screening
over og `sigma = 0` (som `i.ts`); grænser = CL. Hvis screening mod forventning
efterlader 0 værdier, beholdes `s̄_raw`. Ingen `NaN`/`Infinity` fra funktionen
på serier med ≥ 2 baselinepunkter.

**D5 — Én baselineobservation.** Ingen successive par → intet sigmaestimat.
Grænser sættes `NaN`, som `calculateLimits` mapper til `undefined` (samme
som `i.ts` og `qicharts2` `NA`). Værdier og centerlinje er stadig endelige.

**D6 — Returform.** Nøjagtig samme nøgler i samme rækkefølge som `i.ts`
(`keys, values, numerators, denominators, targets, ll99, ul99`) på alle
kodestier, fordi fase-konkateneringen er indexbaseret. `numerators`/
`denominators` er `undefined` uden nævner.

**D7 — Validering.** Ny prop `denominator_positive` (kun `ip`) og ny
`ValidationFailTypes.DenominatorNotPositive`. Branch efter `isNaN`:
`denominator <= 0 || !Number.isFinite(denominator)` → "Nævner skal være
større end 0" / "Alle nævnere skal være større end 0.". `Infinity` passerer
i dag både `isNaN` og `< 0`. Andre typer uændrede.

**D8 — Procent.** `ip` er ikke `pChartType`; ingen automatisk procent.
Multiplikator og manuel procent virker via `scaleAndTruncateLimits`.

**D9 — Fixtures.** `test/Chart Types/ip-fixtures-gen.R` → `ip-fixtures.json`
(input, cl, lcl/ucl per punkt, screening-flag, `sigma.signal`,
`runs.signal`). Fixture for aggregerede gennemsnit fodrer `qic()` med
råobservationer og gentaget `x`, så `n = y.length`; visualen får
`tæller = sum`, `nævner = antal`. Matcher grænserne, er README-instruktionen
"tæller = gennemsnit × n" verificeret. R-scriptet er ikke en runtime-
afhængighed.

## Risks / Trade-offs

- [`qicharts2` beregner moving-S over alle punkter] → D1; dokumenteret,
  fixtures uden freeze.
- [Nævner 0 gav tidligere `Infinity` for `i`] → uændret for `i`; kun `ip`
  får den nye regel, så ingen regression i andre typers adfærd.
- [Bruger fodrer gruppegennemsnit som tæller] → README forklarer
  `tæller = gennemsnit × n`; visualen kan ikke opdage fejlen.
