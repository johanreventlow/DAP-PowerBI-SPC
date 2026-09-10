# NEWS

## 1.0.0.0 — DAP SPC

Første udgivelse under det nye navn. Visualen har eget GUID (`DAPSPC`) og
kan derfor installeres side om side med den oprindelige AUS-DOH-visual.

### Om versionsnummeret

Versionen starter forfra på 1.0.0.0. Den tidligere `1.8.0.0` var upstreams
eget løbenummer, arvet gennem merge `91b03ef` fra AUS-DOH-commit `7fc0f5f`
(13. august 2026) — ikke et tal denne fork havde tildelt.

Efter fjernelsen af NHS-reglerne er DAP SPC ikke en nyere udgave af
AUS-DOH-visualen, men et andet produkt med et andet regelsæt, eget navn og
eget GUID. En fælles nummerserie ville få de to til at se sammenlignelige ud
og ville kollidere ved fremtidige merges fra upstream. Repoet havde ingen tags
og ingen udgivelser på tidspunktet for skiftet, så ingen versionshistorik
brydes.

Kommende merges fra upstream noteres her med deres commit, så relationen kan
slås op uden at være bundet ind i versionsnummeret.

### Nye features

* **Seriediagram er nu standard-diagramtypen.** `qicharts2` defaulter til
  `run`, og et seriediagram stiller ingen krav til fordelingen — det er derfor
  det sikre udgangspunkt, før brugeren aktivt vælger diagramtype. Rapporter,
  hvor diagramtypen allerede er valgt, er upåvirkede.
* **Signalpanel** (settings → Signal Panel): tallene bag signalerne vist
  permanent til højre for grafen — faktisk værdi over for forventet, én blok
  per periode. Rækkerne er `Serielængde (maksimum)`, `Antal kryds (minimum)`,
  `Antal brugbare obs.` og — kun når chart-typen har kontrolgrænser —
  `Obs. uden for kontrolgrænse`. Alle etiketter kan overskrives i
  formateringsruden.
* **Signaltal i tooltip**: samme tal som panelet, tilgængelige ved hover uden
  at panelet fylder i layoutet.
* Begge Anhøj-regler er nu slået **til** som default.
* **Dansk brugerflade**: formateringsruden, tooltips, oversigtstabellen,
  feltbrøndene og alle fejlbeskeder er oversat. Tal vises med decimalkomma.
* **Kontrolgrænse-bånd** (Linjer → 99%-kontrolgrænser): området mellem de to
  3σ-grænser kan udfyldes som en flade, der aflæses lettere end to streger
  alene. **Default fra** — en tilvalgt læsehjælp, ikke en ændring af
  `qicharts2`'s udtryk. Ét bånd per fase; ved et faseskift ændrer grænserne
  sig i et spring, og en sammenhængende flade ville ikke svare til nogen af
  faserne.
* **Nyt ikon** i visualiseringsruden: en serie med et fremhævet langt stræk på
  samme side af centerlinen — det, visualen er lavet for at opdage.

### Fjernet

Regelsættet er skåret ned til de to signaler, `qicharts2` rapporterer:
`runs.signal` (Anhøj-reglerne) og `sigma.signal` (`astronomical` — punkter
uden for kontrolgrænserne).

* `trend` (n stigende/faldende punkter i træk) — NHS-regel, ikke dansk praksis.
* `twoInThree` (2 af 3 uden for 2-sigma) — NHS-regel.
* `shift` (fast n punkter i træk på samme side af centerlinjen) — Anhøj-reglen
  om lange serier dækker samme fænomen, men med en tærskel der vokser med
  serielængden (`round(log2(n)) + 3`) frem for at være hardkodet.
* NHS' variations- og sikkerhedsikoner, deres indstillingskort, de tilhørende
  summary table-filtre (`table_variation_filter`, `table_assurance_filter`) og
  valideringsreglerne omkring dem.

`astronomical` er bevaret.

Grænsefladen er derudover skåret ned til centerlinje og 3σ, så det viste
svarer til det, metoden faktisk bygger på:

* **95%- og 68%-kontrolgrænser** (2σ og 1σ). `qicharts2` kender ét sæt
  grænser; 1σ har intet modstykke overhovedet, og 2σ vises ikke som default
  (`show.95 = FALSE`). To sæt grænser inviterer til at aflæse 2σ som et
  signal, hvilket hverken metoden eller `qicharts2` understøtter.
* **Valget af hvilken grænse `astronomical` måler imod.** Den måler nu altid
  mod 3σ, som `qicharts2`'s `sigma.signal`. En rapport med indstillingen gemt
  som `1 Sigma` eller `2 Sigma` flager derfor andre punkter end før.
