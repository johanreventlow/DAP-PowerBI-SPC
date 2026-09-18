# Region H's Power BI-tema

Visualens standardfarver og -skrifttype følger Region Hovedstadens temafil, så
den står som en af husets i en rapport frem for som et fremmedelement.

**Kilder:** `Temafil Juni 2026` (fra Rapportskabelonen) og *Power BI
Designguide & Opsætningsvejledning* v1.3, 03-09-2024.

Temafilen fra juni 2026 og den fra november 2023 har **samme otte temafarver,
samme semantiske farver og samme skrifttyper**. Kontrolleret ved at
sammenligne de to filer felt for felt. Det, der ændrede sig, er den globale
`*`-blok, som er blevet slankere, og fem ekstra visualtyper.

## Paletten

| Vores rolle | Farve | Temaets navn |
|---|---|---|
| Dataserien | `#002555` | temafarve 1 |
| Centerlinjen | `#99a8bb` | lys tone af temafarve 1 |
| Kontrolgrænser | `#809bbc` | temafarve 2 |
| Fladen mellem grænserne | `#CCD7E4` | lys tone af temafarve 2 |
| Punkt uden for kontrol | `#C47B00` | neutral signalfarve |
| Tekst, akser, rammer, mållinjer | `#333333` | `foreground` |
| Lys baggrund (tabelhoved) | `#e3e2e1` | `backgroundLight` |
| Signalfremhævning i panelet | `#605E5C` | `lightLabel` |
| Skrifttype | Segoe UI | alle `textClasses` |
| Skriftstørrelse | 12 | `label` og `header` |

De to lyse toner står ikke i temafilen. De er valgt til rollen: centerlinjen
og fladen er referencer, som serien skal læses op imod, og de må derfor ikke
konkurrere med den.

Fladen tegnes uigennemsigtigt bag linjer og punkter, så farven i tabellen er
den, der ses. Stregtykkelserne følger samme rangorden: serien 3 px og
punkterne radius 5, centerlinjen 2 px, grænserne 1 px.

Alle tre linjer er fuldt optrukne. Dermed er en stiplet linje ikke længere
bare en stilart i diagrammet, men betyder én ting: den stiplede centerlinje,
der markerer et signal i seriens mønster.

## Hvorfor brudpunktet er orange og ikke rødt

Designguidens §3 om farvebrug siger:

> Farverne grøn og rød bruges **kun** til emner, der har en klar positiv eller
> negativ værdi (fx trivsel eller hændelser, der kræver akut handling).
> Neutrale emner (fx afvigelse fra en målsætning) bør **altid** indikeres med
> den orange farve `#C47B00`.

Et punkt uden for kontrolgrænserne er netop et neutralt emne. `sigma.signal`
er en ren boolean per punkt: den siger, at processen har ændret sig, ikke om
ændringen er god. Det er samme grund til, at retningsfarverne blev fjernet i
trin 3 af `complete-qicharts2-alignment` — huset og metoden er enige her.

## Kontrast

| Par | Forhold |
|---|---|
| Serie mod hvid | 15,05:1 |
| Grænser mod hvid | 2,86:1 |
| Brudpunkt mod hvid | 3,40:1 |
| Tekst mod hvid | 12,63:1 |
| Serie mod grænser | 5,25:1 |
| Brudpunkt mod serie | 4,43:1 |
| Serie mod fladen | 10,32:1 |
| Grænser mod fladen | 1,96:1 |
| Centerlinje mod fladen | 1,66:1 |

Guiden kræver "tydelig kontrast mellem primære elementer". Rækkerne, hvor
serien og brudpunktet står mod de øvrige elementer, er dem, det handler om.

**Kendt svaghed:** brudpunktet står kun 1,19:1 fra grænselinjen. Ligger et
punkt tæt på grænsen, er de to svære at skelne. Det kræver rigtige data at
vurdere, om det er et problem i praksis.

**Kendt svaghed:** centerlinjen (1,66:1) og grænserne (1,96:1) står under
WCAG's 3:1 for ikke-tekstligt indhold, når de ligger oven på fladen. Det er
en bevidst prioritering: serien skal stå alene forrest, og de tre lyse
elementer er dens baggrund. Skal kontrasten op, er det centerlinjen, der skal
mørkere — ikke fladen, som ellers begynder at konkurrere med serien.

## Temauddrag til den centrale temafil

`regionh-temauddrag.json` indeholder en `DAPSPC`-blok med de samme værdier.
Lægges dens `visualStyles.DAPSPC` ind i Region H's temafil, er det temaet —
ikke visualens defaults — der bestemmer udseendet, og en fremtidig
temaopdatering slår igennem uden en ny version af visualen.

Temafilen styrer i dag kun indbyggede visualtyper; der er ingen blok for
tredjeparts-visuals.

Bemærk, at uddraget så bliver en kilde mere til de samme farver. Ændres
paletten i `src/Settings Model/common.ts`, skal uddraget rettes med.
