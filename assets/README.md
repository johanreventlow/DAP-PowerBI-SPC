# Ikon

To filer, to formål. Det er bevidst, og de skal holdes i sync i hånden.

| Fil | Størrelse | Kilde | Hvor den ses |
|---|---|---|---|
| `icon.png` | 20×20 | sat i hånden, pixel for pixel | visualiseringsruden i Power BI |
| `icon.svg` | vektor | — | kilde til `large-icon.png` |
| `large-icon.png` | 300×300 | genereret fra `icon.svg` | AppSource og detaljevisning |

`pbiviz.json` peger på `icon.png`.

## Sikker zone: den yderste pixelring vises ikke

Power BI klipper den yderste pixelring væk, når ikonet vises i
visualiseringsruden. Det blev opdaget, fordi aksen forsvandt: den lå i
kolonne 0 og række 19, altså præcis i den ring.

**Læg intet i ring 0 eller 19.** Alt indhold ligger nu inden for x 1..18 og
y 1..18, med aksen langs x=1 og y=18. Kontrollér efter en ændring, at ringen
er tom:

```
python3 -c "
from PIL import Image
p = Image.open('assets/icon.png').convert('RGBA').load()
ring = ([p[i,0] for i in range(20)] + [p[i,19] for i in range(20)]
        + [p[0,i] for i in range(20)] + [p[19,i] for i in range(20)])
print('ikke-tomme pixels i yderste ring:', sum(1 for c in ring if c[3] > 0))
"
```

De 18×18, der er tilbage, er den reelle tegneflade. Det er en tredjedel
mindre areal end de 20×20 antyder, og det er værd at huske, næste gang
motivet skal ændres.

## Hvorfor de 20×20 ikke kommer fra vektoren

Det oplagte ville være at have én kilde og generere begge størrelser ud fra
den. Det blev prøvet, og resultatet er dårligere: ved 20×20 udglattes seriens
diagonaler over to pixels, og kurven bliver grødet. Stregvægte fra 1,0 til 1,6
og `shape-rendering="crispEdges"` blev afprøvet — ingen af dem nåede den
håndsatte version, hvor hver pixel er placeret med vilje.

Ved 300×300 er det omvendt: dér er vektoren skarp, og en opskalering af de
20×20 giver klodser på 15×15.

Prisen er, at farverne står to steder. Ændres en farve, skal begge filer
rettes. Paletten står i tabellen nedenfor.

## Motivet

Et kontroldiagram: centerlinje, to kontrolgrænser med et udfyldt bånd imellem,
og en serie på seks datapunkter, der svinger om centerlinjen.

**Fjerde datapunkt ligger over den øvre kontrolgrænse.** Det er motivets
pointe: visualen findes for at finde den slags punkter.

Punktet ligger tre rækker over sin oprindelige plads, ikke to. Ved to rørte
det grænselinjen i rækken under, og da de er nært beslægtede blå — 1,32:1
imellem sig — smeltede punktet sammen med linjen. Den tredje række giver den
tomme række, der skal til, for at det læses som et punkt.

Det tidligere ikon viste en usædvanligt lang serie — det ene af de to signaler,
runs-analysen leder efter. Det havde for mange detaljer til 20×20: den stiplede
centerlinje blev til tåge, og punkterne smeltede sammen med linjen. Det gamle
motiv og dets SVG-kilde ligger i historikken frem til `5b14844`.

## Palet

| Element | Farve | Kontrast |
|---|---|---|
| Bånd | `#a3c4e6` | 1,81:1 mod hvid |
| Kontrolgrænser | `#3e89c1` | 3,78:1 mod hvid, 4,30:1 mod mørk |
| Centerlinje | `#1a76aa` | 4,98:1 mod hvid, 3,26:1 mod mørk |
| Serie, inde i båndet | `#424240` | 3,69–5,56:1 mod båndet |
| Serie, uden for båndet | `#6b7480` | 4,74:1 mod hvid, 3,43:1 mod mørk |
| Datapunkter | `#000000` | 11,60:1 mod båndet |
| Punkt uden for kontrol | `#1a76aa` | 4,98:1 mod hvid, 3,26:1 mod mørk |
| Akse | `#6b7480` | 4,74:1 mod hvid, 3,43:1 mod mørk |

`#3e89c1` er projektets blå og bruges også i visualen.

Brudpunktet har samme blå som centerlinjen. Visualens egen farve for punkter
uden for kontrol (`beyond_limit`, `#490092`) blev prøvet først, men ikonet
holder sig til to blå og en grå, og en tredje kulør trak uforholdsmæssigt
meget opmærksomhed i et felt på 400 pixels.

I `icon.png` er serien ikke én farve, men en håndsat udglatning hen over
26 pixels. Tallet i tabellen er spændet. I `icon.svg` er den én streg.

## Hvilken baggrund hvert element måles imod

Det afgør, hvilke krav der giver mening, og det er ikke det samme for alle
elementer.

**Aksen** er det eneste, der rører den gennemsigtige baggrund. Den skal derfor
klare både lyst og mørkt tema, og vinduet er smalt: relativ luminans mellem
0,143 og 0,300. Uden for det falder den igennem i det ene tema eller det andet.
Sort klarer kun lyst tema — derfor er aksen ikke sort.

**Serien, punkterne, centerlinjen** ligger oven på båndet, som er
uigennemsigtigt. Deres kontrast er den samme i begge temaer, og det er båndet,
ikke sidens baggrund, de skal måles imod. Her er mørkt det rigtige valg.

**Toppen, der stikker op over den øvre grænse**, er undtagelsen. Dér slipper
serien båndet og rører baggrunden, og en mørk streg ville falde igennem på
mørkt tema. Derfor skifter serien til aksens grå over grænselinjen. I
`icon.svg` gøres det med en `clipPath` over række 5, så kurven kun står ét
sted.

Brudpunktet selv ligger højt nok til at have den gennemsigtige baggrund hele
vejen rundt, og `#1a76aa` klarer 4,98:1 og 3,26:1.

**Båndet** ligger bevidst under de 3:1, grafik ellers bør have. Det er en
baggrundsflade, og grænselinjerne er dens kant — jo mørkere båndet bliver, jo
mere æder det linjerne. Ved 1,81:1 står de 2,09:1 fri af det.

Baggrunden er gennemsigtig. Det er væsentligt: en uigennemsigtig hvid baggrund
ser upåfaldende ud på lyst tema og lyser op som en lampe på mørkt.

## Regenerering

Efter en ændring i `icon.svg`:

```
pip install cairosvg
python3 -c "
import cairosvg
cairosvg.svg2png(bytestring=open('assets/icon.svg','rb').read(),
                 write_to='assets/large-icon.png',
                 output_width=300, output_height=300)
"
```

`icon.png` genereres ikke — den redigeres i hånden i en pixeleditor. Kontrollér
altid resultatet ved faktisk 20×20, ikke kun forstørret. Et ikon, der ser
rigtigt ud ved 200 %, kan være mudder ved 100 %.
