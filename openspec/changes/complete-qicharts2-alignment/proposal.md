# Proposal: complete-qicharts2-alignment

## Why

Fire changes blev besluttet 2026-06-11 og udført på `feat/anhoj-rules-f1`, men
branchen blev aldrig merget. Beslutningerne står ved magt (bekræftet af Johan
2026-09-10); implementationerne mangler på `main`.

Denne change samler dem i én plan sammen med `align-limits-qicharts2`, som blev
overset ved samme lejlighed, og lægger rækkefølgen fast.

Kerneprincippet er uændret: `qicharts2`'s adfærd er spec'en. Alt, hvad
visualen tilbyder ud over den, er en flade danske klinikere skal forholde sig
til uden at få noget igen.

## Kilder

| Change | Besluttet | Status |
|---|---|---|
| `../archive/2026-06-11-align-limits-qicharts2/` | 11. juni 19:15 | udført på branch, ikke på main |
| `../add-anhoj-stats-display/` | 11. juni 21:33 | **udført på main** som signalpanelet |
| `../danish-ui/` | 11. juni 21:49 | udført på branch, ikke på main |
| `../add-limit-band/` | 11. juni 22:54 | udført på branch, ikke på main |
| `../remove-95-limits/` | 11. juni 22:57 | udført på branch, ikke på main |
| `../remove-download-button/` | 11. juni 23:02 | udført på branch, ikke på main |

Implementationerne findes kun på tagget `arkiv/f1-2026-06-17`. De er skrevet
mod kodebasen før Vitest-migreringen og før signalpanelet og kan ikke merges
direkte — de bruges som reference, ikke som patch.

## Konflikter mellem kilderne, og hvordan de er afgjort

Alle beslutninger faldt inden for seks timer samme dag. Tre steder omgør en
senere beslutning en tidligere. Tidsstemplet afgør:

| Emne | Tidligere | Senere — gælder |
|---|---|---|
| `checkFlagDirection` | F2-revisionen 17:51: behold | align-limits 19:15: **fjern** |
| Trendlinjen (`calculateTrendLine`) | F2-revisionen 17:51: behold | align-limits 19:15: **fjern** |
| 95%-grænser | align-limits 19:15: opt-in, default fra | remove-95-limits 22:57: **fjern helt** |

## What Changes

### Fjernelser

- **BREAKING** 95%-grænser (2σ) fjernes helt — settings, beregning, rendering,
  tooltip, tabel-kolonner, plot-labels.
- **BREAKING** 68%-grænser (1σ) fjernes helt. `qicharts2` har intet 1σ-begreb.
- **BREAKING** `astronomical_limit`-dropdownen fjernes. Flagging sker altid mod
  3σ, som `qicharts2`'s `sigma.signal`.
- **BREAKING** Retningsfortolkningen fjernes: `process_flag_type`,
  `improvement_direction`, `checkFlagDirection` og de fire retningsbaserede
  farvevælgere. Punkter uden for kontrolgrænsen får **én** konfigurerbar farve,
  ens over og under.
- **BREAKING** "Specification Limits"-gruppen fjernes inkl. plumbing.
- **BREAKING** Trendlinjen (regressionsoverlay) fjernes: `calculateTrendLine`,
  `trend_line`-feltet, "Trend"-linjegruppen og dens tooltip.
- **BREAKING** Download-knappen (CSV-eksport) fjernes.
- Chart-typerne `i_m` og `i_mm` **skjules** i Chart Type-dropdownen.
  Beregningerne bliver i pakken (se Beslutninger).

### Tilføjelser

- Farvelagt 3σ-bånd (geom_ribbon-stil), konfigurerbar farve og
  gennemsigtighed, **default fra**.
- Dansk terminologi i hele den brugervendte flade: formateringsrude,
  felt-brønde, tooltips, oversigtstabel og fejlbeskeder.
- Dansk decimalkomma alle steder, tal vises for brugeren.

### Bevares

Centerlinje/target, 3σ-kontrolgrænser, multiplier, freeze/subset,
faseopdeling (part/split), Anhøj-reglerne, signalpanelet, `astronomical` som
`sigma.signal`.

## Beslutninger truffet i denne change

**`i_m` og `i_mm` skjules frem for at slettes** (Johan, 2026-09-10).
Maj-planen foreslog at fjerne dem som ikke-`qicharts2`. Argumentet imod:
Anhøj-reglerne bygger på en medianbaseret centerlinje, og `i_m` er præcis
det — median centerlinje *med* kontrolgrænser. At skjule dem fjerner fladen
for brugeren uden at brænde broen. Beregningerne bliver i pakken og kan
genindsættes ved at føje dem til dropdownen.

**Ingen versionsbump undervejs.** Repoet har ingen udgivelse, så alle fem trin
bygger videre på `1.0.0.0`. Tag skæres først, når trin 5 er inde.

## Rækkefølge

Hver fjernelse gør fladen mindre, som dansk UI til sidst skal oversætte.
Derfor kommer oversættelsen sidst — ellers oversættes tekst, der er ved at
blive slettet.

| Trin | Indhold | Hvorfor her |
|---|---|---|
| 1 | Download-knap, specifikationsgrænser, trendlinje, skjul `i_m`/`i_mm` | Fire uafhængige fjernelser, rører ikke hinanden |
| 2 | 68%- og 95%-grænser, `astronomical_limit` | Alle tre kræver samme gennemgang af `src/Limit Calculations/` — ét gennemløb frem for tre |
| 3 | Retningsfarver → én `ast_colour` | Kræver at `astronomical_limit` er væk først |
| 4 | 3σ-bånd | Tilføjelse; efter oprydningen, så den bygger på den endelige linjeflade |
| 5 | Dansk UI + decimalkomma | Sidst, når fladen er så lille, den bliver |

Ét trin per PR. Hvert trin er selvstændigt verificerbart, og arbejdet kan
stoppe efter et hvilket som helst trin uden at efterlade noget halvt.

## Capabilities

### New Capabilities

(ingen)

### Modified Capabilities

- `outlier-detection`: `astronomical` altid mod 3σ, én farve, ingen
  retningsfortolkning. Delta: `specs/outlier-detection/spec.md`.
- `chart-rendering`: linjefladen reduceret til centerlinje + 3σ; 3σ-bånd
  tilføjet; dansk brugervendt tekst; `i_m`/`i_mm` skjult. Delta:
  `specs/chart-rendering/spec.md`.

## Impact

Pre-1.0-fork uden udgivelser og uden rapporter i drift. Gemte indstillinger
for fjernede properties ignoreres af Power BI — ingen migration nødvendig.

Settings og `capabilities.json` skal ryddes **synkront**. En property, der kun
fjernes ét af stederne, fejler tavst.

Upstream-merges fra AUS-DOH bliver sværere. Accepteret konsekvens, samme
afvejning som i F2.
