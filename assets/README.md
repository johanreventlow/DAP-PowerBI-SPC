# Ikon

To filer, to formål. Det er bevidst, og de skal holdes i sync i hånden.

| Fil | Størrelse | Kilde | Hvor den ses |
|---|---|---|---|
| `icon.png` | 20×20 | sat i hånden, pixel for pixel | visualiseringsruden i Power BI |
| `icon.svg` | vektor | — | kilde til `large-icon.png` |
| `large-icon.png` | 300×300 | genereret fra `icon.svg` | AppSource og detaljevisning |

`pbiviz.json` peger på `icon.png`.

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
| Serie | `#424240` | 3,69–5,56:1 mod båndet |
| Datapunkter | `#000000` | 11,60:1 mod båndet |
| Akse | `#6b7480` | 4,74:1 mod hvid, 3,43:1 mod mørk |

`#3e89c1` er projektets blå og bruges også i visualen.

I `icon.png` er serien ikke én farve, men en håndsat udglatning hen over
26 pixels. Tallet i tabellen er spændet. I `icon.svg` er den én streg.

## Hvilken baggrund hvert element måles imod

Det afgør, hvilke krav der giver mening, og det er ikke det samme for alle
elementer.

**Aksen** er det eneste, der rører den gennemsigtige baggrund. Den skal derfor
klare både lyst og mørkt tema, og vinduet er smalt: relativ luminans mellem
0,143 og 0,300. Uden for det falder den igennem i det ene tema eller det andet.
Sort klarer kun lyst tema — derfor er aksen ikke sort.

**Serien, punkterne, centerlinjen** ligger alle oven på båndet, som er
uigennemsigtigt. Deres kontrast er den samme i begge temaer, og det er båndet,
ikke sidens baggrund, de skal måles imod. Her er mørkt det rigtige valg.

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
