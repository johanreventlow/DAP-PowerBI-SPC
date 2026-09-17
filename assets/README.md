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

Farverne er Power BI's egne ikonfarver, så visualen står som en af husets i
visualiseringsruden.

| Element | Farve | Mod hvid | Mod mørk | Mod båndet |
|---|---|---|---|---|
| Bånd | `#83beec` | 1,99:1 | 8,16:1 | — |
| Kontrolgrænser | `#0063b1` | 6,14:1 | 2,65:1 | 3,08:1 |
| Centerlinje | `#0063b1` | 6,14:1 | 2,65:1 | 3,08:1 |
| Punkt uden for kontrol | `#0063b1` | 6,14:1 | 2,65:1 | 3,08:1 |
| Serie | `#3a3a38` | 11,40:1 | 1,43:1 | 5,72:1 |
| Datapunkter | `#000000` | 21,00:1 | 1,29:1 | 10,54:1 |
| Akse | `#3a3a38` | 11,40:1 | 1,43:1 | — |

## Mørkt tema er bevidst nedprioriteret

`#3a3a38` giver 1,43:1 mod en mørk baggrund. Aksen og den del af serien, der
stikker op over grænselinjen, er derfor svage på mørkt tema. Båndet og de blå
linjer står fint, og brudpunktet kan ses, så motivet er stadig læseligt — men
det er tydeligt tegnet til en lys rude.

Det er et bevidst valg: at bruge Power BI's egne ikonfarver vejer tungere end
at klare begge temaer lige godt, og ruden er lys i langt de fleste
installationer.

En tidligere version brugte mellemtoner, der klarede 3:1 i begge temaer, og en
særlig lysere farve til den del af serien, der forlader båndet. Det er væk nu —
med én serie-farve er den konstruktion overflødig.

## Hvilken baggrund hvert element måles imod

Det afgør, hvilke krav der giver mening, og det er ikke det samme for alle
elementer.

**Serien, punkterne, centerlinjen** ligger oven på båndet, som er
uigennemsigtigt. Deres kontrast er den samme i begge temaer, og det er båndet,
ikke sidens baggrund, de skal måles imod. Alle tre ligger over 3:1 dér.

**Aksen, grænselinjerne og brudpunktet** rører den gennemsigtige baggrund og
afhænger derfor af temaet. Det er dem, kompromiset ovenfor handler om.

**Båndet** er en baggrundsflade, og grænselinjerne er dens kant. Det giver 1,99:1
mod hvid — bevidst under de 3:1, grafik ellers bør have, for at linjerne på det
kan ses. De står 3,08:1 fri af det.

Baggrunden er gennemsigtig. En uigennemsigtig hvid baggrund ser upåfaldende ud
på lyst tema og lyser op som en lampe på mørkt.

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
