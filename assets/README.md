# Ikon

`icon.png` er kilden. Den er tegnet i hånden direkte i 20×20 — den størrelse,
ikonet faktisk vises i — og der findes ikke en vektorkilde bag den.

| Fil | Størrelse | Hvor den ses |
|---|---|---|
| `icon.png` | 20×20 | visualiseringsruden i Power BI |
| `large-icon.png` | 300×300 | AppSource og detaljevisning |

`pbiviz.json` peger på `icon.png`.

## Motivet

Et kontroldiagram: centerlinje, to kontrolgrænser med et udfyldt bånd imellem,
og en serie, der svinger om centerlinjen.

Det tidligere ikon viste i stedet en usædvanligt lang serie — det ene af de to
signaler, runs-analysen leder efter. Det blev skiftet ud, fordi motivet havde
for mange detaljer til at overleve 20×20: den stiplede centerlinje blev til
tåge, og punkterne smeltede sammen med linjen. Det gamle motiv og dets
SVG-kilde ligger i historikken frem til `5b14844`.

## Farver

| Element | Farve | Mod hvid | Mod mørk |
|---|---|---|---|
| Akse, serie | `#424240` | 10,07:1 | 1,61:1 |
| Datapunkter | `#000000` | 21,00:1 | 1,29:1 |
| Kontrolgrænser | `#3e89c1` | 3,78:1 | 4,30:1 |
| Centerlinje | `#1a76aa` | 4,98:1 | 3,26:1 |
| Bånd | `#a3c4e6` | 1,81:1 | 8,97:1 |

`#3e89c1` er projektets blå og bruges også i visualen.

Båndet ligger bevidst under de 3:1, grafik ellers bør have. Det er en
baggrundsflade, og grænselinjerne er dens kant — jo mørkere båndet bliver, jo
mere æder det linjerne. Ved 1,81:1 står de 2,09:1 fri af det.

Baggrunden er gennemsigtig. Det er væsentligt: en uigennemsigtig hvid baggrund
ser upåfaldende ud på lyst tema og lyser op som en lampe på mørkt.

## To kendte mangler

**Serien og aksen er næsten sorte** og giver derfor 1,61:1 og 1,29:1 på mørkt
tema. Ikonet er skarpt på lyst tema og svagt på mørkt. Skal ét ikon holde
begge steder, skal de to elementer lysnes til en mellemtone, sådan som de blå
toner allerede ligger.

**`large-icon.png` er en ren opskalering** af de 20×20 med faktor 15 og uden
udglatning. Motivet er det rigtige, men ved 300×300 ses hver pixel som en
15×15 klods. Det holder ikke til AppSource.

Begge dele løses af det samme: en vektorkilde. Tegnes motivet som SVG, kan
farverne justeres ét sted, og begge PNG'er kan genereres skarpt i hver sin
størrelse.

## Regenerering

Så længe kilden er en 20×20 PNG, genereres den store sådan her:

```
python3 -c "
from PIL import Image
im = Image.open('assets/icon.png').convert('RGBA')
im.resize((300, 300), Image.NEAREST).save('assets/large-icon.png')
"
```

`Image.NEAREST` er bevidst: alt andet slører kanterne uden at tilføje detalje,
som ikke findes i kilden.
