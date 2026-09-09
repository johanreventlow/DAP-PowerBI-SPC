# SPC RØST

En Power BI custom visual til SPC-diagrammer (statistisk proceskontrol) med
runs-analyse efter den danske metode — som implementeret i R-pakken
[`qicharts2`](https://github.com/anhoej/qicharts2).

Visualen er en fork af
[AUS-DOH-Safety-and-Quality/PowerBI-SPC](https://github.com/AUS-DOH-Safety-and-Quality/PowerBI-SPC),
udviklet af Safety and Quality-teamet i Western Australias sundhedsministerium.
Al oprindelig funktionalitet er bevaret; forken tilføjer signaldetektionen og
det tilhørende signalpanel.

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

## Chart-typer

Run, i (XmR), mr, p, p', u, u', c, xbar, s, g og t.

## Installation

Hent den nyeste `.pbiviz` fra
[Releases](https://github.com/johanreventlow/PowerBI-SPC/releases). I Power BI:
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

## Licens og support

GPL-3.0, arvet fra upstream. Se `LICENSE.md`.

Fejl og ønsker til denne fork:
[Issues](https://github.com/johanreventlow/PowerBI-SPC/issues). Spørgsmål om
den oprindelige visuals funktionalitet hører hjemme
[hos upstream](https://github.com/AUS-DOH-Safety-and-Quality/PowerBI-SPC).
