## ADDED Requirements

### Requirement: Normaliseret individkort (I′)

Diagramtypen `ip` SHALL beregne plotværdi `y_i = n_i/d_i` med `d_i = 1`, når
ingen nævner er leveret. Centerlinjen SHALL være `Σn_i/Σd_i` over
baselinepunkterne. For hvert par af successive baselinepunkter SHALL
`s_i = √(π/2)·|y_i − y_{i−1}| / √(1/d_i + 1/d_{i−1})`, og `s̄` SHALL være
gennemsnittet af de `o−1` værdier. For alle punkter i fasen SHALL
`LCL_i = CL − 3·s̄/√d_i` og `UCL_i = CL + 3·s̄/√d_i` uden automatisk
afskæring ved 0 eller 1. Konstanten SHALL være eksakt `√(π/2)`, ikke `1.128`.

#### Scenario: Ingen nævner reducerer til I-kort

- **WHEN** `ip` bruges uden nævnerkolonne
- **THEN** er grænserne konstante og svarer til I-kortets inden for en
  relativ tolerance på 5·10⁻⁴ (forskellen mellem `√(2/π)` og `1/1.128`)

#### Scenario: Konstant nævner giver konstante grænser

- **WHEN** alle `d_i` er ens
- **THEN** er `UCL_i − CL` ens for alle punkter

#### Scenario: Grænsebredde skalerer med 1/√d

- **WHEN** punkt B har `d_B = 4·d_A`
- **THEN** er `UCL_B − CL = (UCL_A − CL)/2`

#### Scenario: Vægtet centerlinje

- **WHEN** ratioerne har forskellige nævnere
- **THEN** er CL `Σn/Σd`, ikke gennemsnittet af `n_i/d_i`

### Requirement: Screening af store moving-S-værdier i I′

Når `outliers_in_limits = false` SHALL `ip` beregne `s̄_raw`, sætte
`ULS = 3.2665·s̄_raw`, beholde `s_i < ULS` og genberegne `s̄` på de bevarede
værdier. Når `outliers_in_limits = true` SHALL alle `s_i` indgå. Hvis
`s̄_raw = 0` SHALL sigma være 0 og grænserne lig centerlinjen. Hvis
screening efterlader ingen værdier SHALL `s̄_raw` beholdes. Funktionen SHALL
ikke returnere `NaN` eller `Infinity` for serier med mindst to
baselinepunkter.

#### Scenario: Én ekstrem difference

- **WHEN** ét `s_i` overstiger `3.2665·s̄_raw`
- **THEN** giver `outliers_in_limits = false` smallere grænser end `true`,
  og begge svarer til `qicharts2` med hhv. `qic.screenedmr = TRUE/FALSE`

#### Scenario: Konstant serie

- **WHEN** alle `y_i` er ens
- **THEN** er værdier, centerlinje og grænser endelige, og grænserne er lig
  centerlinjen

### Requirement: Baseline og faser i I′

Baselinen (`num_points_subset`, fra start eller slut) SHALL alene bestemme
centerlinje, moving-S-værdier og `s̄`. Punkter uden for baselinen SHALL få
grænser fra de frosne værdier med deres egen `d_i`. Hver fase SHALL beregnes
selvstændigt efter det eksisterende fasemønster. Med kun ét baselinepunkt
SHALL grænserne være udefinerede, mens værdier og centerlinje er endelige.

#### Scenario: Frossen baseline

- **WHEN** baselinen er de første k punkter, og et senere punkt ændres
- **THEN** er CL og `s̄` uændrede, og det senere punkts grænsebredde er
  `3·s̄/√d_i` med dets egen nævner

#### Scenario: Faser

- **WHEN** serien er delt i to faser
- **THEN** har hver fase sin egen CL og sit eget `s̄`

### Requirement: Validering af nævner for I′

Når diagramtypen er `ip` og nævnerkolonnen er leveret, SHALL en nævner, der
mangler, ikke er et tal, er `≤ 0` eller ikke er endelig, udelade punktet med
en dansk fejlbesked. Er alle nævnere ugyldige af samme årsag, SHALL en samlet
fejl vises. Valideringen for andre diagramtyper SHALL være uændret.

#### Scenario: Nul eller negativ nævner

- **WHEN** en nævner er 0 eller negativ
- **THEN** udelades punktet med beskeden "Nævner skal være større end 0"

#### Scenario: Andre typer uberørt

- **WHEN** diagramtypen er `i` med en nævner på 0
- **THEN** er valideringsresultatet som før denne ændring

### Requirement: I′ i brugerfladen

`ip` SHALL kunne vælges i diagramtypevælgeren med den danske tekst
"i' - Normaliseret individkort (varierende nævner)", SHALL have
kontrolgrænser, runs-analyse, datoakse og valgfri nævner, SHALL ikke kræve
SD-kolonne, SHALL tillade negative og ikke-heltallige værdier og tæller
større end nævner, og SHALL ikke vise procent automatisk. Multiplikator,
manuel procent, `ll_truncate`/`ul_truncate`, tooltips, oversigtstabel,
signalpanel og kontrolgrænsebånd SHALL virke via de eksisterende generelle
mekanismer.

#### Scenario: Roundtrip

- **WHEN** diagramtypen skiftes `i → ip → run → ip`
- **THEN** har det sidste `ip`-render kontrolgrænser og tegnede grænselinjer

#### Scenario: Rendering uden NaN

- **WHEN** `ip` renderes med og uden nævnere
- **THEN** indeholder SVG, tooltips og tabelværdier hverken `NaN` eller
  `Infinity`
