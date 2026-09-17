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
| Kontrolgrænser og bånd | `#809bbc` | temafarve 2 |
| Punkt uden for kontrol | `#C47B00` | neutral signalfarve |
| Tekst, akser, rammer, mållinjer | `#333333` | `foreground` |
| Lys baggrund (tabelhoved) | `#e3e2e1` | `backgroundLight` |
| Signalfremhævning i panelet | `#605E5C` | `lightLabel` |
| Skrifttype | Segoe UI | alle `textClasses` |
| Skriftstørrelse | 12 | `label` og `header` |

Båndet tegnes med 0,15 i opacitet og bliver derfor en lys tone af
grænsefarven, ikke en flade i fuld styrke.

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

Guiden kræver "tydelig kontrast mellem primære elementer". De to sidste rækker
er dem, det handler om.

**Kendt svaghed:** brudpunktet står kun 1,19:1 fra grænselinjen. Ligger et
punkt tæt på grænsen, er de to svære at skelne. Det kræver rigtige data at
vurdere, om det er et problem i praksis.

## Temauddrag til den centrale temafil

`regionh-temauddrag.json` indeholder en `DAPSPC`-blok med de samme værdier.
Lægges dens `visualStyles.DAPSPC` ind i Region H's temafil, er det temaet —
ikke visualens defaults — der bestemmer udseendet, og en fremtidig
temaopdatering slår igennem uden en ny version af visualen.

Temafilen styrer i dag kun indbyggede visualtyper; der er ingen blok for
tredjeparts-visuals.

Bemærk, at uddraget så bliver en kilde mere til de samme farver. Ændres
paletten i `src/Settings Model/common.ts`, skal uddraget rettes med.
