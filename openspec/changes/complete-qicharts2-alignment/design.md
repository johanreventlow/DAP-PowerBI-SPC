# Design — complete-qicharts2-alignment

## Hvorfor rækkefølgen er som den er

Fem trin, og rækkefølgen er ikke vilkårlig.

**Oversættelsen sidst.** Trin 5 skal oversætte hele den brugervendte flade.
Hvert af trin 1–4 gør den flade mindre. Oversættes først, oversættes tekst,
der straks efter slettes — og hver senere fjernelse efterlader en halvt dansk,
halvt engelsk rude, indtil den er ryddet op.

**Grænserne samlet.** 68 %, 95 % og `astronomical_limit` er tre beslutninger,
men ét stykke arbejde: de rører de samme 14 filer i `src/Limit Calculations/`
plus rendering, tooltip og tabel. Delt op ville det betyde tre gennemløb af
samme kode med tre chancer for at glemme en fil.

**Retningsfarver efter grænserne.** `astronomical_limit` skal være væk, før
farvelogikken kan forenkles — ellers skal `getAesthetic` håndtere både en
grænse, der kan variere, og en retning, der kan variere, samtidig.

**Båndet efter oprydningen.** Det er den eneste tilføjelse. Bygges det først,
bygges det oven på en linjeflade, der er ved at ændre sig.

## Hvorfor `i_m` og `i_mm` skjules i stedet for at slettes

Maj-planen ville fjerne dem som ikke-`qicharts2`-funktionalitet, med samme
argument som for `shift`.

Argumentet holder ikke helt her. `shift` var en *regel*, der konkurrerede med
en Anhøj-regel om at besvare samme spørgsmål. `i_m` er en *chart-type*, og den
kombination, den tilbyder — median centerlinje med kontrolgrænser — er tættere
på dansk praksis end `i` er. Runs-analysen bygger netop på en medianbaseret
centerlinje; det er derfor `run`-diagrammet har median.

At `qicharts2` ikke tilbyder kombinationen er ikke i sig selv et argument for,
at den er forkert. Det er et argument for, at vi ikke har paritet på punktet.

Beslutningen er derfor at fjerne dem fra brugerfladen — de forvirrer i en
dropdown med tolv andre valg — uden at kaste beregningerne væk. De kan
genindsættes ved at føje to strenge til et array.

## Hvad der ikke ændrer sig, og hvorfor det er værd at sige

**Signalpanelets tredje række.** Den tæller observationer uden for
kontrolgrænserne. Optællingen blev bevidst koblet fri af
`astronomical`-toggle og af retningsfortolkningen, da panelet blev bygget:
den tæller direkte mod `ll99`/`ul99`. Trin 2 og 3 rører derfor ikke panelet.
Det er tilsigtet og skal forblive sådan — tallet i panelet er `qicharts2`'s
`sigma.signal`, ikke en visning af den gamle punktmarkeringsregel.

**Anhøj-reglerne.** Uberørte, inklusive undertrykkelsen af runs-verdiktet på
mr-charts.

## Risici

**Tavs settings-drift.** Den kendte fælde i dette repo: en property skal
fjernes både i `src/Settings Model/` og i `capabilities.json`. Fjernes den kun
ét sted, fejler den tavst — ingen fejlmeddelelse, indstillingen persisteres
bare ikke. Hvert trin skal derfor afsluttes med en optælling af begge flader
mod hinanden.

**Testfiler typechecker ikke.** `tsconfig.json` dækker kun `src/**/*`. En
testfil kan referere til noget, der ikke findes længere, uden at
`tsc --noEmit` siger fra. Kun `npm test` fanger det.

**Ingen verifikation i Power BI.** Visualen er stadig aldrig åbnet i en rigtig
rude. Alle fem trin ændrer den brugervendte flade, og trin 4 tilføjer ny
rendering. Vitest fanger ikke layout. Det er den største usikkerhed i planen,
og den bliver ikke mindre af at vente.

## Reference-implementationer

Tagget `arkiv/f1-2026-06-17` har trin 1–5 udført mod en ældre kodebase — før
Vitest-migreringen og før signalpanelet. Det kan ikke merges, men det er
værdifuldt som reference, især for dansk terminologi i trin 5 og for
båndets tegnelogik i trin 4.

```
git show arkiv/f1-2026-06-17:"src/Settings Model/linesSettings.ts"
git show arkiv/f1-2026-06-17:"src/D3 Plotting Functions/drawLimitBand.ts"
```
