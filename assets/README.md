# Ikon

`icon.svg` er kilden. De to PNG'er genereres ud fra den og redigeres ikke i
hånden.

| Fil | Størrelse | Hvor den ses |
|---|---|---|
| `icon.png` | 20×20 | visualiseringsruden i Power BI |
| `large-icon.png` | 300×300 | AppSource og detaljevisning |

`pbiviz.json` peger på `icon.png`.

## Motivet

En serie med seks observationer i træk over centerlinjen efterfulgt af et fald
under den. Det er en usædvanligt lang serie — det ene af de to signaler,
runs-analysen leder efter.

## Farven

`#3e89c1` — rgb(62, 137, 193). Står tre steder i `icon.svg`: fill på `<svg>`,
og stroke på centerlinjen og på serielinjen.

Tonen kommer fra biSPCharts, oprindeligt rgb(141, 185, 218). Den viste sig for
lys: 2,08:1 i kontrast mod hvid, hvor grafik bør have mindst 3:1 for at kunne
aflæses. Farven her har samme nuance (206°) og samme mætning (51 %), men lavere
lyshed, og lander på 3,78:1.

Mørkere end dette gør den mere læsbar på lys baggrund, men svagere på mørkt
tema, hvor forholdet vender. 3,78:1 er valgt som det punkt, der holder i begge.

## Stregvægte

Centerlinjen har `stroke-width="0.8"` og serielinjen `0.7`. Det er tungere end
motivet har i en webkontekst, og det er med vilje: ikonet vises reelt ved
20×20, hvor viewBox'ens 16 enheder skaleres med 1,25. Ved den oprindelige vægt
på 0,5 med halv opacitet blev centerlinjen under én pixel og forsvandt — og den
er den vigtigste streg i motivet, fordi medianen er hele pointen i metoden.

## Regenerering

Efter en ændring i `icon.svg`:

```
pip install cairosvg
python3 -c "
import cairosvg
svg = open('assets/icon.svg','rb').read()
cairosvg.svg2png(bytestring=svg, write_to='assets/icon.png', output_width=20, output_height=20)
cairosvg.svg2png(bytestring=svg, write_to='assets/large-icon.png', output_width=300, output_height=300)
"
```

Kontrollér resultatet ved faktisk 20×20, ikke kun forstørret. Et ikon, der ser
rigtigt ud ved 200 %, kan være mudder ved 100 %.