* **Retningsfarverne.** Et punkt uden for kontrolgrænsen fik tidligere farve
  efter, om afvigelsen var en forbedring eller en forværring. Den vurdering
  hører ikke til i `sigma.signal`, som kun kender inden for og uden for. De
  fire farvevælgere er erstattet af én.
* **Specifikationsgrænser** og **trendlinjen** (regressionsoverlay) — begge
  uden modstykke i `qicharts2`. Trend*linjen* er ikke trend*reglen*; navnene
  ligner hinanden, men det er to forskellige ting, og begge er væk nu.
* **Download-knappen**, som gemte grafen som billede. Power BI har selv den
  funktion.
* **`i_m` og `i_mm`** er skjult i chart-type-listen. Beregningerne er urørte,
  så en rapport, der allerede bruger dem, renderer som før — de tilbydes bare
  ikke længere som et nyt valg.

**Opgradering:** rapporter, der brugte de fjernede indstillinger, mister dem i
formateringsruden. Selve dataene og de øvrige indstillinger er upåvirkede.

### Rettelser

* Kontrolgrænser, der ikke er reelle tal, tælles ikke længere som brud. En
  konstant serie på et i-chart gav `0/0`-grænser, og hele serien blev talt som
  uden for kontrol.
* Guard mod manglende colour palette rettet, så høj kontrast-tilstand
  detekteres korrekt.
* Signalpanelets kolonnebredde skaleres nu efter det faktiske antal cifre, så
  store observationstal ikke løber ud over panelet ved høj skriftstørrelse.
* 1σ-rækken i tooltip kunne aldrig vises: koden slog `show_65` og
  `ttip_show_65` op, hvor indstillingerne hedder `_68`. En tastefejl arvet fra
  upstream. Moot her, hvor 1σ er fjernet, men den findes stadig opstrøms.

### Interne ændringer

* Testene kører på Vitest i headless Chromium (tidligere Karma/Jasmine).
* `anhojRunsAnalysis()` i `src/Outlier Flagging/anhojShared.ts` er nu den ene
  kilde til runs-aritmetikken; `anhojLongRun`/`anhojFewCrossings` er tynde
  wrappers om den. Panel og tooltip læser hele statistik-objektet.
* Runs-analysen undertrykkes på mr-charts, hvor på hinanden følgende
  observationer deler datapunkt og uafhængighedsantagelsen ikke holder.
  Tallene vises stadig; kun verdiktet holdes tilbage. Samme adfærd som
  `qicharts2`.
* `anhojFixturesSync.test.ts` sikrer, at TypeScript-kopien af fixtures ikke
  driver fra det, R-scriptet genererer.

## F1 — Anhøj-regler

*Udviklingsforløb, aldrig udgivet separat; indgår i 1.0.0.0. Stinavne i
formateringsruden nedenfor er dem, der gjaldt undervejs.*

### Nye features

* **Anhøj long-run-regel** (settings → Outlier Settings → Anhøj Rules): stipler
  centerline når længste run på samme side af centerline overstiger den
  dynamiske tærskel `round(log2(n_useful)) + 3`. Seriesignal per data-gruppe —
  ingen punktmarkering, eksakt som `qicharts2`'s `runs.analysis`.
* **Anhøj few-crossings-regel**: stipler centerline når antallet af median-
  krydsninger er under den binomialt-baserede tærskel
  `qbinom(0.05, n_useful - 1, 0.5)`.
* **Per-data-gruppe-signal-rendering**: i multi-group / rebaseline-charts dasher
  kun de centerline-segmenter hvis gruppe har Anhøj-signal — øvrige segmenter
  forbliver solid.

### Interne ændringer

* Ny statistisk helper `src/Functions/qbinom.ts` (kvantilfunktion for
  binomialfordelingen; inkrementel log-PMF-rekurrens, uden `lgamma`-kald i
  hot path).
* `outliersObject`-type udvidet med per-group-signal-array
  `per_group_signals: { long_run, few_crossings }[]` til centerline-rendering.
* Per-punkt-flagging af long-runs (NHS-stil udvidelse fra tidlig F1-iteration)
  fjernet igen efter empirisk qicharts2-review: Anhøj-metoden flagger ikke
  enkeltpunkter, kun seriesignal → stiplet centerline. Tilhørende
  colour-picker-settings fjernet fra settings + capabilities.
* `lineData`-type udvidet med `group_signal_dashed?: boolean`.
* Test-fixtures regenereret fra `qicharts2` v0.8.1
  (`test/Outlier Flagging/anhoj-fixtures-gen.R`).

### Reference

* Anhøj-rules implementeret iht. `qicharts2` v0.8.1 (Anhoej, Olesen).
* `qicharts2::qic` source: <https://github.com/anhoej/qicharts2>.
