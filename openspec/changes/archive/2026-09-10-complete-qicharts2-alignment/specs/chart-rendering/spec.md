# Chart Rendering — Spec Delta

## REMOVED Requirements

### Requirement: 95% Limits (2σ)

Settings-gruppe, beregning (`ll95`/`ul95`), rendering, tooltip-rækker,
tabel-kolonner og plot-labels.

**Reason:** `qicharts2` viser dem ikke som default (`show.95 = FALSE`), og
beslutningen 2026-06-11 22:57 var at fjerne dem helt frem for at gøre dem
opt-in. To sæt grænser inviterer til at aflæse 2σ som et signal, hvilket
hverken Anhøj-metoden eller `qicharts2` understøtter.

**Migration:** Gemte `*_95`-properties ignoreres.

### Requirement: 68% Limits (1σ)

Samme flade som ovenfor, for `ll68`/`ul68`.

**Reason:** `qicharts2` har intet 1σ-begreb overhovedet.

**Migration:** Gemte `*_68`-properties ignoreres.

### Requirement: Specification Limits

Settings-gruppen og den tilhørende plumbing.

**Reason:** Findes ikke i `qicharts2`. Specifikationsgrænser er en
proceskapabilitets-idé, ikke en SPC-signal-idé, og blander to metoder.

**Migration:** Gemte properties ignoreres.

### Requirement: Trend Line Overlay

Regressionslinjen: `calculateTrendLine`, `trend_line`-feltet,
"Trend"-linjegruppen og dens tooltip-række.

**Reason:** Findes ikke i `qicharts2`. En regressionslinje oven på et
kontroldiagram inviterer til at aflæse en tendens, som runs-analysen netop er
det formelle svar på.

**Bemærk:** Dette er trend-*linjen*, ikke trend-*reglen*. Reglen (n monotone
punkter) blev fjernet i F2. De to har næsten samme navn og er forskellige
features — forveksling har kostet tid før.

**Migration:** Gemte properties ignoreres. Feltbrønden `trend_line` forsvinder
fra dataroller.

### Requirement: Download Button

CSV-eksportknappen på canvas og `download_options.show_button`.

**Reason:** Beslutning 2026-06-11 23:02. Reducerer settings-fladen og fjerner
en eksportvej, der ikke ønskes i klinisk kontekst.

**Migration:** Gemt property ignoreres.

## MODIFIED Requirements

### Requirement: Available Chart Types

Chart Type-dropdownen SKAL tilbyde: `run`, `i`, `mr`, `p`, `pp`, `u`, `up`,
`c`, `xbar`, `s`, `g`, `t`.

`i_m` og `i_mm` SKAL IKKE fremgå af dropdownen.

Beregningerne for `i_m` og `i_mm` SKAL blive i pakken, og en gemt
`chart_type` med en af de to værdier SKAL fortsat rendere korrekt.

**Reason:** Ingen af de to findes i `qicharts2`, men `i_m` (median
centerlinje + gennemsnitligt moving range) ligger tæt på dansk praksis, hvor
runs-analysen bygger på en medianbaseret centerlinje. Beslutningen er at
fjerne dem fra brugerfladen uden at kaste beregningerne væk, så de kan
genindsættes ved at føje dem til dropdownen igen.

#### Scenario: Brugeren vælger chart-type

- **GIVEN** formateringsruden er åben
- **WHEN** Chart Type-dropdownen foldes ud
- **THEN** vises hverken `i_m` eller `i_mm`

#### Scenario: Rapport med gemt i_m

- **GIVEN** en rapport, hvor `chart_type` er gemt som `i_m`
- **WHEN** rapporten indlæses
- **THEN** renderes diagrammet med median centerlinje og
  moving-range-baserede grænser som hidtil

### Requirement: Limit Surface

Diagrammet SKAL vise centerlinje og 3σ-kontrolgrænser.

Diagrammet SKAL IKKE vise andre grænseniveauer.

## ADDED Requirements

### Requirement: Control Limit Band

Diagrammet SKAL kunne vise området mellem nedre og øvre 3σ-grænse som et
udfyldt bånd.

Båndet SKAL være slået fra som default.

Farve og gennemsigtighed SKAL kunne konfigureres.

Båndet SKAL tegnes bag linjer og punkter, så det ikke skjuler dem.

Båndet SKAL brydes ved faseskift, så det ikke forbinder to faser med
forskellige grænser.

#### Scenario: Faseopdelt diagram

- **GIVEN** et diagram med to faser og forskellige grænser i hver
- **WHEN** båndet er slået til
- **THEN** tegnes ét bånd per fase, uden forbindelse hen over faseskiftet

#### Scenario: Diagram uden kontrolgrænser

- **GIVEN** et run-diagram, som ikke har kontrolgrænser
- **WHEN** båndet er slået til
- **THEN** tegnes intet bånd

### Requirement: Danish User-Facing Text

Al tekst, brugeren møder, SKAL være på dansk: formateringsruden (kortnavne,
gruppenavne, indstillingsnavne og dropdown-valg), felt-brøndenes navne,
tooltips, oversigtstabellens kolonneoverskrifter og fejlbeskeder.

Terminologien SKAL følge dansk SPC-praksis som i Anhøjs litteratur og
`qicharts2`: serie, kryds, kontrolgrænser, centerlinje, faser.

Fagbegrebet "Anhøj" SKAL IKKE fremgå af den brugervendte flade. Det må gerne
bruges i kode, kommentarer og dokumentation.

### Requirement: Danish Decimal Separator

Tal, der vises for brugeren, SKAL bruge komma som decimalmarkør.

Dette gælder tooltips, oversigtstabellen, akse-etiketter, linje-etiketter og
signalpanelet.

#### Scenario: Decimaltal i tooltip

- **GIVEN** en observation med værdien 3,5
- **WHEN** tooltippet vises
- **THEN** står der `3,5`, ikke `3.5`
