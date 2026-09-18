# SPC til DAP

En Power BI custom visual til SPC-diagrammer (statistisk proceskontrol) med
runs-analyse efter den danske metode — som implementeret i R-pakken
[`qicharts2`](https://github.com/anhoej/qicharts2).

Visualen er en fork af
[AUS-DOH-Safety-and-Quality/PowerBI-SPC](https://github.com/AUS-DOH-Safety-and-Quality/PowerBI-SPC),
udviklet af Safety and Quality-teamet i Western Australias sundhedsministerium.
Forken tilføjer signaldetektionen og det tilhørende signalpanel — og skærer
regelsættet ned til det, `qicharts2` rapporterer.

## Hvad forken tilføjer

* **Serielængde** — centerlinen stiples, når det længste stræk af observationer
  på samme side af centerlinen overstiger `round(log2(n)) + 3`.
* **Antal kryds** — centerlinen stiples, når antallet af krydsninger af
  centerlinen er under `qbinom(0.05, n - 1, 0.5)`.
* **Signalpanel** — tallene bag signalerne vist permanent ved siden af grafen:
  faktisk værdi over for forventet, per periode.
* **Dansk brugerflade** — formateringsrude, tooltips, oversigtstabel og
  fejlbeskeder er på dansk, og tal vises med decimalkomma.
* **Kontrolgrænse-bånd** — området mellem 3σ-grænserne kan udfyldes som en
  flade. Default fra.

Begge regler er seriesignaler, ikke punktmarkeringer. Det er en bevidst forskel
fra NHS-praksis og svarer til, hvordan `qicharts2` rapporterer `runs.signal`.
Tærsklerne er verificeret mod `qicharts2` v0.8.1 på 14 reference-datasæt, som
ligger i `test/Outlier Flagging/anhoj-fixtures.json` og regenereres med det
medfølgende R-script.

## Hvad forken har fjernet

`qicharts2` rapporterer to signaler: `runs.signal` (de to regler ovenfor) og
`sigma.signal` (observationer uden for kontrolgrænserne). Upstreams øvrige
regler — `trend`, `twoInThree` og `shift` — hører til NHS' *making data
count*-metode og er fjernet sammen med NHS' variations- og sikkerhedsikoner.

Markeringen af punkter uden for kontrolgrænserne er bevaret; det er
`sigma.signal`. Den måler altid mod 3σ og skelner kun mellem inden for og uden
for — ikke mellem forbedring og forværring, som ikke er en del af signalet.

Grænsefladen følger med: 95%- og 68%-grænserne (2σ og 1σ) er fjernet, så det
viste svarer til det, metoden bygger på. Det samme gælder specifikations-
grænser, trendlinjen (regressionsoverlayet, ikke trend*reglen*) og
download-knappen, som Power BI selv har.

Kommer du fra AUS-DOH-visualen og bruger de regler, grænser eller ikoner, er
det den væsentlige forskel at kende.

## Chart-typer

Run, i (XmR), i', mr, p, p', u, u', c, xbar, s, g og t.

### i' — normaliseret individkort

`i'` er Anhøj/Taylors normaliserede individkort (`qicharts2`: `chart = "ip"`).
Det er et I-kort for observationer, der er gennemsnit eller ratioer over et
varierende antal enheder — patienter, dage, prøver — og hvor usikkerheden
derfor er forskellig fra punkt til punkt. Metodens antagelse er, at variansen
falder med nævneren, `Var(y_i) ≈ σ²/d_i`; derfor får punkter med små nævnere
bredere kontrolgrænser end punkter med store. Uden nævner er `d_i = 1`, og
kortet er et almindeligt I-kort — bortset fra at `i'` bruger den eksakte
konstant `√(π/2)` i stedet for den afrundede `1.128`, så grænseafstanden
bliver cirka 0,03 % smallere, og at screeningsgrænsen er `3,2665·s̄` mod
I-kortets `3,267`.

Beregningen: centerlinjen er `Σn/Σd` (vægtet, ikke gennemsnittet af
ratioerne), sigma estimeres fra de normaliserede successive differencer
`s_i = √(π/2)·|y_i − y_{i−1}| / √(1/d_i + 1/d_{i−1})`, og grænserne er
`CL ± 3·s̄/√d_i`. "Behold outliers i grænseberegning" virker som for de
andre typer: er den fra, screenes `s_i ≥ 3,2665·s̄` bort, før `s̄`
genberegnes. Der afskæres ikke automatisk ved 0 eller 1 — kortet kan bruges
på kontinuerte og negative målinger — men "Afskær nedre/øvre grænser ved"
virker som sædvanlig.

**Aggregerede gennemsnit skal indlæses som sum og antal.** Har du allerede
beregnet gruppegennemsnittet `x̄_i`, skal felterne være

```
Tæller = gruppegennemsnit × gruppestørrelse
Nævner = gruppestørrelse
```

Lægger du gennemsnittet direkte i tælleren, plotter visualen `x̄_i/d_i`.

Baselinen ("Antal punkter til grænseberegning") fastlægger centerlinje og
sigma; punkter uden for baselinen får grænser med deres egen nævner. Bemærk
at `qicharts2` her tager differencerne over hele fasen og ikke kun
baselinen, så med `freeze` afviger dens grænser lidt fra visualens. En helt
konstant serie får grænser lig centerlinjen, hvor `qicharts2` med screening
slået til viser ingen grænser (`NA`); ingen af delene giver et signal.

Kortet er ikke universelt: ved meget lave counts, stærkt skæve data eller
variation, der ikke aftager med `1/d_i`, holder antagelsen ikke, og
grænserne skal læses med faglig forsigtighed. Referencer: Taylor,
[Normalized Individuals Control Chart](https://variation.com/normalized-individuals-control-chart/);
Anhøj, [I′ charts for variable subgroup sizes](https://anhoej.github.io/spc4hc/i-prime-charts-for-variable-subgroup-sizes.html).
Grænserne er verificeret mod `qicharts2` v0.8.1 på fem reference-datasæt i
`test/Chart Types/ip-fixtures.json`, genereret af R-scriptet i samme mappe.

## Installation

Hent den nyeste `.pbiviz` fra
[Releases](https://github.com/johanreventlow/DAP-PowerBI-SPC/releases). I Power BI:
**Visualiseringer → ⋯ → Importér en visual fra en fil**.

Visualen har eget GUID og lever derfor side om side med den oprindelige
AUS-DOH-visual — den overskriver den ikke, og rapporter, der bruger originalen,
er upåvirkede.

## Byg selv

Kræver Node.js:

```
npm install
npm install -g powerbi-visuals-tools
pbiviz package
```

Resultatet lander i `dist/`.

Kør testene med `npm test` (Vitest i headless Chromium — første kørsel kræver
`npx playwright install chromium`).

## Udgivelse

En release skæres fra et tag. Versionen skal stå tre steder, og de skal være
enige — ellers stopper workflowet, før noget publiceres:

1. `pbiviz.json` → `visual.version`
2. `package.json` → `version`
3. tagget selv, med `v` foran

```
# ret versionen begge steder først, commit, og så:
git tag v1.0.0.1
git push origin v1.0.0.1
```

[Release-workflowet](.github/workflows/release.yml) kører derefter linter,
tests og build, og lægger `.pbiviz`-filen på
[Releases](https://github.com/johanreventlow/DAP-PowerBI-SPC/releases) med
release-noterne fra det matchende afsnit i `NEWS.md`.

Power BI kræver et firecifret versionsnummer (`x.y.z.w`).

Bemærk at `push_to_release.yml` er noget andet: den bygger manuelt en
**(Dev)**-mærket variant med sit eget GUID, så en testversion kan ligge side
om side med produktionsversionen i Power BI. Den er ikke vejen til en
udgivelse.

## Licens og support

GPL-3.0, arvet fra upstream. Se `LICENSE.md`.

Fejl og ønsker til denne fork:
[Issues](https://github.com/johanreventlow/DAP-PowerBI-SPC/issues). Spørgsmål om
den oprindelige visuals funktionalitet hører hjemme
[hos upstream](https://github.com/AUS-DOH-Safety-and-Quality/PowerBI-SPC).
