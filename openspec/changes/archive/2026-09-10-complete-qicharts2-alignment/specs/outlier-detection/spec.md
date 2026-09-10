# Outlier Detection — Spec Delta

## REMOVED Requirements

### Requirement: Configurable Comparison Limit

`astronomical_limit` lod brugeren vælge, om punkter skulle flages mod 1σ, 2σ,
3σ eller specifikationsgrænsen.

**Reason:** `qicharts2`'s `sigma.signal` er defineret mod kontrolgrænserne og
kun dem: `y < lcl || y > ucl`. Med 1σ og 2σ fjernet (jf. chart-rendering-delta)
og specifikationsgrænser fjernet er 3σ det eneste tilbageværende valg, og
dropdownen har intet at vælge imellem.

**Migration:** Gemt `astronomical_limit` ignoreres. Flagging sker mod
`ll99`/`ul99`.

### Requirement: Improvement Direction Interpretation

`improvement_direction` (increase / neutral / decrease) og
`process_flag_type` (both / improvement / deterioration) oversatte et punkts
placering over eller under grænsen til en vurdering af, om afvigelsen var
ønsket, og filtrerede visningen efter den vurdering.

**Reason:** `qicharts2` fortolker ikke retning. `sigma.signal` er en ren
boolean per punkt. Om et signal er godt eller skidt afhænger af indikatoren og
den kliniske kontekst — det er en vurdering, klinikeren foretager, ikke en
indstilling i værktøjet. Fire kategorier og fire farvevælgere er en flade uden
modsvar i metoden.

**Migration:** Gemte værdier ignoreres. Alle punkter uden for
kontrolgrænserne markeres ens.

### Requirement: Direction-Mapped Colours

`ast_colour_improvement`, `ast_colour_deterioration`,
`ast_colour_neutral_low` og `ast_colour_neutral_high`.

**Reason:** Følger af ovenstående. Uden retningsfortolkning er der én
kategori at farvelægge.

**Migration:** Erstattes af én `ast_colour`. Gemte værdier for de fire gamle
properties ignoreres; den nye starter på sin default.

## MODIFIED Requirements

### Requirement: Beyond-Control-Limit Flagging

Visualen SKAL markere observationer, der ligger uden for
3σ-kontrolgrænserne, når `astronomical` er slået til.

En observation ligger uden for grænserne, når `value > ul99` eller
`value < ll99`. Grænser, der ikke er reelle tal, tæller ikke som brud —
en manglende grænse er fravær af en grænse, ikke en overtrådt grænse.

Markeringen SKAL være den samme uanset om observationen ligger over eller
under, og SKAL bruge farven i `ast_colour`.

Visualen MÅ IKKE udlede, om afvigelsen er ønsket eller uønsket.

#### Scenario: Observation over øvre kontrolgrænse

- **GIVEN** et diagram med kontrolgrænser og `astronomical` slået til
- **WHEN** en observation ligger over `ul99`
- **THEN** markeres observationen med `ast_colour`

#### Scenario: Observation under nedre kontrolgrænse

- **GIVEN** samme opsætning
- **WHEN** en observation ligger under `ll99`
- **THEN** markeres observationen med `ast_colour` — samme farve som ved brud
  opad

#### Scenario: Grænserne er ikke reelle tal

- **GIVEN** en konstant serie på et i-chart, hvor grænseberegningen giver NaN
- **WHEN** flagging køres
- **THEN** markeres ingen observationer

## UNCHANGED Requirements

Anhøj-reglerne (lang serie, få kryds) og deres seriesignal per faseafsnit er
uberørte af denne change, herunder undertrykkelsen af runs-verdiktet på
mr-charts.

Signalpanelets tredje række tæller fortsat observationer uden for
kontrolgrænserne. Optællingen er allerede uafhængig af `astronomical`-toggle
og af retningsfortolkningen, og påvirkes derfor ikke.
