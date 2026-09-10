# DAP SPC

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
`sigma.signal`.

Kommer du fra AUS-DOH-visualen og bruger de regler eller ikoner, er det den
væsentlige forskel at kende.

## Chart-typer

Run, i (XmR), mr, p, p', u, u', c, xbar, s, g og t.

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
